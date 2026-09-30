const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn, execFile } = require('child_process');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
const { setupAutoUpdater, stopAutoUpdater } = require('./updater');

const appRoot = app.isPackaged ? path.join(process.resourcesPath, 'app') : path.resolve(__dirname, '..');
const backendDir = path.join(appRoot, 'backend');
const frontendDir = path.join(appRoot, 'frontend');
const backendEntry = path.join(backendDir, 'dist', 'index.js');
const frontendStart = path.join(frontendDir, 'node_modules', 'next', 'dist', 'bin', 'next');
const backendUrl = 'http://127.0.0.1:4000/api/health';
const backendReadyUrl = 'http://127.0.0.1:4000/api/keep-alive';
const frontendUrl = 'http://127.0.0.1:3050/dashboard';
const forceDevMode = process.env.E_SYSTEM_DEV === '1';
const backendIsBuilt = fs.existsSync(backendEntry);
const frontendIsBuilt = fs.existsSync(path.join(frontendDir, '.next', 'BUILD_ID'));
const nodeCandidates = [
  app.isPackaged ? process.execPath : null,
  process.env.NODE_EXE,
  'C:\\Program Files\\nodejs\\node.exe',
  'C:\\Program Files (x86)\\nodejs\\node.exe',
  path.join(process.env.ProgramFiles || 'C:\\Program Files', 'nodejs', 'node.exe'),
  path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'nodejs', 'node.exe'),
].filter(Boolean);

const nodeExe = nodeCandidates.find((candidate) => fs.existsSync(candidate)) || 'node';

let mainWindow = null;
let backendProcess = null;
let frontendProcess = null;

ipcMain.handle('app:get-version', () => app.getVersion());

function getInstallConfigPaths() {
  const localAppData = process.env.LOCALAPPDATA || path.join(app.getPath('userData'), '..');
  const programData = process.env.ProgramData || process.env.PROGRAMDATA || 'C:\\ProgramData';
  return [
    path.join(localAppData, 'E-System School', 'install-settings.ini'),
    path.join(programData, 'E-System School', 'install-settings.ini'),
    path.join(programData, 'E-System School', 'install-settings.json'),
  ];
}

function parseInstallationSettings(raw) {
  try {
    return JSON.parse(raw);
  } catch (_) {
    const readValue = (name) => raw.match(new RegExp(`^${name}=(.*)$`, 'mi'))?.[1]?.trim();
    return {
      dataDirectory: readValue('dataDirectory'),
      receiptDirectory: readValue('receiptDirectory'),
    };
  }
}

function directoryHasFiles(directory) {
  try {
    return fs.readdirSync(directory, { withFileTypes: true }).some((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isFile() || (entry.isDirectory() && directoryHasFiles(entryPath));
    });
  } catch (_) {
    return false;
  }
}

function restoreInterruptedUpdatePath(directory, backupName) {
  const backupDirectory = path.resolve(
    path.dirname(directory),
    '..',
    'E-System School Update Backup',
    backupName
  );
  return !directoryHasFiles(directory) && directoryHasFiles(backupDirectory) ? backupDirectory : directory;
}

function readInstallationSettings() {
  const defaults = {
    dataDirectory: path.join(app.getPath('userData'), 'data'),
    receiptDirectory: path.join(app.getPath('userData'), 'receipts'),
  };

  for (const configPath of getInstallConfigPaths()) {
    try {
      const parsed = parseInstallationSettings(fs.readFileSync(configPath, 'utf8'));
      return {
        dataDirectory:
          typeof parsed.dataDirectory === 'string' && path.isAbsolute(parsed.dataDirectory)
              ? restoreInterruptedUpdatePath(parsed.dataDirectory, 'Data')
            : defaults.dataDirectory,
        receiptDirectory:
          typeof parsed.receiptDirectory === 'string' && path.isAbsolute(parsed.receiptDirectory)
              ? restoreInterruptedUpdatePath(parsed.receiptDirectory, 'Receipts')
            : defaults.receiptDirectory,
      };
    } catch (_) {
      // Try the next location used by an earlier distribution format.
    }
  }

  return defaults;
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

function waitForUrl(url, timeoutMs = 120000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tick = () => {
      const client = url.startsWith('https:') ? https : http;
      const request = client.request(url, { method: 'GET' }, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve(true);
          return;
        }
        retry();
      });

      request.on('error', retry);
      request.setTimeout(2000, () => {
        request.destroy();
        retry();
      });
      request.end();
    };

    const retry = () => {
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(tick, 1000);
    };

    tick();
  });
}

function startProcess(command, args, cwd, extraEnv = {}) {
  return spawn(command, args, {
    cwd,
    windowsHide: true,
    stdio: 'ignore',
    shell: false,
    detached: false,
    env: { ...process.env, ...extraEnv },
  });
}

function killProcess(proc) {
  if (!proc || proc.killed) return;
  try {
    if (proc.pid) {
      execFile('taskkill', ['/pid', String(proc.pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
      });
    }
  } catch (_) {
    try {
      proc.kill();
    } catch (_) {
      // ignore
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    show: false,
    title: 'E-System School',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadURL(
    'data:text/html;charset=utf-8,' +
      encodeURIComponent(
        '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>E-System School</title><style>body{margin:0;font-family:Segoe UI,Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#f7f7f7;color:#222}div{font-size:18px;letter-spacing:.2px}</style></head><body><div>Starting E-System School...</div></body></html>'
      )
  );

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      if (new URL(url).origin !== 'http://127.0.0.1:3050') event.preventDefault();
    } catch (_) {
      event.preventDefault();
    }
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

ipcMain.handle('select-receipt-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: 'เลือกโฟลเดอร์เก็บใบเสร็จ',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

async function launchApp() {
  createWindow();
  const installation = readInstallationSettings();
  const childEnvironment = {
    DATA_DIR: installation.dataDirectory,
    RECEIPT_OUTPUT_DIR: installation.receiptDirectory,
    ...(!app.isPackaged ? { DOTENV_CONFIG_PATH: path.join(backendDir, '.env') } : {}),
    ...(app.isPackaged ? { ELECTRON_RUN_AS_NODE: '1' } : {}),
  };

  if (!backendProcess) {
    if (!forceDevMode && backendIsBuilt) {
      backendProcess = startProcess(nodeExe, [backendEntry], backendDir, childEnvironment);
    } else {
      backendProcess = startProcess(
        nodeExe,
        [path.join(backendDir, 'node_modules', 'ts-node-dev', 'lib', 'bin.js'), '--respawn', '--transpile-only', 'src/index.ts'],
        backendDir,
        childEnvironment
      );
    }
  }

  if (!frontendProcess) {
    if (!forceDevMode && frontendIsBuilt) {
      frontendProcess = startProcess(nodeExe, [frontendStart, 'start', '-p', '3050'], frontendDir, childEnvironment);
    } else {
      frontendProcess = startProcess(nodeExe, [frontendStart, 'dev', '-p', '3050'], frontendDir, childEnvironment);
    }
  }

  await waitForUrl(backendUrl);
  await waitForUrl(backendReadyUrl);
  await waitForUrl(frontendUrl);

  if (mainWindow && !mainWindow.isDestroyed()) {
    await mainWindow.loadURL(frontendUrl);
    mainWindow.show();
    setupAutoUpdater(mainWindow);
  }
}

app.on('before-quit', () => {
  stopAutoUpdater();
  killProcess(frontendProcess);
  killProcess(backendProcess);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  launchApp().catch((error) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(
        'data:text/html;charset=utf-8,' +
          encodeURIComponent(
            `<html><body style="font-family:Segoe UI,Arial,sans-serif;padding:24px"><h2>Unable to start E-System School</h2><pre>${String(
              error && error.message ? error.message : error
            )}</pre></body></html>`
          )
      );
      mainWindow.show();
    } else {
      console.error(error);
      app.quit();
    }
  });
});

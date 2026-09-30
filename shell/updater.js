const { app, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const path = require('path');

const UPDATE_CHANNELS = {
  idle: 'update:idle',
  checking: 'update:checking',
  available: 'update:available',
  progress: 'update:progress',
  downloaded: 'update:downloaded',
  error: 'update:error',
};

let mainWindow = null;
let updateState = { phase: 'idle' };
let pendingUpdateInfo = null;
let updateCheckTimer = null;
let installTimer = null;
let installingUpdate = false;

function sendState(phase, details = {}) {
  updateState = { phase, ...details };

  if (!mainWindow || mainWindow.isDestroyed()) return;
  const channel = UPDATE_CHANNELS[phase];
  if (channel) mainWindow.webContents.send(channel, details);
}

function setUpdateWindowLock(locked) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setClosable(!locked);
  mainWindow.setMinimizable(!locked);
  mainWindow.setMaximizable(!locked);
  mainWindow.setResizable(!locked);
}

function normaliseReleaseNotes(releaseNotes) {
  if (!releaseNotes) return [];
  if (Array.isArray(releaseNotes)) {
    return releaseNotes
      .map((item) => (typeof item === 'string' ? item : item.note || ''))
      .filter(Boolean);
  }
  return [String(releaseNotes)];
}

function isUpdaterEnabled() {
  return app.isPackaged || process.env.E_SYSTEM_CHECK_UPDATES === '1';
}

function checkForUpdates() {
  if (!isUpdaterEnabled() || pendingUpdateInfo) return;
  autoUpdater.checkForUpdates().catch((error) => {
    log.error('Failed to check for updates', error);
  });
}

function setupAutoUpdater(window) {
  mainWindow = window;
  mainWindow.on('close', (event) => {
    if (pendingUpdateInfo && !installingUpdate) event.preventDefault();
  });
  ipcMain.handle('update:get-state', () => updateState);
  ipcMain.handle('update:download', async () => {
    if (!isUpdaterEnabled()) return null;
    if (!pendingUpdateInfo || (updateState.phase !== 'available' && updateState.phase !== 'error')) return null;
    sendState('progress', { ...pendingUpdateInfo, percent: 0, bytesPerSecond: 0 });
    return autoUpdater.downloadUpdate();
  });

  if (!isUpdaterEnabled()) return;

  log.transports.file.level = 'info';
  autoUpdater.logger = log;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.installDirectory = path.dirname(app.getPath('exe'));
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'Bas21950',
    repo: 'E-System-School',
  });

  autoUpdater.on('checking-for-update', () => sendState('checking'));
  autoUpdater.on('update-available', (info) => {
    pendingUpdateInfo = {
      currentVersion: app.getVersion(),
      version: info.version,
      releaseName: info.releaseName || null,
      releaseDate: info.releaseDate || null,
      releaseNotes: normaliseReleaseNotes(info.releaseNotes),
    };
    setUpdateWindowLock(true);
    sendState('available', pendingUpdateInfo);
  });
  autoUpdater.on('update-not-available', () => {
    pendingUpdateInfo = null;
    setUpdateWindowLock(false);
    sendState('idle');
  });
  autoUpdater.on('download-progress', (progress) => {
    sendState('progress', {
      ...pendingUpdateInfo,
      percent: Math.max(0, Math.min(100, Math.round(progress.percent || 0))),
      bytesPerSecond: Math.max(0, Math.round(progress.bytesPerSecond || 0)),
    });
  });
  autoUpdater.on('update-downloaded', (info) => {
    setUpdateWindowLock(true);
    sendState('downloaded', { ...pendingUpdateInfo, version: info.version || pendingUpdateInfo?.version });

    // The replacement installer is already verified by electron-updater.
    // Give the renderer a moment to render the completed state, then restart.
    clearTimeout(installTimer);
    installTimer = setTimeout(() => {
      installingUpdate = true;
      autoUpdater.quitAndInstall(true, true);
    }, 1200);
  });
  autoUpdater.on('error', (error) => {
    log.error('Auto-update failed', error);
    if (pendingUpdateInfo) {
      setUpdateWindowLock(true);
      sendState('error', {
        ...pendingUpdateInfo,
        message: error?.message || 'ไม่สามารถดาวน์โหลดอัปเดตได้',
      });
    } else {
      setUpdateWindowLock(false);
      sendState('idle', { message: error?.message || 'ตรวจสอบอัปเดตไม่ได้' });
    }
  });

  // Check once after startup, then periodically while the app remains open.
  setTimeout(checkForUpdates, 5000);
  updateCheckTimer = setInterval(checkForUpdates, 4 * 60 * 60 * 1000);
}

function stopAutoUpdater() {
  if (updateCheckTimer) clearInterval(updateCheckTimer);
  if (installTimer) clearTimeout(installTimer);
}

module.exports = { setupAutoUpdater, stopAutoUpdater };

const { cpSync, existsSync, mkdirSync, rmSync } = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const shellDir = __dirname;
const projectDir = path.resolve(shellDir, '..');
const runtimeDir = path.join(shellDir, 'runtime-dependencies');
const npmCli =
  process.env.npm_execpath ||
  path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');

function prepareServiceDependencies(serviceName) {
  const sourceDir = path.join(projectDir, serviceName);
  const destinationDir = path.join(runtimeDir, serviceName);
  const packageJson = path.join(sourceDir, 'package.json');
  const packageLock = path.join(sourceDir, 'package-lock.json');

  if (!existsSync(packageJson) || !existsSync(packageLock)) {
    throw new Error(`Missing package files for ${serviceName}`);
  }

  rmSync(destinationDir, { recursive: true, force: true });
  mkdirSync(destinationDir, { recursive: true });
  cpSync(packageJson, path.join(destinationDir, 'package.json'));
  cpSync(packageLock, path.join(destinationDir, 'package-lock.json'));

  const result = spawnSync(
    process.execPath,
    [npmCli, 'ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'],
    { cwd: destinationDir, stdio: 'inherit', shell: false }
  );

  if (result.status !== 0) {
    const detail = result.error ? `: ${result.error.message}` : '';
    throw new Error(`Could not prepare production dependencies for ${serviceName}${detail}`);
  }
}

rmSync(runtimeDir, { recursive: true, force: true });
mkdirSync(runtimeDir, { recursive: true });
prepareServiceDependencies('backend');
prepareServiceDependencies('frontend');

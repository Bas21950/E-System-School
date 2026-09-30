@echo off
setlocal

cd /d "%~dp0"

if not exist "logs" mkdir "logs"

set "PATH=%PATH%;C:\Program Files\PostgreSQL\16\bin;C:\Program Files\PostgreSQL\15\bin;C:\Program Files\PostgreSQL\14\bin;C:\Program Files\PostgreSQL\13\bin"
set "E_SYSTEM_DEV=1"
set "ELECTRON_ENABLE_LOGGING=1"

echo Starting E-System School in dev mode...
start "E-System Backend Dev" /min cmd /c "cd /d backend && npm run dev > ..\logs\backend-dev.log 2>&1"
start "E-System Shell Dev" /min cmd /c "cd /d shell && npm start > ..\logs\shell-dev.log 2>&1"

echo Dev mode started.
echo Check logs\backend-dev.log and logs\shell-dev.log if needed.

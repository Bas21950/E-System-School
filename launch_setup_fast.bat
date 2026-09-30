@echo off
setlocal

cd /d "%~dp0"

rem Make PostgreSQL psql visible to the legacy installer check.
set "PATH=%PATH%;C:\Program Files\PostgreSQL\16\bin;C:\Program Files\PostgreSQL\15\bin;C:\Program Files\PostgreSQL\14\bin;C:\Program Files\PostgreSQL\13\bin"

set "SETUP_EXE=%~dp0installer\E-System-School-Setup.exe"
if not exist "%SETUP_EXE%" (
    echo Installer not found: %SETUP_EXE%
    echo Please build the installer first or use setup_system.bat.
    pause
    exit /b 1
)

echo Launching installer with PostgreSQL path preloaded...
start "" /wait "%SETUP_EXE%"
exit /b %errorlevel%

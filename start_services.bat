@echo off
rem Set working directory to the script's directory
cd /d "%~dp0"

if not exist "logs" mkdir "logs"

rem Start PostgreSQL service
net start postgresql-x64-16 >nul 2>&1
net start postgresql-x64-15 >nul 2>&1
net start postgresql-x64-14 >nul 2>&1
net start postgresql-x64-13 >nul 2>&1

rem Start backend API
cd /d "%~dp0backend"
start "E-System Backend" /min cmd /c "npm run dev > ..\logs\backend.log 2>&1"

rem Start frontend dev
cd /d "%~dp0frontend"
start "E-System Frontend" /min cmd /c "npx next dev -p 3050 > ..\logs\frontend.log 2>&1"

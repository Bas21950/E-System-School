@echo off
title E-System School Starter
echo ========================================================
echo   E-System School - Local System Starter
echo ========================================================

rem Check if Postgres is running on port 5432
netstat -ano | findstr :5432 >nul
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL is running.
) else (
    echo [WARNING] PostgreSQL is not running on port 5432. 
    echo Attempting to start PostgreSQL service...
    net start postgresql-x64-16 >nul 2>&1
    net start postgresql-x64-15 >nul 2>&1
    net start postgresql-x64-14 >nul 2>&1
    net start postgresql-x64-13 >nul 2>&1
    
    timeout /t 3 /nobreak >nul
    netstat -ano | findstr :5432 >nul
    if %errorlevel% equ 0 (
        echo [OK] PostgreSQL service started successfully.
    ) else (
        echo [ERROR] Could not start PostgreSQL. Please make sure PostgreSQL is running.
    )
)

if not exist "logs" mkdir "logs"

echo Starting Backend API Server...
start "" /b cmd /c "cd backend && npm run dev > ..\logs\backend.log 2>&1"

echo Starting Electron Program Window...
start "" /b cmd /c "cd shell && npm start > ..\logs\shell.log 2>&1"

echo Waiting for program to be ready...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ready=$false; for($i=0; $i -lt 90; $i++){ try { $r=Invoke-WebRequest -Uri 'http://127.0.0.1:3050/dashboard' -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -ge 200 -and $r.StatusCode -lt 500){ $ready=$true; break } } catch { Start-Sleep -Seconds 1 } }; if(-not $ready){ exit 1 }"
if %errorlevel% neq 0 (
    echo [ERROR] Program did not become ready. Please check logs\shell.log
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r=Invoke-WebRequest -Uri 'http://127.0.0.1:4000/api/keep-alive' -UseBasicParsing -TimeoutSec 5; exit 0 } catch { exit 1 }"
if %errorlevel% neq 0 (
    echo [WARNING] Backend is running, but local PostgreSQL is not ready.
    echo           Data screens may fail until PostgreSQL is installed, started, and initialized.
    echo           Check logs\backend.log for details.
)

echo System is running!
echo The program window should open automatically.
echo ========================================================
pause

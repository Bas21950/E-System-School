@echo off
title E-System School Backup
echo ========================================================
echo   E-System School - Local Backup System
echo ========================================================

rem Load configurations from backend/.env
if not exist "..\backend\.env" (
    echo [ERROR] backend/.env file not found.
    pause
    exit /b 1
)

set DB_HOST=127.0.0.1
set DB_PORT=5432
set DB_NAME=eschool
set DB_USER=postgres
set DB_PASSWORD=postgres

for /f "usebackq tokens=1,2 delims==" %%i in ("..\backend\.env") do (
    if "%%i"=="DB_HOST" set DB_HOST=%%j
    if "%%i"=="DB_PORT" set DB_PORT=%%j
    if "%%i"=="DB_NAME" set DB_NAME=%%j
    if "%%i"=="DB_USER" set DB_USER=%%j
    if "%%i"=="DB_PASSWORD" set DB_PASSWORD=%%j
)

set PGPASSWORD=%DB_PASSWORD%

set BACKUP_DIR=backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

set TIMESTAMP=%DATE:~10,4%%DATE:~4,2%%DATE:~7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

set DUMP_FILE=%BACKUP_DIR%\db_dump_%TIMESTAMP%.sql
set ZIP_FILE=%BACKUP_DIR%\backup_%TIMESTAMP%.zip

rem Find pg_dump in standard paths
set PG_DUMP_PATH=pg_dump.exe
where pg_dump.exe >nul 2>&1
if %errorlevel% neq 0 (
    for /d %%d in ("C:\Program Files\PostgreSQL\*") do (
        if exist "%%d\bin\pg_dump.exe" set PG_DUMP_PATH=%%d\bin\pg_dump.exe
    )
)

echo Dumping PostgreSQL database to %DUMP_FILE%...
"%PG_DUMP_PATH%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -F p -f "%DUMP_FILE%"
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL dump failed. Please check if pg_dump is installed and on your PATH.
    pause
    exit /b 1
)

echo Packaging database dump and transfer slips...
powershell -Command "Compress-Archive -Path '%DUMP_FILE%', '..\backend\data' -DestinationPath '%ZIP_FILE%' -Force"
if %errorlevel% neq 0 (
    echo [ERROR] Packaging failed.
    pause
    exit /b 1
)

rem Clean up temporary raw sql dump
del "%DUMP_FILE%"

echo [SUCCESS] Backup created successfully: %ZIP_FILE%
echo You can sync this zip file or backup folder to your Google Drive.
echo ========================================================
pause

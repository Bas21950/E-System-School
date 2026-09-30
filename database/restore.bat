@echo off
title E-System School Restore
echo ========================================================
echo   E-System School - Local Restore System
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

set /p BACKUP_FILE="Enter the path to the backup ZIP file: "
if not exist "%BACKUP_FILE%" (
    echo [ERROR] Backup file not found: %BACKUP_FILE%
    pause
    exit /b 1
)

set TEMP_EXTRACT_DIR=temp_restore
if exist "%TEMP_EXTRACT_DIR%" rmdir /s /q "%TEMP_EXTRACT_DIR%"
mkdir "%TEMP_EXTRACT_DIR%"

echo Extracting backup files...
powershell -Command "Expand-Archive -Path '%BACKUP_FILE%' -DestinationPath '%TEMP_EXTRACT_DIR%' -Force"
if %errorlevel% neq 0 (
    echo [ERROR] Extraction failed.
    pause
    exit /b 1
)

rem Locate SQL dump file
set SQL_DUMP=
for %%f in ("%TEMP_EXTRACT_DIR%\*.sql") do set SQL_DUMP=%%f

if "%SQL_DUMP%"=="" (
    echo [ERROR] Database dump SQL file not found inside the ZIP.
    pause
    exit /b 1
)

rem Find psql in standard paths
set PSQL_PATH=psql.exe
where psql.exe >nul 2>&1
if %errorlevel% neq 0 (
    for /d %%d in ("C:\Program Files\PostgreSQL\*") do (
        if exist "%%d\bin\psql.exe" set PSQL_PATH=%%d\bin\psql.exe
    )
)

echo Restoring database dump...
"%PSQL_PATH%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%SQL_DUMP%"
if %errorlevel% neq 0 (
    echo [ERROR] Database restore failed.
    pause
    exit /b 1
)

echo Restoring transfer slips...
if exist "%TEMP_EXTRACT_DIR%\data" (
    if exist "..\backend\data" rmdir /s /q "..\backend\data"
    xcopy /s /e /i /y "%TEMP_EXTRACT_DIR%\data" "..\backend\data"
)

rem Clean up temp dir
rmdir /s /q "%TEMP_EXTRACT_DIR%"

echo [SUCCESS] Restore completed successfully!
echo ========================================================
pause

@echo off
setlocal enabledelayedexpansion
title E-System School Setup

cd /d "%~dp0"

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting administrator permission...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

if not exist "logs" mkdir "logs"
set "LOG_FILE=%~dp0logs\setup.log"

set "DB_HOST=127.0.0.1"
set "DB_PORT=5432"
set "DB_NAME=eschool"
set "DB_USER=postgres"
set "DB_PASSWORD=postgres"
set "NODE_INSTALLER=%~dp0installer\node-v20.12.2-x64.msi"
set "PG_INSTALLER=%~dp0installer\postgresql-16.2-1-windows-x64.exe"

echo ========================================================
echo   E-System School - One Click Local Setup
echo ========================================================
echo This setup will install/configure Node.js, PostgreSQL,
echo application packages, local database, and app shortcuts.
echo Log file: %LOG_FILE%
echo ========================================================

call :log "Starting setup"

rem Make newly installed tools visible to this setup session.
set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files\PostgreSQL\16\bin;C:\Program Files\PostgreSQL\15\bin;C:\Program Files\PostgreSQL\14\bin;C:\Program Files\PostgreSQL\13\bin"

call :ensure_node || goto :fail
call :ensure_postgres || goto :fail
call :write_env || goto :fail
call :install_packages || goto :fail
call :build_apps || goto :fail
call :init_database || goto :fail

echo.
echo ========================================================
echo   Setup completed successfully.
echo   Open the system with: E-System School.vbs
echo ========================================================
call :log "Setup completed successfully"
pause
exit /b 0

:ensure_node
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('node -v') do echo [OK] Node.js %%v is installed.
    call :log "Node.js already installed"
    exit /b 0
)

if not exist "%NODE_INSTALLER%" (
    echo [ERROR] Node.js installer not found: %NODE_INSTALLER%
    echo         Run installer\download_prereqs.ps1 first or use the bundled setup exe.
    call :log "Node.js installer missing"
    exit /b 1
)

echo Installing Node.js...
call :log "Installing Node.js"
msiexec.exe /i "%NODE_INSTALLER%" /passive /norestart >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 exit /b 1

set "PATH=%PATH%;C:\Program Files\nodejs"
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js installation finished but node.exe was not found.
    exit /b 1
)
echo [OK] Node.js installed.
exit /b 0

:ensure_postgres
call :find_psql
if defined PSQL_PATH (
    echo [OK] PostgreSQL tools found.
    call :start_postgres
    exit /b 0
)

if not exist "%PG_INSTALLER%" (
    echo [ERROR] PostgreSQL installer not found: %PG_INSTALLER%
    echo         Run installer\download_prereqs.ps1 first or use the bundled setup exe.
    call :log "PostgreSQL installer missing"
    exit /b 1
)

echo Installing PostgreSQL database server...
call :log "Installing PostgreSQL"
"%PG_INSTALLER%" --mode unattended --unattendedmodeui none --superpassword "%DB_PASSWORD%" --serverport %DB_PORT% >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL installation failed. See logs\setup.log
    exit /b 1
)

set "PATH=%PATH%;C:\Program Files\PostgreSQL\16\bin"
call :find_psql
if not defined PSQL_PATH (
    echo [ERROR] PostgreSQL installed but psql.exe was not found.
    exit /b 1
)

call :start_postgres
exit /b %errorlevel%

:start_postgres
echo Starting PostgreSQL service...
net start postgresql-x64-16 >> "%LOG_FILE%" 2>&1
net start postgresql-x64-15 >> "%LOG_FILE%" 2>&1
net start postgresql-x64-14 >> "%LOG_FILE%" 2>&1
net start postgresql-x64-13 >> "%LOG_FILE%" 2>&1

for /l %%i in (1,1,20) do (
    netstat -ano | findstr ":%DB_PORT%" >nul
    if !errorlevel! equ 0 (
        echo [OK] PostgreSQL is running on port %DB_PORT%.
        call :log "PostgreSQL is running"
        exit /b 0
    )
    timeout /t 1 /nobreak >nul
)

echo [ERROR] PostgreSQL did not start on port %DB_PORT%.
call :log "PostgreSQL did not start"
exit /b 1

:find_psql
set "PSQL_PATH="
where psql.exe >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%p in ('where psql.exe') do (
        set "PSQL_PATH=%%p"
        goto :eof
    )
)

for /d %%d in ("C:\Program Files\PostgreSQL\*") do (
    if exist "%%d\bin\psql.exe" (
        set "PSQL_PATH=%%d\bin\psql.exe"
        set "PATH=!PATH!;%%d\bin"
        goto :eof
    )
)
goto :eof

:write_env
echo Configuring environment files...
if not exist "backend\.env" copy "backend\.env.example" "backend\.env" >nul
if not exist "frontend\.env.local" copy "frontend\.env.example" "frontend\.env.local" >nul

powershell -NoProfile -ExecutionPolicy Bypass -Command "$p='backend\.env'; $kv=@{PORT='4000'; DB_PROVIDER='postgres'; DB_HOST='%DB_HOST%'; DB_PORT='%DB_PORT%'; DB_NAME='%DB_NAME%'; DB_USER='%DB_USER%'; DB_PASSWORD='%DB_PASSWORD%'; DATA_DIR='./data'; PUBLIC_API_BASE_URL='http://localhost:4000'; FRONTEND_URL='http://127.0.0.1:3050'}; $lines=@(); if(Test-Path $p){$lines=Get-Content $p}; foreach($k in $kv.Keys){$v=$kv[$k]; if($lines -match ('^'+[regex]::Escape($k)+'=')){ $lines=$lines -replace ('^'+[regex]::Escape($k)+'=.*'), ($k+'='+$v) } else { $lines += ($k+'='+$v) }}; Set-Content -Path $p -Value $lines -Encoding UTF8" >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 exit /b 1

powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-Content -Path 'frontend\.env.local' -Value 'NEXT_PUBLIC_API_URL=http://localhost:4000/api' -Encoding UTF8" >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 exit /b 1

echo [OK] Environment configured.
exit /b 0

:install_packages
if exist "%~dp0backend\node_modules" (
    echo [OK] Backend packages already installed. Skipping.
) else (
    echo Installing backend packages...
    cd /d "%~dp0backend"
    call npm install --no-audit --no-fund >> "%LOG_FILE%" 2>&1
    if %errorlevel% neq 0 exit /b 1
)

if exist "%~dp0frontend\node_modules" (
    echo [OK] Frontend packages already installed. Skipping.
) else (
    echo Installing frontend packages...
    cd /d "%~dp0frontend"
    call npm install --no-audit --no-fund >> "%LOG_FILE%" 2>&1
    if %errorlevel% neq 0 exit /b 1
)

if exist "%~dp0shell\node_modules" (
    echo [OK] Shell packages already installed. Skipping.
) else (
    echo Installing shell packages...
    cd /d "%~dp0shell"
    call npm install --no-audit --no-fund >> "%LOG_FILE%" 2>&1
    if %errorlevel% neq 0 exit /b 1
)

cd /d "%~dp0"
echo [OK] Application packages installed.
exit /b 0

:build_apps
if exist "%~dp0backend\dist\index.js" (
    echo [OK] Backend build already exists. Skipping.
) else (
    echo Building backend for desktop launch...
    cd /d "%~dp0backend"
    call npm run build >> "%LOG_FILE%" 2>&1
    if %errorlevel% neq 0 exit /b 1
)

if exist "%~dp0frontend\.next\BUILD_ID" (
    echo [OK] Frontend build already exists. Skipping.
) else (
    echo Building frontend for desktop launch...
    cd /d "%~dp0frontend"
    call npm run build >> "%LOG_FILE%" 2>&1
    if %errorlevel% neq 0 exit /b 1
)

cd /d "%~dp0"
echo [OK] Application builds completed.
exit /b 0

:init_database
echo Creating and initializing local database...
set "PGPASSWORD=%DB_PASSWORD%"

"%PSQL_PATH%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -tc "select 1 from pg_database where datname='%DB_NAME%'" | findstr 1 >nul
if %errorlevel% neq 0 (
    "%PSQL_PATH%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME%;" >> "%LOG_FILE%" 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Could not create database %DB_NAME%.
        exit /b 1
    )
)

call :database_is_initialized
if %errorlevel% equ 0 (
    echo [OK] Database schema already exists. Skipping initialization.
) else (
    "%PSQL_PATH%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "database\schema.sql" >> "%LOG_FILE%" 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Could not initialize database schema. See logs\setup.log
        exit /b 1
    )
)

echo [OK] Local database initialized.
exit /b 0

:database_is_initialized
set "DB_READY="
"%PSQL_PATH%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -Atqc "with required(name) as (values ('academic_years'),('semesters'),('education_levels'),('grade_levels'),('rooms'),('students'),('student_enrollments'),('receipt_types'),('fee_plans'),('student_fee_assignments'),('student_fees'),('payments'),('payment_items'),('payment_methods'),('system_receipt_settings'),('discounts')) select case when count(*) = 16 then 1 else 0 end from required r join information_schema.tables t on t.table_schema='public' and t.table_name=r.name;" > "%TEMP%\eschool_db_ready.txt" 2>> "%LOG_FILE%"
if %errorlevel% neq 0 exit /b 1
set /p DB_READY=<"%TEMP%\eschool_db_ready.txt"
del "%TEMP%\eschool_db_ready.txt" >nul 2>&1
if "%DB_READY%"=="1" exit /b 0
exit /b 1

:log
echo [%date% %time%] %~1 >> "%LOG_FILE%"
exit /b 0

:fail
echo.
echo ========================================================
echo   Setup failed.
echo   Please send logs\setup.log to the developer.
echo ========================================================
pause
exit /b 1

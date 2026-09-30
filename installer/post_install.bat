@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"
if not exist "logs" mkdir "logs"
set "LOG_FILE=%~dp0logs\post_install.log"

set "DB_HOST=127.0.0.1"
set "DB_PORT=5432"
set "DB_NAME=eschool"
set "DB_USER=postgres"
set "DB_PASSWORD=postgres"
set "DATA_DIR=%~1"
set "RECEIPT_OUTPUT_DIR=%~2"
if not defined DATA_DIR set "DATA_DIR=%LOCALAPPDATA%\E-System School\Data"
if not defined RECEIPT_OUTPUT_DIR set "RECEIPT_OUTPUT_DIR=%LOCALAPPDATA%\E-System School\Receipts"
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%RECEIPT_OUTPUT_DIR%" mkdir "%RECEIPT_OUTPUT_DIR%"
set "E_SYSTEM_DATA_DIR=%DATA_DIR%"
set "E_SYSTEM_RECEIPT_OUTPUT_DIR=%RECEIPT_OUTPUT_DIR%"

echo [%date% %time%] Starting post-install configuration > "%LOG_FILE%"

set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files\PostgreSQL\16\bin;C:\Program Files\PostgreSQL\15\bin;C:\Program Files\PostgreSQL\14\bin;C:\Program Files\PostgreSQL\13\bin"

call :find_psql
if not defined PSQL_PATH (
    echo PostgreSQL psql.exe was not found. >> "%LOG_FILE%"
    exit /b 1
)

call :start_postgres
if %errorlevel% neq 0 exit /b 1

call :write_env
if %errorlevel% neq 0 exit /b 1

call :install_packages
if %errorlevel% neq 0 exit /b 1

call :build_apps
if %errorlevel% neq 0 exit /b 1

call :init_database
if %errorlevel% neq 0 exit /b 1

echo [%date% %time%] Post-install configuration completed successfully >> "%LOG_FILE%"
exit /b 0

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

:start_postgres
net start postgresql-x64-16 >> "%LOG_FILE%" 2>&1
net start postgresql-x64-15 >> "%LOG_FILE%" 2>&1
net start postgresql-x64-14 >> "%LOG_FILE%" 2>&1
net start postgresql-x64-13 >> "%LOG_FILE%" 2>&1

for /l %%i in (1,1,30) do (
    netstat -ano | findstr ":%DB_PORT%" >nul
    if !errorlevel! equ 0 exit /b 0
    timeout /t 1 /nobreak >nul
)

echo PostgreSQL did not start on port %DB_PORT%. >> "%LOG_FILE%"
exit /b 1

:write_env
if not exist "backend\.env" copy "backend\.env.example" "backend\.env" >nul
if not exist "frontend\.env.local" copy "frontend\.env.example" "frontend\.env.local" >nul

powershell -NoProfile -ExecutionPolicy Bypass -Command "$p='backend\.env'; $kv=@{PORT='4000'; DB_PROVIDER='postgres'; DB_HOST='%DB_HOST%'; DB_PORT='%DB_PORT%'; DB_NAME='%DB_NAME%'; DB_USER='%DB_USER%'; DB_PASSWORD='%DB_PASSWORD%'; DATA_DIR=$env:E_SYSTEM_DATA_DIR; RECEIPT_OUTPUT_DIR=$env:E_SYSTEM_RECEIPT_OUTPUT_DIR; PUBLIC_API_BASE_URL='http://localhost:4000'; FRONTEND_URL='http://127.0.0.1:3050'}; $lines=@(); if(Test-Path $p){$lines=Get-Content $p}; foreach($k in $kv.Keys){$v=$kv[$k]; if($lines -match ('^'+[regex]::Escape($k)+'=')){ $lines=$lines -replace ('^'+[regex]::Escape($k)+'=.*'), ($k+'='+$v) } else { $lines += ($k+'='+$v) }}; Set-Content -Path $p -Value $lines -Encoding UTF8" >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 exit /b 1

powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-Content -Path 'frontend\.env.local' -Value 'NEXT_PUBLIC_API_URL=http://localhost:4000/api' -Encoding UTF8" >> "%LOG_FILE%" 2>&1
exit /b %errorlevel%

:install_packages
if exist "%~dp0backend\node_modules" (
    echo [OK] Backend packages already installed. Skipping. >> "%LOG_FILE%"
) else (
    cd /d "%~dp0backend"
    call npm install --no-audit --no-fund >> "%LOG_FILE%" 2>&1
    if %errorlevel% neq 0 exit /b 1
)

if exist "%~dp0frontend\node_modules" (
    echo [OK] Frontend packages already installed. Skipping. >> "%LOG_FILE%"
) else (
    cd /d "%~dp0frontend"
    call npm install --no-audit --no-fund >> "%LOG_FILE%" 2>&1
    if %errorlevel% neq 0 exit /b 1
)

if exist "%~dp0shell\node_modules" (
    echo [OK] Shell packages already installed. Skipping. >> "%LOG_FILE%"
) else (
    cd /d "%~dp0shell"
    call npm install --no-audit --no-fund >> "%LOG_FILE%" 2>&1
    if %errorlevel% neq 0 exit /b 1
)

cd /d "%~dp0"
exit /b 0

:build_apps
echo Rebuilding backend...
cd /d "%~dp0backend"
if exist "dist" rmdir /s /q "dist"
call npm run build >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 exit /b 1

echo Rebuilding frontend...
cd /d "%~dp0frontend"
if exist ".next" rmdir /s /q ".next"
call npm run build >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 exit /b 1

cd /d "%~dp0"
exit /b 0

:init_database
set "PGPASSWORD=%DB_PASSWORD%"

"%PSQL_PATH%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -tc "select 1 from pg_database where datname='%DB_NAME%'" | findstr 1 >nul
if %errorlevel% neq 0 (
    "%PSQL_PATH%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME%;" >> "%LOG_FILE%" 2>&1
    if %errorlevel% neq 0 exit /b 1
)

call :database_is_initialized
if %errorlevel% equ 0 (
    echo [OK] Database schema already exists. Skipping initialization. >> "%LOG_FILE%"
) else (
    "%PSQL_PATH%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "database\schema.sql" >> "%LOG_FILE%" 2>&1
    if %errorlevel% neq 0 exit /b 1
)
call :save_receipt_output_dir
if %errorlevel% neq 0 exit /b 1
exit /b 0

:save_receipt_output_dir
"%PSQL_PATH%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -v "receipt_dir=%RECEIPT_OUTPUT_DIR%" -c "INSERT INTO system_receipt_settings (id, payee_name) VALUES (1, 'ผู้รับเงิน') ON CONFLICT (id) DO NOTHING; UPDATE system_receipt_settings SET receipt_output_dir = :'receipt_dir', updated_at = NOW() WHERE id = 1;" >> "%LOG_FILE%" 2>&1
exit /b %errorlevel%

:database_is_initialized
set "DB_READY="
"%PSQL_PATH%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -Atqc "with required(name) as (values ('academic_years'),('semesters'),('education_levels'),('grade_levels'),('rooms'),('students'),('student_enrollments'),('receipt_types'),('fee_plans'),('student_fee_assignments'),('student_fees'),('payments'),('payment_items'),('payment_methods'),('system_receipt_settings'),('discounts')) select case when count(*) = 16 then 1 else 0 end from required r join information_schema.tables t on t.table_schema='public' and t.table_name=r.name;" > "%TEMP%\eschool_db_ready.txt" 2>> "%LOG_FILE%"
if %errorlevel% neq 0 exit /b 1
set /p DB_READY=<"%TEMP%\eschool_db_ready.txt"
del "%TEMP%\eschool_db_ready.txt" >nul 2>&1
if "%DB_READY%"=="1" exit /b 0
exit /b 1

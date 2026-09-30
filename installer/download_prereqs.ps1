# download_prereqs.ps1
$ErrorActionPreference = "Stop"

# Create installer dir if it doesn't exist
$InstallerDir = Join-Path $PSScriptRoot ""
if (-not (Test-Path $InstallerDir)) {
    New-Item -ItemType Directory -Force -Path $InstallerDir
}

# URLs
$NodeUrl = "https://nodejs.org/dist/v20.12.2/node-v20.12.2-x64.msi"
$PgUrl = "https://get.enterprisedb.com/postgresql/postgresql-16.2-1-windows-x64.exe"

$NodeDest = Join-Path $InstallerDir "node-v20.12.2-x64.msi"
$PgDest = Join-Path $InstallerDir "postgresql-16.2-1-windows-x64.exe"

# Download Node.js
if (-not (Test-Path $NodeDest)) {
    Write-Host "Downloading Node.js installer from $NodeUrl..."
    Invoke-WebRequest -Uri $NodeUrl -OutFile $NodeDest -UserAgent "Mozilla/5.0"
    Write-Host "Node.js download complete."
} else {
    Write-Host "Node.js installer already exists."
}

# Download PostgreSQL
if (-not (Test-Path $PgDest)) {
    Write-Host "Downloading PostgreSQL installer from $PgUrl..."
    Invoke-WebRequest -Uri $PgUrl -OutFile $PgDest -UserAgent "Mozilla/5.0"
    Write-Host "PostgreSQL download complete."
} else {
    Write-Host "PostgreSQL installer already exists."
}

Write-Host "All downloads complete."

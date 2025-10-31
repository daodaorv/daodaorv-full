# Automated MySQL Password Reset Script
Write-Host "MySQL Password Reset Tool" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Find MySQL installation
$mysqlPaths = @(
    "C:\Program Files\MySQL\MySQL Server 9.3\bin",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin",
    "C:\Program Files\MySQL\MySQL Server 8.3\bin",
    "C:\MySQL\bin"
)

$mysqldPath = $null
foreach ($path in $mysqlPaths) {
    if (Test-Path "$path\mysqld.exe") {
        $mysqldPath = $path
        break
    }
}

if (-not $mysqldPath) {
    Write-Host "MySQL installation not found!" -ForegroundColor Red
    Write-Host "Please install MySQL or update the path in this script" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found MySQL at: $mysqldPath" -ForegroundColor Green

# Stop MySQL service
Write-Host "`nStopping MySQL service..." -ForegroundColor Yellow
try {
    Stop-Service MySQL93 -Force -ErrorAction Stop
    Write-Host "MySQL service stopped" -ForegroundColor Green
} catch {
    Write-Host "Failed to stop MySQL service: $_" -ForegroundColor Red
    Write-Host "Trying alternative service names..." -ForegroundColor Yellow
    
    $services = Get-Service | Where-Object { $_.Name -like "MySQL*" }
    if ($services) {
        foreach ($svc in $services) {
            Write-Host "Stopping $($svc.Name)..." -ForegroundColor Gray
            Stop-Service $svc.Name -Force
        }
    }
}

# Create init file
$initFile = "C:\mysql-init.txt"
$initContent = @"
ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';
FLUSH PRIVILEGES;
"@
Set-Content -Path $initFile -Value $initContent -Encoding ASCII
Write-Host "Init file created: $initFile" -ForegroundColor Green

# Start MySQL with init file
Write-Host "`nStarting MySQL with init file..." -ForegroundColor Yellow
Write-Host "This will take about 10 seconds..." -ForegroundColor Gray

$mysqldExe = Join-Path $mysqldPath "mysqld.exe"
$process = Start-Process -FilePath $mysqldExe -ArgumentList "--init-file=$initFile" -PassThru -WindowStyle Hidden

# Wait for MySQL to initialize
Start-Sleep -Seconds 10

# Stop the process
Write-Host "Stopping MySQL process..." -ForegroundColor Yellow
Stop-Process -Id $process.Id -Force
Start-Sleep -Seconds 2

# Clean up init file
Remove-Item $initFile -Force
Write-Host "Init file removed" -ForegroundColor Green

# Start MySQL service
Write-Host "`nStarting MySQL service..." -ForegroundColor Yellow
try {
    Start-Service MySQL93 -ErrorAction Stop
    Write-Host "MySQL service started" -ForegroundColor Green
} catch {
    Write-Host "Failed to start MySQL service: $_" -ForegroundColor Red
    Write-Host "Trying alternative service names..." -ForegroundColor Yellow
    
    $services = Get-Service | Where-Object { $_.Name -like "MySQL*" -and $_.Status -eq "Stopped" }
    if ($services) {
        foreach ($svc in $services) {
            Write-Host "Starting $($svc.Name)..." -ForegroundColor Gray
            Start-Service $svc.Name
        }
    }
}

# Wait for service to start
Start-Sleep -Seconds 5

# Test connection
Write-Host "`nTesting connection..." -ForegroundColor Yellow
$testScript = Join-Path $PSScriptRoot "test-mysql-password.js"
if (Test-Path $testScript) {
    node $testScript
} else {
    Write-Host "Test script not found, skipping verification" -ForegroundColor Yellow
}

Write-Host "`nPassword reset completed!" -ForegroundColor Green
Write-Host "New password: 123456" -ForegroundColor Cyan


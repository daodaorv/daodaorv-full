# MySQL Password Reset using skip-grant-tables
Write-Host "MySQL Password Reset (skip-grant-tables method)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Find MySQL
$mysqlPath = "C:\Program Files\MySQL\MySQL Server 9.3\bin"
if (-not (Test-Path "$mysqlPath\mysqld.exe")) {
    Write-Host "MySQL not found at $mysqlPath" -ForegroundColor Red
    exit 1
}

Write-Host "Found MySQL at: $mysqlPath" -ForegroundColor Green

# Stop service
Write-Host "`nStopping MySQL service..." -ForegroundColor Yellow
Stop-Service MySQL93 -Force
Start-Sleep -Seconds 2
Write-Host "Service stopped" -ForegroundColor Green

# Start MySQL in skip-grant-tables mode
Write-Host "`nStarting MySQL in safe mode..." -ForegroundColor Yellow
$mysqldExe = Join-Path $mysqlPath "mysqld.exe"
$mysqlProcess = Start-Process -FilePath $mysqldExe -ArgumentList "--skip-grant-tables","--shared-memory" -PassThru -WindowStyle Minimized

Write-Host "Waiting for MySQL to start..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Reset password using mysql client
Write-Host "`nResetting password..." -ForegroundColor Yellow
$mysqlExe = Join-Path $mysqlPath "mysql.exe"
$resetSQL = @"
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';
FLUSH PRIVILEGES;
"@

$resetSQL | & $mysqlExe -u root --protocol=MEMORY 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Password reset successful!" -ForegroundColor Green
} else {
    Write-Host "Password reset may have failed, but continuing..." -ForegroundColor Yellow
}

# Stop safe mode MySQL
Write-Host "`nStopping safe mode MySQL..." -ForegroundColor Yellow
Stop-Process -Id $mysqlProcess.Id -Force
Start-Sleep -Seconds 3

# Start normal service
Write-Host "Starting MySQL service..." -ForegroundColor Yellow
Start-Service MySQL93
Start-Sleep -Seconds 5
Write-Host "Service started" -ForegroundColor Green

# Test
Write-Host "`nTesting connection..." -ForegroundColor Yellow
node test-mysql-password.js

Write-Host "`nDone!" -ForegroundColor Green


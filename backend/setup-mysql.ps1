# MySQL Docker Setup Script
Write-Host "Setting up MySQL Docker container..." -ForegroundColor Cyan

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "Docker is not installed or not running" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Stop and remove old container
Write-Host "Cleaning up old container..." -ForegroundColor Yellow
docker stop daodao-mysql 2>$null
docker rm daodao-mysql 2>$null
Write-Host "Old container cleaned" -ForegroundColor Green

# Create new MySQL container
Write-Host "Creating new MySQL container..." -ForegroundColor Yellow
docker run -d `
  --name daodao-mysql `
  -p 3306:3306 `
  -e MYSQL_ROOT_PASSWORD=123456 `
  -e MYSQL_DATABASE=daodao_rv `
  -e MYSQL_CHARACTER_SET_SERVER=utf8mb4 `
  -e MYSQL_COLLATION_SERVER=utf8mb4_unicode_ci `
  mysql:8.0 `
  --character-set-server=utf8mb4 `
  --collation-server=utf8mb4_unicode_ci

if ($LASTEXITCODE -eq 0) {
    Write-Host "MySQL container created successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to create MySQL container" -ForegroundColor Red
    exit 1
}

# Wait for MySQL to start
Write-Host "Waiting for MySQL to start..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "Attempt $attempt of $maxAttempts..." -ForegroundColor Gray
    
    $result = docker exec daodao-mysql mysql -uroot -p123456 -e "SELECT 1" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "MySQL is ready!" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 2
}

if ($attempt -eq $maxAttempts) {
    Write-Host "MySQL startup timeout" -ForegroundColor Red
    Write-Host "Check logs: docker logs daodao-mysql" -ForegroundColor Yellow
    exit 1
}

# Verify database
Write-Host "Verifying database..." -ForegroundColor Yellow
$databases = docker exec daodao-mysql mysql -uroot -p123456 -e "SHOW DATABASES;" 2>$null
if ($databases -match "daodao_rv") {
    Write-Host "Database daodao_rv created successfully" -ForegroundColor Green
} else {
    Write-Host "Database creation failed" -ForegroundColor Red
    exit 1
}

# Success
Write-Host "`nMySQL setup completed!" -ForegroundColor Green
Write-Host "`nConnection Info:" -ForegroundColor Cyan
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 3306" -ForegroundColor White
Write-Host "  User: root" -ForegroundColor White
Write-Host "  Password: 123456" -ForegroundColor White
Write-Host "  Database: daodao_rv" -ForegroundColor White

Write-Host "`nUseful Commands:" -ForegroundColor Cyan
Write-Host "  Check status: docker ps | findstr daodao-mysql" -ForegroundColor Gray
Write-Host "  View logs: docker logs daodao-mysql" -ForegroundColor Gray
Write-Host "  Stop: docker stop daodao-mysql" -ForegroundColor Gray
Write-Host "  Start: docker start daodao-mysql" -ForegroundColor Gray
Write-Host "  Remove: docker rm -f daodao-mysql" -ForegroundColor Gray

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Run tests: npm test" -ForegroundColor White
Write-Host "  2. Start server: npm run dev" -ForegroundColor White


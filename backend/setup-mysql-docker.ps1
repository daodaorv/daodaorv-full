# MySQL Docker 环境设置脚本

Write-Host "🐳 DaoDaoRV MySQL Docker 环境设置" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# 检查 Docker 是否安装
Write-Host "1️⃣  检查 Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "   ✅ Docker 已安装: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker 未安装或未启动" -ForegroundColor Red
    Write-Host "   请先安装 Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# 停止并删除旧容器
Write-Host "`n2️⃣  清理旧容器..." -ForegroundColor Yellow
$oldContainers = docker ps -a --filter "name=daodao-mysql" --format "{{.Names}}"
if ($oldContainers) {
    Write-Host "   停止旧容器..." -ForegroundColor Gray
    docker stop daodao-mysql 2>$null
    Write-Host "   删除旧容器..." -ForegroundColor Gray
    docker rm daodao-mysql 2>$null
    Write-Host "   ✅ 旧容器已清理" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  没有旧容器需要清理" -ForegroundColor Gray
}

# 创建新的 MySQL 容器
Write-Host "`n3️⃣  创建新的 MySQL 容器..." -ForegroundColor Yellow
Write-Host "   配置信息:" -ForegroundColor Gray
Write-Host "   - 容器名称: daodao-mysql" -ForegroundColor Gray
Write-Host "   - MySQL 版本: 8.0" -ForegroundColor Gray
Write-Host "   - 端口映射: 3306:3306" -ForegroundColor Gray
Write-Host "   - Root 密码: 123456" -ForegroundColor Gray
Write-Host "   - 数据库: daodao_rv" -ForegroundColor Gray
Write-Host ""

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
    Write-Host "   ✅ MySQL 容器创建成功" -ForegroundColor Green
} else {
    Write-Host "   ❌ MySQL 容器创建失败" -ForegroundColor Red
    exit 1
}

# 等待 MySQL 启动
Write-Host "`n4️⃣  等待 MySQL 启动..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$connected = $false

while ($attempt -lt $maxAttempts -and -not $connected) {
    $attempt++
    Write-Host "   尝试连接 ($attempt/$maxAttempts)..." -ForegroundColor Gray

    $result = docker exec daodao-mysql mysql -uroot -p123456 -e "SELECT 1" 2>$null
    if ($LASTEXITCODE -eq 0) {
        $connected = $true
        Write-Host "   ✅ MySQL 已就绪" -ForegroundColor Green
    } else {
        Start-Sleep -Seconds 2
    }
}

if (-not $connected) {
    Write-Host "   ❌ MySQL 启动超时" -ForegroundColor Red
    Write-Host "   查看日志: docker logs daodao-mysql" -ForegroundColor Yellow
    exit 1
}

# 验证数据库
Write-Host "`n5️⃣  验证数据库..." -ForegroundColor Yellow
$databases = docker exec daodao-mysql mysql -uroot -p123456 -e "SHOW DATABASES;" 2>$null
if ($databases -match "daodao_rv") {
    Write-Host "   ✅ 数据库 daodao_rv 已创建" -ForegroundColor Green
} else {
    Write-Host "   ❌ 数据库创建失败" -ForegroundColor Red
    exit 1
}

# 显示连接信息
Write-Host "`n✅ MySQL 环境设置完成!" -ForegroundColor Green
Write-Host "`n📋 连接信息:" -ForegroundColor Cyan
Write-Host "   Host: localhost" -ForegroundColor White
Write-Host "   Port: 3306" -ForegroundColor White
Write-Host "   User: root" -ForegroundColor White
Write-Host "   Password: 123456" -ForegroundColor White
Write-Host "   Database: daodao_rv" -ForegroundColor White

Write-Host "`n🔧 常用命令:" -ForegroundColor Cyan
Write-Host "   查看容器状态: docker ps -a | findstr daodao-mysql" -ForegroundColor Gray
Write-Host "   查看日志: docker logs daodao-mysql" -ForegroundColor Gray
Write-Host "   停止容器: docker stop daodao-mysql" -ForegroundColor Gray
Write-Host "   启动容器: docker start daodao-mysql" -ForegroundColor Gray
Write-Host "   删除容器: docker rm -f daodao-mysql" -ForegroundColor Gray
Write-Host "   连接 MySQL: docker exec -it daodao-mysql mysql -uroot -p123456" -ForegroundColor Gray

Write-Host "`n🚀 下一步:" -ForegroundColor Cyan
Write-Host "   1. 运行测试: npm test" -ForegroundColor White
Write-Host "   2. 启动服务: npm run dev" -ForegroundColor White
Write-Host ""


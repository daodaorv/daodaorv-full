@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: DaoDaoRV01 Docker 环境管理脚本 (Windows版本)
:: 使用方法: docker-scripts.bat [start|stop|restart|logs|status]

set PROJECT_NAME=daodaorv01

if "%1"=="" goto help
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="status" goto status
if "%1"=="clean" goto clean
if "%1"=="help" goto help
goto unknown

:start
echo [INFO] 启动 DaoDaoRV01 服务...

:: 创建必要的目录
if not exist "nginx\ssl" mkdir nginx\ssl
if not exist "uploads" mkdir uploads

:: 复制环境配置
if not exist ".env" (
    copy ".env.docker" ".env" >nul
    echo [INFO] 已创建 .env 文件
)

:: 启动服务
docker-compose up -d

echo [SUCCESS] 服务启动完成！
echo.
echo 服务访问地址：
echo   后端 API:     http://localhost:3000
echo   PC 管理后台:   http://localhost:3001
echo   Nginx 代理:   http://localhost:80
echo   健康检查:     http://localhost:3000/health
echo.
echo 数据库连接信息：
echo   主机:         localhost:3307
echo   用户名:       daodaorv01
echo   密码:         daodaorv0123456
echo   数据库:       daodaorv01
echo.
echo Redis 连接信息：
echo   主机:         localhost:6379
goto end

:stop
echo [INFO] 停止 DaoDaoRV01 服务...
docker-compose down
echo [SUCCESS] 服务已停止
goto end

:restart
echo [INFO] 重启 DaoDaoRV01 服务...
docker-compose restart
echo [SUCCESS] 服务重启完成
goto end

:logs
if "%2"=="" (
    echo [INFO] 显示所有服务日志...
    docker-compose logs -f
) else (
    echo [INFO] 显示 %2 服务日志...
    docker-compose logs -f %2
)
goto end

:status
echo [INFO] DaoDaoRV01 服务状态：
echo.
docker-compose ps
echo.

:: 检查后端API
curl -s http://localhost:3000/health >nul 2>&1
if !errorlevel! equ 0 (
    echo [SUCCESS] 后端 API: ✓ 正常
) else (
    echo [ERROR]   后端 API: ✗ 异常
)

:: 检查PC管理后台
curl -s http://localhost:3001 >nul 2>&1
if !errorlevel! equ 0 (
    echo [SUCCESS] PC 管理后台: ✓ 正常
) else (
    echo [WARNING] PC 管理后台: - 未启动
)

:: 检查Nginx
curl -s http://localhost:80/health >nul 2>&1
if !errorlevel! equ 0 (
    echo [SUCCESS] Nginx 代理: ✓ 正常
) else (
    echo [WARNING] Nginx 代理: - 未启动
)
goto end

:clean
echo [WARNING] 这将删除所有容器、镜像和数据卷，确定继续吗？(y/N)
set /p confirmation=
if /i "%confirmation%"=="y" (
    echo [INFO] 清理 Docker 资源...
    docker-compose down -v --rmi all
    docker system prune -f
    echo [SUCCESS] 清理完成
) else (
    echo [INFO] 已取消清理操作
)
goto end

:help
echo DaoDaoRV01 Docker 环境管理脚本
echo.
echo 使用方法: %0 [命令]
echo.
echo 命令:
echo   start     启动所有服务
echo   stop      停止所有服务
echo   restart   重启所有服务
echo   logs      显示日志 (可指定服务名)
echo   status    显示服务状态
echo   clean     清理所有资源
echo   help      显示帮助信息
echo.
echo 示例:
echo   %0 start           # 启动所有服务
echo   %0 logs backend    # 查看后端服务日志
echo   %0 status          # 查看服务状态
goto end

:unknown
echo [ERROR] 未知命令: %1
goto help

:end
pause
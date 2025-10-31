#!/bin/bash

# DaoDaoRV01 Docker 环境管理脚本
# 使用方法: ./docker-scripts.sh [start|stop|restart|logs|status]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目名称
PROJECT_NAME="daodaorv01"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
}

# 启动服务
start_services() {
    log_info "启动 DaoDaoRV01 服务..."

    # 创建必要的目录
    mkdir -p nginx/ssl
    mkdir -p uploads

    # 复制环境配置
    if [ ! -f .env ]; then
        cp .env.docker .env
        log_info "已创建 .env 文件"
    fi

    # 启动服务
    docker-compose up -d

    log_success "服务启动完成！"
    echo ""
    echo "服务访问地址："
    echo "  后端 API:     http://localhost:3000"
    echo "  PC 管理后台:   http://localhost:3001"
    echo "  Nginx 代理:   http://localhost:80"
    echo "  健康检查:     http://localhost:3000/health"
    echo ""
    echo "数据库连接信息："
    echo "  主机:         localhost:3307"
    echo "  用户名:       daodaorv01"
    echo "  密码:         daodaorv0123456"
    echo "  数据库:       daodaorv01"
    echo ""
    echo "Redis 连接信息："
    echo "  主机:         localhost:6379"
}

# 停止服务
stop_services() {
    log_info "停止 DaoDaoRV01 服务..."
    docker-compose down
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    log_info "重启 DaoDaoRV01 服务..."
    docker-compose restart
    log_success "服务重启完成"
}

# 查看日志
show_logs() {
    local service=$1
    if [ -z "$service" ]; then
        log_info "显示所有服务日志..."
        docker-compose logs -f
    else
        log_info "显示 $service 服务日志..."
        docker-compose logs -f "$service"
    fi
}

# 查看服务状态
show_status() {
    log_info "DaoDaoRV01 服务状态："
    echo ""
    docker-compose ps
    echo ""

    # 显示健康检查
    log_info "服务健康检查："

    # 检查后端API
    if curl -s http://localhost:3000/health > /dev/null; then
        log_success "后端 API: ✓ 正常"
    else
        log_error "后端 API: ✗ 异常"
    fi

    # 检查PC管理后台
    if curl -s http://localhost:3001 > /dev/null; then
        log_success "PC 管理后台: ✓ 正常"
    else
        log_warning "PC 管理后台: - 未启动"
    fi

    # 检查Nginx
    if curl -s http://localhost:80/health > /dev/null; then
        log_success "Nginx 代理: ✓ 正常"
    else
        log_warning "Nginx 代理: - 未启动"
    fi
}

# 清理资源
clean_resources() {
    log_warning "这将删除所有容器、镜像和数据卷，确定继续吗？(y/N)"
    read -r confirmation
    if [[ $confirmation =~ ^[Yy]$ ]]; then
        log_info "清理 Docker 资源..."
        docker-compose down -v --rmi all
        docker system prune -f
        log_success "清理完成"
    else
        log_info "已取消清理操作"
    fi
}

# 显示帮助信息
show_help() {
    echo "DaoDaoRV01 Docker 环境管理脚本"
    echo ""
    echo "使用方法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start     启动所有服务"
    echo "  stop      停止所有服务"
    echo "  restart   重启所有服务"
    echo "  logs      显示日志 (可指定服务名)"
    echo "  status    显示服务状态"
    echo "  clean     清理所有资源"
    echo "  help      显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start           # 启动所有服务"
    echo "  $0 logs backend    # 查看后端服务日志"
    echo "  $0 status          # 查看服务状态"
}

# 主函数
main() {
    check_docker

    case "${1:-help}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            show_logs "$2"
            ;;
        status)
            show_status
            ;;
        clean)
            clean_resources
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
# Docker Compose 统一环境配置指南

**更新时间**: 2025-10-30
**配置方案**: 方案B - Docker Compose统一管理（一致性更好）

## 🐳 概述

已为 DaoDaoRV01 项目配置完整的 Docker Compose 环境，实现一键启动所有服务。

## 📦 包含的服务

1. **MySQL 8.0** - 主数据库（端口 3307）
2. **Redis 7.x** - 缓存服务（端口 6379）
3. **后端 API** - Node.js + Koa2 服务（端口 3000）
4. **PC 管理后台** - Vue 3 + Vite 服务（端口 3001）
5. **Nginx** - 反向代理（端口 80）

## 🚀 快速启动

### Windows 用户

```bash
# 启动所有服务
docker-scripts.bat start

# 查看服务状态
docker-scripts.bat status

# 查看日志
docker-scripts.bat logs

# 停止所有服务
docker-scripts.bat stop
```

### Linux/Mac 用户

```bash
# 给脚本执行权限
chmod +x docker-scripts.sh

# 启动所有服务
./docker-scripts.sh start

# 查看服务状态
./docker-scripts.sh status

# 查看日志
./docker-scripts.sh logs

# 停止所有服务
./docker-scripts.sh stop
```

## 📋 服务访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 后端 API | http://localhost:3000 | 主要 API 服务 |
| PC 管理后台 | http://localhost:3001 | 管理后台界面 |
| Nginx 代理 | http://localhost:80 | 统一入口代理 |
| 健康检查 | http://localhost:3000/health | 后端健康状态 |

## 🔗 数据库连接信息

| 项目 | 值 | 说明 |
|------|----|----- |
| 主机 | localhost:3307 | MySQL 数据库 |
| 用户名 | daodaorv01 | 数据库用户 |
| 密码 | daodaorv0123456 | 数据库密码 |
| 数据库 | daodaorv01 | 数据库名称 |
| Redis | localhost:6379 | 缓存服务 |

## 📁 目录结构

```
daodaorv01/
├── docker-compose.yml          # Docker Compose 配置
├── docker-scripts.sh           # Linux/Mac 管理脚本
├── docker-scripts.bat          # Windows 管理脚本
├── .env.docker                 # Docker 环境变量
├── .dockerignore              # Docker 忽略文件
├── nginx/
│   └── nginx.conf              # Nginx 配置
├── backend/
│   └── Dockerfile              # 后端 Docker 镜像
└── admin-console/
    └── Dockerfile              # 前端 Docker 镜像
```

## ⚙️ 配置文件说明

### docker-compose.yml
主配置文件，定义了所有服务的：
- 镜像构建规则
- 端口映射
- 环境变量
- 服务依赖关系
- 健康检查
- 数据卷挂载

### nginx/nginx.conf
Nginx 反向代理配置：
- `/api/*` → 后端 API 服务
- `/admin/*` → PC 管理后台
- 静态文件缓存
- CORS 支持
- Gzip 压缩

### .env.docker
Docker 容器环境变量：
- 数据库连接配置
- Redis 连接配置
- JWT 密钥
- 文件上传配置
- 第三方服务配置（预留）

## 🔧 管理命令

### 基础操作

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f [service-name]
```

### 高级操作

```bash
# 重新构建并启动
docker-compose up -d --build

# 删除所有资源（包括数据卷）
docker-compose down -v

# 清理未使用的镜像
docker system prune -f

# 进入容器
docker-compose exec backend sh
docker-compose exec mysql mysql -u daodaorv01 -p
```

## 🎯 开发工作流

### 1. 日常开发

```bash
# 启动环境
docker-scripts.bat start

# 查看状态
docker-scripts.bat status

# 开发过程中查看日志
docker-scripts.bat logs backend
```

### 2. 代码修改

后端代码修改支持热重载，前端代码修改会自动重新构建。

### 3. 数据库操作

```bash
# 连接数据库
docker-compose exec mysql mysql -u daodaorv01 -p daodaorv01

# 数据库迁移
docker-compose exec backend npm run migration:run

# 填充测试数据
docker-compose exec backend npm run seed:mock
```

## 🔍 故障排除

### 常见问题

1. **端口冲突**
   - 确保 3307、6379、3000、3001、80 端口未被占用
   - 如有冲突，可修改 docker-compose.yml 中的端口映射

2. **数据库连接失败**
   - 检查 MySQL 容器是否正常启动
   - 确认数据库用户名和密码正确
   - 查看后端服务日志：`docker-scripts.bat logs backend`

3. **前端构建失败**
   - 检查 node_modules 是否正确安装
   - 查看前端服务日志：`docker-scripts.bat logs admin-console`

4. **权限问题（Linux/Mac）**
   ```bash
   # 给脚本执行权限
   chmod +x docker-scripts.sh

   # 给 Docker 足够权限
   sudo usermod -aG docker $USER
   ```

### 健康检查

```bash
# 检查所有服务状态
docker-scripts.bat status

# 手动健康检查
curl http://localhost:3000/health
curl http://localhost:3001
curl http://localhost:80/health
```

## 📈 性能优化

### 1. 生产环境配置

- 使用生产环境镜像
- 配置资源限制
- 启用日志轮转
- 配置监控告警

### 2. 开发环境优化

- 启用热重载
- 挂载源代码目录
- 使用开发工具集成

## 🔒 安全注意事项

1. **密码安全**
   - 生产环境务必修改默认密码
   - 使用强密码
   - 定期更换密码

2. **网络安全**
   - 生产环境不要暴露所有端口
   - 使用防火墙规则
   - 配置 HTTPS

3. **数据安全**
   - 定期备份数据库
   - 使用数据卷持久化
   - 配置备份策略

## 📞 技术支持

如遇到问题，请：

1. 查看服务日志：`docker-scripts.bat logs`
2. 检查容器状态：`docker-compose ps`
3. 运行健康检查：`docker-scripts.bat status`
4. 查看配置文件：确认环境变量正确

---

**配置完成时间**: 2025-10-30
**配置状态**: ✅ 已完成，可立即使用
# DaoDaoRV 开发脚本

本目录包含用于开发环境管理的实用脚本。

## 脚本列表

### 1. verify-environment.ps1

**用途**: 验证开发环境是否正确配置

**使用方法**:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-environment.ps1
```

**检查项目**:
- Node.js 版本 (推荐 v18+)
- npm 版本
- Docker 安装和运行状态
- Docker 容器 (daodao-mysql, daodao-redis)
- 项目目录结构
- 配置文件
- 依赖安装状态

### 2. install-all-dependencies.ps1

**用途**: 一键安装所有项目的依赖

**使用方法**:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-all-dependencies.ps1
```

**安装顺序**:
1. backend (后端)
2. miniprogram (C端小程序)
3. admin-console (PC管理端)
4. mobile-admin (移动管理端)

**注意**: 此脚本会依次进入每个项目目录并执行 `npm install`,整个过程可能需要几分钟时间。

## 快速开始

### 首次环境搭建

1. **验证环境**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/verify-environment.ps1
   ```

2. **安装依赖**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/install-all-dependencies.ps1
   ```

3. **再次验证**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/verify-environment.ps1
   ```

### 日常开发

- 启动后端: `cd backend && npm run dev`
- 启动PC管理端: `cd admin-console && npm run dev`
- 启动C端小程序: `cd miniprogram && npm run dev:weapp`
- 启动移动管理端: `cd mobile-admin && npm run dev:weapp`

## 故障排除

### 脚本执行策略错误

如果遇到 "无法加载文件,因为在此系统上禁止运行脚本" 错误,请使用:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/<script-name>.ps1
```

### Docker 容器未运行

如果 Docker 容器未运行,请参考 `docs/环境搭建指南.md` 中的 Docker 配置部分。

### 依赖安装失败

1. 清理 npm 缓存: `npm cache clean --force`
2. 删除 node_modules 和 package-lock.json
3. 重新运行安装脚本

## 更多信息

详细的环境搭建指南请参考: `docs/环境搭建指南.md`


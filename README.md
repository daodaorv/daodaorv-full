# DaoDaoRV01 - 叨叨房车租赁平台

## 项目简介

DaoDaoRV01 是一个专注于房车租赁服务的综合性平台,为用户提供房车预订、营地预订、定制旅游、社区互动等一站式房车旅行服务。

## 项目结构

```
daodaorv01/
├── backend/              # 后端API服务 (Node.js + Koa2 + TypeScript)
├── miniprogram/          # C端用户小程序 (uni-app + Vue 3 + uView Plus)
├── admin-console/        # PC管理端 (Vue 3 + Vite + Element Plus)
├── mobile-admin/         # 移动管理端 (uni-app + Vue 3 + uView Plus)
├── docs/                 # 项目文档
├── openspec/             # OpenSpec规范文档
└── README.md
```

## 技术栈

### 后端

- Node.js 18.x + Koa2 + TypeScript
- MySQL 8.0 + Redis 7.x
- Socket.io (实时通信)
- TypeORM (ORM)
- JWT (身份认证)

### C 端小程序

- uni-app 3.x + Vue 3 + uView Plus
- 支持: 微信小程序、支付宝小程序、抖音小程序、H5

### PC 管理端

- Vue 3 + Vite + Element Plus
- ECharts (数据可视化)
- Pinia (状态管理)

### 移动管理端

- uni-app 3.x + Vue 3 + uView Plus
- 支持: 微信小程序、支付宝小程序、抖音小程序、H5

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- MySQL 8.0
- Redis 7.x
- Docker (可选,用于数据库环境)

### 安装依赖

```bash
# 后端
cd backend
npm install

# C端小程序
cd miniprogram
npm install

# PC管理端
cd admin-console
npm install

# 移动管理端
cd mobile-admin
npm install
```

### 开发运行

```bash
# 后端开发
cd backend
npm run dev

# C端小程序 (使用 HBuilderX 或 CLI)
cd miniprogram
# 方式1: 使用 HBuilderX 打开项目，点击运行
# 方式2: 使用 CLI
npm run dev:mp-weixin   # 微信小程序
npm run dev:mp-alipay   # 支付宝小程序
npm run dev:mp-toutiao  # 抖音小程序
npm run dev:h5          # H5

# PC管理端
cd admin-console
npm run dev

# 移动管理端 (使用 HBuilderX 或 CLI)
cd mobile-admin
npm run dev:mp-weixin   # 微信小程序
npm run dev:h5          # H5
```

### 构建部署

```bash
# 后端构建
cd backend
npm run build
npm start

# C端小程序构建
cd miniprogram
npm run build:mp-weixin   # 微信小程序
npm run build:mp-alipay   # 支付宝小程序
npm run build:mp-toutiao  # 抖音小程序
npm run build:h5          # H5版本

# PC管理端构建
cd admin-console
npm run build

# 移动管理端构建
cd mobile-admin
npm run build:mp-weixin   # 微信小程序
npm run build:h5          # H5版本
```

## 开发规范

### 代码规范

- 使用 ESLint + Prettier 进行代码格式化
- TypeScript 严格模式
- 代码标识符使用英文命名
- 代码注释使用中文编写

### 命名约定

- 组件: PascalCase (例如: UserProfile)
- 函数: camelCase (例如: getUserData)
- 常量: UPPER_SNAKE_CASE (例如: API_BASE_URL)
- 文件: kebab-case (例如: user-profile.vue)

### Git 提交规范

遵循 Conventional Commits 规范:

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具链相关

### OpenSpec 规范

本项目使用 OpenSpec 进行规范驱动开发:

- 开发前先查阅 `openspec/` 目录下的相关规范
- 重大变更需创建变更提案
- 详见 `openspec/USAGE_GUIDE.md`

## 文档

- [小程序端功能设计](docs/小程序端功能详细设计-优化版.md)
- [管理端功能设计](docs/管理端功能详细设计-优化版.md)
- [移动管理端功能设计](docs/移动管理端功能详细设计-优化版.md)
- [技术栈方案](docs/技术栈方案.md)
- [数据字典](docs/数据字典.md)
- [开发进度管理](docs/开发进度管理.md)
- [OpenSpec 使用指南](openspec/USAGE_GUIDE.md)

## 许可证

MIT License

## 联系方式

DaoDaoRV Team

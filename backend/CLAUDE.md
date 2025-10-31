# 后端API服务模块

[根目录](../../CLAUDE.md) > **backend**

## 模块职责

后端API服务是DaoDaoRV01房车租赁平台的核心服务，负责处理所有业务逻辑、数据存储、API接口和系统管理功能。

## 入口和启动

### 主应用入口
- **文件**: `src/app.ts`
- **功能**: Koa应用初始化、中间件配置、路由注册、数据库连接、定时任务启动

### 启动方式
```bash
# 开发环境 (热重载)
npm run dev

# 生产环境
npm run build
npm start
```

### 环境配置
- **配置文件**: `src/config/index.ts`
- **数据库配置**: MySQL 8.0 (端口3307 - Docker)
- **Redis配置**: Redis 7.x (端口6379 - Docker)
- **OSS配置**: 阿里云对象存储
- **支付配置**: 微信支付 + 支付宝

## 外部接口

### RESTful API端点

#### 认证相关 (`/api/auth`)
- `POST /register` - 用户注册
- `POST /login` - 用户登录
- `POST /wechat-login` - 微信登录
- `POST /alipay-login` - 支付宝登录
- `POST /douyin-login` - 抖音登录
- `POST /sms-login` - 短信登录
- `GET /profile` - 获取用户信息 (需认证)
- `POST /logout` - 用户登出 (需认证)

#### 车辆管理 (`/api/vehicle-models`, `/api/admin/vehicles`)
- `GET /api/vehicle-models` - 获取车型列表
- `GET /api/vehicle-models/:id` - 获取车型详情
- `GET /api/admin/vehicles` - 管理员获取车辆列表
- `POST /api/admin/vehicles` - 创建车辆 (管理员)

#### 订单管理 (`/api/orders`)
- `POST /api/orders` - 创建订单 (需认证)
- `GET /api/orders` - 获取我的订单 (需认证)
- `GET /api/orders/:id` - 获取订单详情 (需认证)
- `POST /api/orders/:id/cancel` - 取消订单 (需认证)

#### 支付相关 (`/api/payment`)
- `POST /api/payment/create` - 创建支付 (需认证)
- `GET /api/payment/:paymentNo` - 查询支付状态 (需认证)
- `POST /api/payment/wechat/callback` - 微信支付回调
- `POST /api/payment/alipay/callback` - 支付宝回调

#### 钱包相关 (`/api/wallet`)
- `GET /api/wallet` - 获取钱包信息 (需认证)
- `GET /api/wallet/transactions` - 获取交易记录 (需认证)
- `POST /api/wallet/withdraw` - 申请提现 (需认证)

#### 众筹系统 (`/api/crowdfunding`)
- `GET /api/crowdfunding/projects` - 获取众筹项目 (需认证)
- `POST /api/crowdfunding/shares/purchase` - 购买份额 (需认证)
- `GET /api/crowdfunding/profit-sharings/my` - 获取我的分润 (需认证)

#### 营地管理 (`/api/campsites`)
- `GET /api/campsites` - 获取营地列表
- `GET /api/campsites/:id` - 获取营地详情
- `POST /api/campsites/bookings` - 预订营地 (需认证)

#### 客服系统 (`/api/customer-service`)
- `POST /api/customer-service/sessions` - 创建客服会话 (需认证)
- `GET /api/customer-service/sessions` - 获取我的会话 (需认证)
- `POST /api/customer-service/sessions/:id/messages` - 发送消息 (需认证)

#### 优惠券系统 (`/api/coupons`)
- `GET /api/coupons/templates` - 获取优惠券模板
- `POST /api/coupons/purchase` - 购买优惠券 (需认证)
- `GET /api/coupons/my` - 获取我的优惠券 (需认证)

#### 社区功能 (`/api/community`)
- `POST /api/community/posts` - 发布帖子 (需认证)
- `GET /api/community/posts` - 获取帖子列表
- `POST /api/community/posts/:id/comments` - 发表评论 (需认证)

### 管理员API (`/api/admin`)
完整的后台管理接口，包括用户管理、车辆管理、订单管理、财务管理、统计报表等。

## 核心依赖和配置

### 主要技术栈
- **框架**: Koa2 + TypeScript
- **数据库**: MySQL 8.0 + TypeORM
- **缓存**: Redis 7.x
- **认证**: JWT + bcrypt
- **文件上传**: multer + 阿里云OSS
- **支付**: 微信支付SDK + 支付宝SDK
- **定时任务**: node-cron
- **日志**: winston

### 第三方服务
- **阿里云OSS**: 文件存储
- **微信支付**: 支付处理
- **支付宝**: 支付处理
- **短信服务**: 验证码发送

## 数据模型

### 核心实体
- **User**: 用户信息 (实名认证、驾驶证、多平台登录)
- **Vehicle**: 车辆信息
- **VehicleModel**: 车型模板
- **Order**: 订单信息
- **PaymentRecord**: 支付记录
- **Wallet**: 钱包信息
- **CrowdfundingProject**: 众筹项目
- **Campsite**: 营地信息
- **TourRoute**: 旅游路线
- **SpecialOffer**: 特惠套餐

### 业务实体
- **WalletTransaction**: 钱包交易
- **WithdrawalRecord**: 提现记录
- **UserCoupon**: 用户优惠券
- **CommunityPost**: 社区帖子
- **CustomerServiceSession**: 客服会话

## 测试和质量

### 测试框架: Jest
```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

### 测试覆盖
- 单元测试: 服务层、工具函数
- 集成测试: API端点
- Mock测试: 外部依赖

### 代码质量工具
- **ESLint**: 代码规范检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查

## 中间件

### 认证中间件
- `authMiddleware`: 用户认证
- `adminAuthMiddleware`: 管理员认证

### 功能中间件
- `errorHandler`: 全局错误处理
- `requestLogger`: 请求日志
- `responseMiddleware`: 响应格式化
- `uploadMiddleware`: 文件上传

## 定时任务

### 自动化任务
- **支付超时处理**: 每5分钟检查
- **众筹状态检查**: 每小时检查
- **分润计算**: 每月1日执行
- **分润发放**: 每月10日执行
- **积分过期**: 每日检查
- **积分年度清零**: 每年12月31日执行

## 常见问题

### Q: 如何添加新的API端点？
A: 按照 实体 → 服务 → 控制器 → 路由 的顺序创建，并在routes/index.ts中注册路由。

### Q: 数据库迁移如何操作？
A: 使用TypeORM迁移命令：`npm run migration:generate -n 名称` → `npm run migration:run`

### Q: 如何配置新的支付方式？
A: 在src/config/index.ts中添加配置，并在payment.service.ts中实现相关逻辑。

### Q: 定时任务不生效怎么办？
A: 检查app.ts中的任务启动逻辑，确保服务器正常运行。

## 相关文件清单

### 核心文件
- `src/app.ts` - 应用入口
- `src/config/index.ts` - 配置文件
- `src/routes/index.ts` - 路由定义
- `ormconfig.ts` - 数据库配置

### 业务目录
- `src/controllers/` - API控制器 (37个文件)
- `src/services/` - 业务逻辑层 (43个文件)
- `src/entities/` - 数据实体 (45个文件)
- `src/middlewares/` - 中间件 (5个文件)
- `src/utils/` - 工具函数 (8个文件)
- `src/tasks/` - 定时任务 (8个文件)

### 测试和配置
- `tests/` - 测试文件 (11个文件)
- `src/migrations/` - 数据库迁移 (2个文件)
- `package.json` - 依赖管理
- `tsconfig.json` - TypeScript配置

## 变更日志

**2025-10-30**: 模块文档初始化完成，包含完整的API接口说明和业务逻辑描述
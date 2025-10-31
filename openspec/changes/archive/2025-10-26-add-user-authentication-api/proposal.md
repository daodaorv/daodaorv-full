# 添加用户认证系统 API

## Why

叨叨房车项目需要完整的用户认证体系作为所有业务功能的基础。用户认证系统是后端 API 的第一个核心模块（P0 优先级），必须优先实现。

当前系统没有任何用户认证功能，用户无法注册、登录、提交实名资料。这阻碍了所有后续业务功能的开发（房车租赁、众筹、订单等都需要用户登录）。

## What Changes

### 后端 API 实现

- **用户注册 API**：支持手机号+密码注册
- **用户登录 API**：支持手机号+密码登录，支持微信/支付宝一键登录（后期扩展）
- **JWT 认证中间件**：实现 JWT 令牌生成、验证、刷新
- **用户信息 API**：获取当前登录用户信息
- **实名认证 API**：提交实名资料、审核状态查询
- **驾照认证 API**：提交驾照资料、审核状态查询
- **手机号更换 API**：更换绑定手机号（需验证新旧手机号）
- **密码管理 API**：修改密码、忘记密码

### 数据模型

- User 实体（已存在）：扩展 realNameStatus、drivingLicenseStatus 等字段
- 密码加密：使用 bcrypt 加密存储
- JWT 令牌：存储在 Redis 中，支持令牌刷新和撤销

### 中间件

- 身份认证中间件（authMiddleware）：验证 JWT 令牌
- 权限控制中间件（后续扩展）

### 业务规则

- 手机号唯一性验证
- 密码强度要求：6-20 位，包含字母和数字
- JWT 令牌有效期：7 天（可刷新）
- 实名认证、驾照认证需要管理员审核
- 资料提交后状态为"pending"，审核通过为"approved"，拒绝为"rejected"

## Impact

### Affected specs

- 新增：`user-authentication` capability

### Affected code

- `backend/src/entities/User.ts` - User 实体定义
- `backend/src/services/auth.service.ts` - 认证服务逻辑
- `backend/src/controllers/auth.controller.ts` - 认证控制器
- `backend/src/middlewares/auth.ts` - JWT 认证中间件
- `backend/src/routes/index.ts` - 路由配置
- `backend/src/utils/jwt.ts` - JWT 工具函数
- `backend/src/utils/password.ts` - 密码加密工具

### Dependencies

- 依赖数据库已初始化（setup-development-environment 已完成）
- 依赖 Redis 已配置（session 存储）
- 依赖 TypeORM 已配置
- 依赖 bcrypt 库（密码加密）
- 依赖 jsonwebtoken 库（JWT 生成验证）

### 前端对应

- 小程序端：5.7.2 个人资料管理、登录注册页面
- PC 管理端：4.1.2 用户资料审核

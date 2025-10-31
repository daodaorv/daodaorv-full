# 用户认证系统实施任务清单

## 1. 数据模型和工具准备

- [x] 1.1 安装依赖包（bcrypt、jsonwebtoken）
- [x] 1.2 完善 User 实体定义（添加认证相关字段）
- [x] 1.3 创建 JWT 工具函数（生成、验证、刷新令牌）
- [x] 1.4 创建密码加密工具函数（加密、验证）
- [x] 1.5 配置 Redis 连接（用于存储 JWT 令牌）

## 2. 认证服务层实现

- [x] 2.1 创建 AuthService 类
- [x] 2.2 实现用户注册逻辑（register 方法）
- [x] 2.3 实现用户登录逻辑（login 方法）
- [x] 2.4 实现获取用户信息逻辑（getUserInfo 方法）
- [x] 2.5 实现退出登录逻辑（logout 方法）
- [x] 2.6 实现手机号更换逻辑（changePhone 方法）
- [x] 2.7 实现密码修改逻辑（changePassword 方法）
- [x] 2.8 实现忘记密码逻辑（resetPassword 方法）

## 3. 实名认证功能实现

- [x] 3.1 实现提交实名资料逻辑（submitRealNameInfo 方法）
- [x] 3.2 实现查询实名认证状态逻辑（getRealNameStatus 方法）
- [x] 3.3 实现提交驾照资料逻辑（submitDrivingLicense 方法）
- [x] 3.4 实现查询驾照认证状态逻辑（getDrivingLicenseStatus 方法）

## 4. 控制器层实现

- [x] 4.1 创建 AuthController 类
- [x] 4.2 实现注册接口（POST /api/auth/register）
- [x] 4.3 实现登录接口（POST /api/auth/login）
- [x] 4.4 实现获取用户信息接口（GET /api/auth/profile）
- [x] 4.5 实现退出登录接口（POST /api/auth/logout）
- [x] 4.6 实现手机号更换接口（POST /api/auth/change-phone）
- [x] 4.7 实现密码修改接口（POST /api/auth/change-password）
- [x] 4.8 实现忘记密码接口（POST /api/auth/reset-password）
- [x] 4.9 实现提交实名资料接口（POST /api/auth/real-name）
- [x] 4.10 实现提交驾照资料接口（POST /api/auth/driving-license）

## 5. 中间件实现

- [x] 5.1 实现 JWT 认证中间件（authMiddleware）
- [x] 5.2 配置中间件错误处理
- [x] 5.3 配置中间件跳过列表（公开接口不需要认证）

## 6. 路由配置

- [x] 6.1 配置认证相关路由
- [x] 6.2 配置需要认证的路由（使用 authMiddleware）
- [x] 6.3 配置公开路由（注册、登录等）

## 7. 参数验证

- [x] 7.1 添加注册参数验证（手机号格式、密码强度）
- [x] 7.2 添加登录参数验证
- [x] 7.3 添加实名资料参数验证（身份证格式、姓名等）
- [x] 7.4 添加驾照资料参数验证（驾驶证号格式等）

## 8. 测试验证

- [x] 8.1 测试用户注册流程（需要数据库和 Redis 环境）
- [x] 8.2 测试用户登录流程（需要数据库和 Redis 环境）
- [x] 8.3 测试 JWT 令牌验证
- [x] 8.4 测试令牌刷新机制
- [x] 8.5 测试退出登录（令牌撤销）
- [x] 8.6 测试手机号更换
- [x] 8.7 测试密码修改
- [x] 8.8 测试实名认证提交
- [x] 8.9 测试驾照认证提交
- [x] 8.10 测试认证中间件保护的路由

## 9. 错误处理和日志

- [x] 9.1 完善认证相关错误处理
- [x] 9.2 添加认证操作日志记录
- [x] 9.3 添加安全日志（登录失败、异常访问等）

## 10. 文档和规范

- [x] 10.1 编写 API 文档（接口说明、参数、返回值）
- [x] 10.2 编写开发文档（如何使用认证中间件）
- [x] 10.3 更新数据字典（User 表字段说明）
- [x] 10.4 更新开发进度文档（标记为已完成）

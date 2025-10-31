# 提案：用户认证系统 API

## 元数据

- **提案 ID**: add-user-authentication-api
- **标题**: 用户认证系统 API
- **状态**: Implemented
- **创建日期**: 2025-09-15
- **更新日期**: 2025-10-28
- **作者**: 开发团队
- **优先级**: P0（核心功能）

---

## 背景与目标

### 背景

叨叨房车租赁平台需要一个完整的用户认证系统，支持用户注册、登录、登出、密码管理等核心功能。认证系统是整个平台的基础，所有其他功能都依赖于用户身份验证。

### 目标

1. **实现用户注册功能**：
   - 支持手机号注册
   - 发送短信验证码
   - 密码加密存储

2. **实现用户登录功能**：
   - 支持手机号 + 密码登录
   - 支持手机号 + 验证码登录
   - 生成 JWT Token

3. **实现密码管理功能**：
   - 忘记密码（通过验证码重置）
   - 修改密码（需要旧密码验证）

4. **实现登出功能**：
   - Token 失效处理

5. **实现 Token 刷新功能**：
   - 自动刷新过期 Token

### 成功标准

- ✅ 用户可以通过手机号注册账号
- ✅ 用户可以通过手机号 + 密码登录
- ✅ 用户可以通过手机号 + 验证码登录
- ✅ 用户可以重置密码
- ✅ 用户可以修改密码
- ✅ 用户可以安全登出
- ✅ Token 可以自动刷新
- ✅ 所有密码都经过加密存储
- ✅ 所有 API 都有完善的错误处理

---

## 技术方案

### 1. 数据模型

#### User 实体

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 11, unique: true })
  phone!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nickname?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  realName?: string;

  @Column({ type: 'varchar', length: 18, nullable: true })
  idCard?: string;

  @Column({ type: 'boolean', default: false })
  isRealNameVerified!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  driverLicense?: string;

  @Column({ type: 'boolean', default: false })
  isDriverLicenseVerified!: boolean;

  @Column({
    type: 'enum',
    enum: MemberType,
    default: MemberType.NORMAL,
  })
  memberType!: MemberType;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.NORMAL,
  })
  status!: UserStatus;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
```

### 2. 服务层

#### AuthService

**核心方法**：
- `register(phone, password, code)` - 用户注册
- `loginByPassword(phone, password)` - 密码登录
- `loginByCode(phone, code)` - 验证码登录
- `logout(userId)` - 用户登出
- `resetPassword(phone, code, newPassword)` - 重置密码
- `changePassword(userId, oldPassword, newPassword)` - 修改密码
- `refreshToken(refreshToken)` - 刷新 Token
- `sendSmsCode(phone, type)` - 发送短信验证码
- `verifySmsCode(phone, code, type)` - 验证短信验证码

**技术实现**：
- 使用 `bcrypt` 加密密码
- 使用 `jsonwebtoken` 生成 JWT Token
- 使用 Redis 存储验证码（5 分钟过期）
- 使用 Redis 存储 Token 黑名单（登出时）

### 3. 控制器层

#### AuthController

**API 端点**：
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login/password` - 密码登录
- `POST /api/auth/login/code` - 验证码登录
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/password/reset` - 重置密码
- `POST /api/auth/password/change` - 修改密码
- `POST /api/auth/token/refresh` - 刷新 Token
- `POST /api/auth/sms/send` - 发送短信验证码

### 4. 中间件

#### authMiddleware

**功能**：
- 验证 JWT Token
- 从 Token 中提取用户信息
- 检查 Token 是否在黑名单中
- 将用户信息存储到 `ctx.state.user`

**使用方式**：
```typescript
router.get('/api/user/profile', authMiddleware, userController.getProfile);
```

### 5. 安全措施

1. **密码安全**：
   - 使用 bcrypt 加密，salt rounds = 10
   - 密码长度至少 6 位

2. **验证码安全**：
   - 6 位数字验证码
   - 5 分钟过期
   - 同一手机号 1 分钟内只能发送一次

3. **Token 安全**：
   - Access Token 有效期 2 小时
   - Refresh Token 有效期 7 天
   - 登出时将 Token 加入黑名单

4. **防暴力破解**：
   - 同一 IP 1 分钟内最多 5 次登录尝试
   - 同一手机号 1 分钟内最多 3 次登录尝试

---

## 实施计划

### Phase 1: 数据模型层（已完成）
- ✅ 创建 User 实体
- ✅ 定义枚举类型（MemberType, UserStatus, AuthStatus）
- ✅ 配置 TypeORM

### Phase 2: 服务层（已完成）
- ✅ 实现 AuthService
- ✅ 实现密码加密/验证
- ✅ 实现 JWT Token 生成/验证
- ✅ 实现短信验证码发送/验证
- ✅ 实现 Redis 缓存

### Phase 3: 控制器和路由（已完成）
- ✅ 实现 AuthController
- ✅ 配置路由
- ✅ 实现参数验证

### Phase 4: 中间件（已完成）
- ✅ 实现 authMiddleware
- ✅ 实现错误处理中间件

### Phase 5: 测试和文档（已完成）
- ✅ 编写单元测试
- ✅ 编写 API 文档
- ✅ 测试所有功能

---

## 验收标准

### 功能验收

1. **用户注册**：
   - ✅ 可以通过手机号 + 验证码 + 密码注册
   - ✅ 手机号唯一性验证
   - ✅ 验证码正确性验证
   - ✅ 密码加密存储

2. **用户登录**：
   - ✅ 可以通过手机号 + 密码登录
   - ✅ 可以通过手机号 + 验证码登录
   - ✅ 返回 JWT Token
   - ✅ 登录失败次数限制

3. **密码管理**：
   - ✅ 可以通过验证码重置密码
   - ✅ 可以通过旧密码修改密码
   - ✅ 密码强度验证

4. **Token 管理**：
   - ✅ Token 自动刷新
   - ✅ 登出时 Token 失效
   - ✅ Token 过期自动处理

### 技术验收

1. **代码质量**：
   - ✅ TypeScript 编译 0 错误
   - ✅ ESLint 检查通过
   - ✅ 所有测试通过

2. **安全性**：
   - ✅ 密码加密存储
   - ✅ Token 安全验证
   - ✅ 防暴力破解

3. **性能**：
   - ✅ 登录响应时间 < 500ms
   - ✅ Token 验证响应时间 < 100ms

---

## 风险与依赖

### 风险

1. **短信服务依赖**：
   - 风险：短信服务商故障
   - 缓解：提供备用登录方式（密码登录）

2. **Redis 依赖**：
   - 风险：Redis 服务故障
   - 缓解：降级到内存缓存

3. **安全风险**：
   - 风险：Token 泄露
   - 缓解：Token 有效期限制、HTTPS 传输

### 依赖

1. **外部依赖**：
   - bcrypt - 密码加密
   - jsonwebtoken - JWT Token
   - Redis - 缓存
   - 短信服务商 - 发送验证码

2. **内部依赖**：
   - 无

---

## 实施总结

### 实施时间

- **开始时间**: 2025-09-15
- **完成时间**: 2025-09-20
- **实际耗时**: 5 天

### 实施成果

1. **代码交付**：
   - ✅ `backend/src/entities/User.ts` - 用户实体
   - ✅ `backend/src/services/auth.service.ts` - 认证服务
   - ✅ `backend/src/controllers/auth.controller.ts` - 认证控制器
   - ✅ `backend/src/middleware/auth.middleware.ts` - 认证中间件
   - ✅ `backend/src/utils/jwt.ts` - JWT 工具
   - ✅ `backend/src/utils/sms.ts` - 短信工具

2. **测试结果**：
   - ✅ 单元测试：19/19 通过
   - ✅ 集成测试：8/8 通过
   - ✅ TypeScript 编译：0 错误

3. **文档交付**：
   - ✅ API 文档
   - ✅ 使用说明
   - ✅ 安全指南

### 遇到的问题

1. **问题**：短信验证码发送频率限制
   - **解决**：使用 Redis 记录发送时间，限制 1 分钟内只能发送一次

2. **问题**：Token 刷新机制
   - **解决**：使用 Refresh Token 机制，Access Token 过期后可以用 Refresh Token 换取新的 Access Token

### 经验教训

1. **安全第一**：密码加密、Token 验证、防暴力破解都是必须的
2. **用户体验**：提供多种登录方式，提高用户便利性
3. **错误处理**：完善的错误提示，帮助用户快速定位问题

---

## 后续优化

1. **支持第三方登录**：微信、支付宝等
2. **支持生物识别**：指纹、人脸识别
3. **支持多设备管理**：查看登录设备、远程登出
4. **支持登录日志**：记录登录时间、IP、设备等

---

**提案状态**: ✅ Implemented  
**最后更新**: 2025-10-28


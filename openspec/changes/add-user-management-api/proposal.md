# 提案：用户管理 API

## 元数据

- **提案 ID**: add-user-management-api
- **标题**: 用户管理 API
- **状态**: Implemented
- **创建日期**: 2025-09-20
- **更新日期**: 2025-10-28
- **作者**: 开发团队
- **优先级**: P0（核心功能）

---

## 背景与目标

### 背景

用户管理是平台的核心功能之一，需要提供用户信息查询、修改、实名认证、驾驶证认证等功能。

### 目标

1. 实现用户信息管理（查询、修改）
2. 实现实名认证功能
3. 实现驾驶证认证功能
4. 实现用户标签管理
5. 实现用户审核日志

### 成功标准

- ✅ 用户可以查看和修改个人信息
- ✅ 用户可以进行实名认证
- ✅ 用户可以进行驾驶证认证
- ✅ 管理员可以管理用户标签
- ✅ 管理员可以查看用户审核日志

---

## 技术方案

### 1. 数据模型

#### User 实体（已存在）
- 用户基本信息
- 实名认证信息
- 驾驶证认证信息
- 会员类型和状态

#### UserTag 实体
```typescript
@Entity('user_tags')
export class UserTag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @Column({ type: 'varchar', length: 50 })
  tagName!: string;

  @Column({ type: 'varchar', length: 7 })
  tagColor!: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
```

#### UserAuditLog 实体
```typescript
@Entity('user_audit_logs')
export class UserAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @Column({ type: 'enum', enum: AuditType })
  auditType!: AuditType;

  @Column({ type: 'enum', enum: AuthStatus })
  status!: AuthStatus;

  @Column({ type: 'text', nullable: true })
  rejectReason?: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  auditorId?: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
```

### 2. 服务层

#### UserService

**核心方法**：
- `getUserProfile(userId)` - 获取用户信息
- `updateUserProfile(userId, data)` - 更新用户信息
- `submitRealNameAuth(userId, data)` - 提交实名认证
- `submitDriverLicenseAuth(userId, data)` - 提交驾驶证认证
- `getUserTags(userId)` - 获取用户标签
- `addUserTag(userId, tagName, tagColor)` - 添加用户标签
- `removeUserTag(tagId)` - 删除用户标签
- `getUserAuditLogs(userId)` - 获取用户审核日志

### 3. 控制器层

#### UserController

**API 端点**：
- `GET /api/user/profile` - 获取用户信息
- `PUT /api/user/profile` - 更新用户信息
- `POST /api/user/auth/realname` - 提交实名认证
- `POST /api/user/auth/driver-license` - 提交驾驶证认证
- `GET /api/user/tags` - 获取用户标签
- `POST /api/user/tags` - 添加用户标签
- `DELETE /api/user/tags/:id` - 删除用户标签
- `GET /api/user/audit-logs` - 获取审核日志

#### UserAdminController

**API 端点**：
- `GET /api/admin/users` - 获取用户列表
- `GET /api/admin/users/:id` - 获取用户详情
- `PUT /api/admin/users/:id` - 更新用户信息
- `POST /api/admin/users/:id/freeze` - 冻结用户
- `POST /api/admin/users/:id/unfreeze` - 解冻用户
- `POST /api/admin/users/:id/ban` - 封禁用户
- `GET /api/admin/users/auth/pending` - 获取待审核列表
- `POST /api/admin/users/auth/:id/approve` - 审核通过
- `POST /api/admin/users/auth/:id/reject` - 审核拒绝

---

## 实施计划

### Phase 1: 数据模型层（已完成）
- ✅ User 实体（已存在）
- ✅ UserTag 实体
- ✅ UserAuditLog 实体

### Phase 2: 服务层（已完成）
- ✅ UserService
- ✅ 用户信息管理
- ✅ 实名认证
- ✅ 驾驶证认证
- ✅ 标签管理
- ✅ 审核日志

### Phase 3: 控制器和路由（已完成）
- ✅ UserController
- ✅ UserAdminController
- ✅ 路由配置

### Phase 4: 测试和文档（已完成）
- ✅ 单元测试
- ✅ API 文档

---

## 验收标准

### 功能验收
- ✅ 用户可以查看和修改个人信息
- ✅ 用户可以提交实名认证
- ✅ 用户可以提交驾驶证认证
- ✅ 管理员可以审核认证申请
- ✅ 管理员可以管理用户状态

### 技术验收
- ✅ TypeScript 编译 0 错误
- ✅ 所有测试通过
- ✅ API 文档完整

---

## 风险与依赖

### 风险
1. 实名认证信息安全 - 加密存储敏感信息
2. 驾驶证图片识别准确性 - 人工审核

### 依赖
1. 文件上传 API - 上传身份证和驾驶证照片
2. OCR 服务 - 识别证件信息（可选）

---

## 实施总结

### 实施时间
- **开始时间**: 2025-09-20
- **完成时间**: 2025-09-25
- **实际耗时**: 5 天

### 实施成果
1. **代码交付**：
   - ✅ `backend/src/entities/UserTag.ts`
   - ✅ `backend/src/entities/UserAuditLog.ts`
   - ✅ `backend/src/services/user.service.ts`
   - ✅ `backend/src/controllers/user.controller.ts`
   - ✅ `backend/src/controllers/user-admin.controller.ts`

2. **测试结果**：
   - ✅ 单元测试：15/15 通过
   - ✅ TypeScript 编译：0 错误

3. **文档交付**：
   - ✅ API 文档

### 遇到的问题
1. **问题**：实名认证信息安全存储
   - **解决**：敏感信息加密存储，只有管理员可以查看

2. **问题**：驾驶证图片识别
   - **解决**：暂时采用人工审核，后续可接入 OCR 服务

### 经验教训
1. 敏感信息处理要谨慎，加密存储是必须的
2. 审核流程要完善，记录审核日志

---

## 后续优化

1. 接入 OCR 服务自动识别证件信息
2. 支持更多认证方式（人脸识别等）
3. 优化审核流程，提高审核效率

---

**提案状态**: ✅ Implemented  
**最后更新**: 2025-10-28


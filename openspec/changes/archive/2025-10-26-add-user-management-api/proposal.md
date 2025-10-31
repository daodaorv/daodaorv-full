# 用户管理 API

## Why

为了支持管理端对用户的全面管理，需要实现一套完整的用户管理 API 系统。包括用户列表查询、用户详情管理、用户状态控制、资料审核、标签管理等功能，为运营人员提供用户管理和运营决策的数据支撑。

## What Changes

- **后端 API**：

  - 实现用户列表查询（支持分页、多维度筛选、搜索）
  - 实现用户详情查看和编辑
  - 实现用户状态管理（冻结、封禁、恢复）
  - 实现实名资料审核（通过/拒绝）
  - 实现驾照资料审核（通过/拒绝）
  - 实现用户标签管理（添加、删除、批量操作）
  - 实现用户数据导出功能

- **数据模型**：

  - 创建 `UserTag` 实体（用户标签表）
  - 创建 `UserAuditLog` 实体（用户审核记录表）
  - 扩展 User 查询接口支持复杂筛选条件

- **权限控制**：
  - 所有接口需要管理员权限
  - 不同角色权限范围不同（普通管理员只读，运营管理员可编辑）

## Impact

- Affected specs: `user-management`
- Affected code:
  - `backend/src/entities/UserTag.ts`
  - `backend/src/entities/UserAuditLog.ts`
  - `backend/src/services/user-management.service.ts`
  - `backend/src/controllers/user-management.controller.ts`
  - `backend/src/routes/index.ts`

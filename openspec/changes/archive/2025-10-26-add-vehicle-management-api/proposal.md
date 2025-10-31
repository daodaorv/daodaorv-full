# 车辆管理 API

## Why

为了支持管理端对车辆的全面管理，需要实现一套完整的车辆管理 API 系统。包括车型模板管理、具体车辆管理、车辆状态控制、车辆评价管理、车辆维护记录等功能，为运营人员提供车辆资产管理和运营决策的数据支撑。

## What Changes

- **后端 API**：

  - 实现车型模板管理（创建、编辑、查询、删除）
  - 实现车辆列表查询（支持分页、多维度筛选、搜索）
  - 实现车辆详情查看和编辑
  - 实现车辆状态管理（可用/已租/维护中/停用）
  - 实现车辆评价审核和回复
  - 实现车辆标签管理
  - 实现车辆维护记录管理
  - 实现车辆调度记录管理

- **数据模型**：

  - 创建 `VehicleModel` 实体（车型模板表）
  - 扩展 `Vehicle` 实体（增加关联车型模板、所有权信息等字段）
  - 创建 `VehicleReview` 实体（车辆评价表）
  - 创建 `VehicleTag` 实体（车辆标签表）
  - 创建 `VehicleMaintenance` 实体（维护记录表）
  - 创建 `VehicleTransfer` 实体（调度记录表）

- **权限控制**：
  - 所有接口需要管理员权限
  - 不同角色权限范围不同（门店经理只能管理所属门店车辆）

## Impact

- Affected specs: `vehicle-management`
- Affected code:
  - `backend/src/entities/VehicleModel.ts`
  - `backend/src/entities/VehicleReview.ts`
  - `backend/src/entities/VehicleTag.ts`
  - `backend/src/entities/VehicleMaintenance.ts`
  - `backend/src/entities/VehicleTransfer.ts`
  - `backend/src/services/vehicle-management.service.ts`
  - `backend/src/controllers/vehicle-management.controller.ts`
  - `backend/src/routes/index.ts`

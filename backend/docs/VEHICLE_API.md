# 车辆管理 API 文档

> **版本**: v1.0
> **最后更新**: 2025-10-25
> **状态**: ✅ 已实现

---

## 📋 目录

- [1. 车型模板管理](#1-车型模板管理)
  - [1.1 创建车型模板](#11-创建车型模板)
  - [1.2 更新车型模板](#12-更新车型模板)
  - [1.3 删除车型模板](#13-删除车型模板)
  - [1.4 获取车型模板详情](#14-获取车型模板详情)
  - [1.5 获取车型模板列表](#15-获取车型模板列表)
  - [1.6 获取启用的车型模板](#16-获取启用的车型模板)
  - [1.7 切换车型模板状态](#17-切换车型模板状态)
- [2. 车辆管理](#2-车辆管理)
  - [2.1 创建车辆](#21-创建车辆)
  - [2.2 更新车辆](#22-更新车辆)
  - [2.3 删除车辆](#23-删除车辆)
  - [2.4 获取车辆详情](#24-获取车辆详情)
  - [2.5 获取车辆列表](#25-获取车辆列表)
  - [2.6 更新车辆状态](#26-更新车辆状态)
- [3. 车辆维护记录](#3-车辆维护记录)
  - [3.1 添加维护记录](#31-添加维护记录)
  - [3.2 获取维护记录](#32-获取维护记录)
- [4. 车辆调度记录](#4-车辆调度记录)
  - [4.1 添加调度记录](#41-添加调度记录)
  - [4.2 获取调度记录](#42-获取调度记录)
- [5. 数据模型](#5-数据模型)
- [6. 错误码说明](#6-错误码说明)

---

## 通用说明

### 认证方式

所有接口均需要管理员权限，请求头需携带：

```http
Authorization: Bearer <JWT_TOKEN>
```

### 基础路径

```
Base URL: http://localhost:3000/api/admin
```

### 通用响应格式

**成功响应**：

```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... }
}
```

**失败响应**：

```json
{
  "success": false,
  "message": "错误信息描述"
}
```

---

## 1. 车型模板管理

### 1.1 创建车型模板

**接口**: `POST /api/admin/vehicle-models`
**权限**: 管理员
**描述**: 创建新的车型模板

**请求体**:

```json
{
  "modelName": "大通RV80",
  "brand": "上汽大通",
  "model": "RV80",
  "category": "type_b",
  "seatCount": 4,
  "bedCount": 2,
  "length": "5.99",
  "width": "2.03",
  "height": "2.78",
  "weight": "3500",
  "facilities": ["厨房", "卫浴", "空调", "冰箱", "电视", "太阳能板", "净水系统"],
  "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  "description": "<p>这是一款功能齐全的B型房车...</p>",
  "dailyPrice": 599.0,
  "weeklyPrice": 3990.0,
  "monthlyPrice": 14990.0,
  "deposit": 5000.0
}
```

**字段说明**:

| 字段         | 类型     | 必填 | 说明                              |
| ------------ | -------- | ---- | --------------------------------- |
| modelName    | string   | ✅   | 车型名称                          |
| brand        | string   | ✅   | 品牌                              |
| model        | string   | ✅   | 型号                              |
| category     | enum     | ✅   | 车型分类：type_b, type_c, trailer |
| seatCount    | number   | ✅   | 座位数                            |
| bedCount     | number   | ✅   | 床位数                            |
| length       | string   | ❌   | 车身长度（米）                    |
| width        | string   | ❌   | 车身宽度（米）                    |
| height       | string   | ❌   | 车身高度（米）                    |
| weight       | string   | ❌   | 整备质量（kg）                    |
| facilities   | string[] | ❌   | 设施配置列表                      |
| images       | string[] | ❌   | 车型图片列表                      |
| description  | string   | ❌   | 车型详情（富文本）                |
| dailyPrice   | number   | ✅   | 日租价                            |
| weeklyPrice  | number   | ❌   | 周租价                            |
| monthlyPrice | number   | ❌   | 月租价                            |
| deposit      | number   | ✅   | 押金                              |

**响应示例**:

```json
{
  "success": true,
  "message": "车型模板创建成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "modelName": "大通RV80",
    "brand": "上汽大通",
    "model": "RV80",
    "category": "type_b",
    "seatCount": 4,
    "bedCount": 2,
    "dailyPrice": "599.00",
    "deposit": "5000.00",
    "isActive": true,
    "created_at": "2025-10-25T10:00:00.000Z",
    "updated_at": "2025-10-25T10:00:00.000Z"
  }
}
```

---

### 1.2 更新车型模板

**接口**: `PUT /api/admin/vehicle-models/:id`
**权限**: 管理员
**描述**: 更新车型模板信息

**URL参数**:

- `id`: 车型模板ID

**请求体**:

```json
{
  "modelName": "大通RV80 豪华版",
  "dailyPrice": 699.0,
  "facilities": ["厨房", "卫浴", "空调", "冰箱", "电视", "太阳能板", "净水系统", "驻车空调"]
}
```

**响应示例**:

```json
{
  "success": true,
  "message": "车型模板更新成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "modelName": "大通RV80 豪华版",
    "dailyPrice": "699.00",
    "updated_at": "2025-10-25T11:00:00.000Z"
  }
}
```

---

### 1.3 删除车型模板

**接口**: `DELETE /api/admin/vehicle-models/:id`
**权限**: 管理员
**描述**: 删除车型模板（仅当没有关联车辆时可删除）

**URL参数**:

- `id`: 车型模板ID

**响应示例**:

```json
{
  "success": true,
  "message": "车型模板删除成功"
}
```

**错误示例**:

```json
{
  "success": false,
  "message": "该车型模板下还有关联车辆，无法删除"
}
```

---

### 1.4 获取车型模板详情

**接口**: `GET /api/admin/vehicle-models/:id`
**权限**: 管理员
**描述**: 获取指定车型模板的详细信息

**URL参数**:

- `id`: 车型模板ID

**响应示例**:

```json
{
  "success": true,
  "message": "获取车型模板详情成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "modelName": "大通RV80",
    "brand": "上汽大通",
    "model": "RV80",
    "category": "type_b",
    "seatCount": 4,
    "bedCount": 2,
    "length": "5.99",
    "width": "2.03",
    "height": "2.78",
    "weight": "3500",
    "facilities": ["厨房", "卫浴", "空调", "冰箱", "电视"],
    "images": ["https://example.com/image1.jpg"],
    "description": "<p>这是一款功能齐全的B型房车...</p>",
    "dailyPrice": "599.00",
    "weeklyPrice": "3990.00",
    "monthlyPrice": "14990.00",
    "deposit": "5000.00",
    "isActive": true,
    "created_at": "2025-10-25T10:00:00.000Z",
    "updated_at": "2025-10-25T10:00:00.000Z"
  }
}
```

---

### 1.5 获取车型模板列表

**接口**: `GET /api/admin/vehicle-models`
**权限**: 管理员
**描述**: 获取车型模板列表，支持筛选和分页

**查询参数**:

| 参数     | 类型    | 必填 | 说明                             |
| -------- | ------- | ---- | -------------------------------- |
| page     | number  | ❌   | 页码，默认 1                     |
| pageSize | number  | ❌   | 每页数量，默认 10                |
| category | string  | ❌   | 车型分类筛选                     |
| brand    | string  | ❌   | 品牌筛选                         |
| isActive | boolean | ❌   | 启用状态筛选                     |
| keyword  | string  | ❌   | 关键词搜索（车型名称/品牌/型号） |

**请求示例**:

```
GET /api/admin/vehicle-models?page=1&pageSize=10&category=type_b&isActive=true
```

**响应示例**:

```json
{
  "success": true,
  "message": "获取车型模板列表成功",
  "data": {
    "list": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "modelName": "大通RV80",
        "brand": "上汽大通",
        "model": "RV80",
        "category": "type_b",
        "dailyPrice": "599.00",
        "isActive": true,
        "created_at": "2025-10-25T10:00:00.000Z"
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 10
  }
}
```

---

### 1.6 获取启用的车型模板

**接口**: `GET /api/admin/vehicle-models/active`
**权限**: 管理员
**描述**: 获取所有启用的车型模板（用于下拉选择）

**响应示例**:

```json
{
  "success": true,
  "message": "获取启用车型模板成功",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "modelName": "大通RV80",
      "brand": "上汽大通",
      "model": "RV80"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "modelName": "依维柯C型房车",
      "brand": "依维柯",
      "model": "欧胜"
    }
  ]
}
```

---

### 1.7 切换车型模板状态

**接口**: `PUT /api/admin/vehicle-models/:id/toggle`
**权限**: 管理员
**描述**: 切换车型模板的启用/停用状态

**URL参数**:

- `id`: 车型模板ID

**响应示例**:

```json
{
  "success": true,
  "message": "车型模板停用成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "isActive": false
  }
}
```

---

## 2. 车辆管理

### 2.1 创建车辆

**接口**: `POST /api/admin/vehicles`
**权限**: 管理员
**描述**: 创建新车辆档案

**请求体**:

```json
{
  "licensePlate": "京A12345",
  "vin": "LSYDA28V9K1000001",
  "vehicleModelId": "550e8400-e29b-41d4-a716-446655440001",
  "ownershipType": "platform",
  "storeId": "550e8400-e29b-41d4-a716-446655440010",
  "actualFacilities": ["厨房", "卫浴", "空调", "冰箱", "电视"],
  "images": ["https://example.com/vehicle1.jpg"],
  "year": 2024,
  "mileage": 0,
  "remarks": "新车入库"
}
```

**字段说明**:

| 字段             | 类型     | 必填 | 说明                                                             |
| ---------------- | -------- | ---- | ---------------------------------------------------------------- |
| licensePlate     | string   | ✅   | 车牌号（唯一）                                                   |
| vin              | string   | ✅   | VIN码（唯一）                                                    |
| vehicleModelId   | string   | ✅   | 车型模板ID                                                       |
| ownershipType    | enum     | ❌   | 所有权类型：platform（平台）, crowdfunding（众筹），默认platform |
| storeId          | string   | ❌   | 所属门店ID                                                       |
| actualFacilities | string[] | ❌   | 实际配置列表                                                     |
| images           | string[] | ❌   | 车辆图片列表                                                     |
| year             | number   | ✅   | 车辆年份                                                         |
| mileage          | number   | ❌   | 当前里程数，默认 0                                               |
| remarks          | string   | ❌   | 备注信息                                                         |

**响应示例**:

```json
{
  "success": true,
  "message": "车辆创建成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "licensePlate": "京A12345",
    "vin": "LSYDA28V9K1000001",
    "vehicleModelId": "550e8400-e29b-41d4-a716-446655440001",
    "status": "available",
    "ownershipType": "platform",
    "year": 2024,
    "mileage": 0,
    "created_at": "2025-10-25T10:00:00.000Z"
  }
}
```

---

### 2.2 更新车辆

**接口**: `PUT /api/admin/vehicles/:id`
**权限**: 管理员
**描述**: 更新车辆信息

**URL参数**:

- `id`: 车辆ID

**请求体**:

```json
{
  "mileage": 15000,
  "actualFacilities": ["厨房", "卫浴", "空调", "冰箱", "电视", "驻车空调"],
  "remarks": "已加装驻车空调"
}
```

**响应示例**:

```json
{
  "success": true,
  "message": "车辆更新成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "mileage": 15000,
    "updated_at": "2025-10-25T11:00:00.000Z"
  }
}
```

---

### 2.3 删除车辆

**接口**: `DELETE /api/admin/vehicles/:id`
**权限**: 管理员
**描述**: 删除车辆档案

**URL参数**:

- `id`: 车辆ID

**响应示例**:

```json
{
  "success": true,
  "message": "车辆删除成功"
}
```

---

### 2.4 获取车辆详情

**接口**: `GET /api/admin/vehicles/:id`
**权限**: 管理员
**描述**: 获取车辆详细信息（包含车型模板信息）

**URL参数**:

- `id`: 车辆ID

**响应示例**:

```json
{
  "success": true,
  "message": "获取车辆详情成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "licensePlate": "京A12345",
    "vin": "LSYDA28V9K1000001",
    "vehicleModelId": "550e8400-e29b-41d4-a716-446655440001",
    "vehicleModel": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "modelName": "大通RV80",
      "brand": "上汽大通",
      "category": "type_b",
      "dailyPrice": "599.00"
    },
    "status": "available",
    "ownershipType": "platform",
    "storeId": "550e8400-e29b-41d4-a716-446655440010",
    "actualFacilities": ["厨房", "卫浴", "空调"],
    "year": 2024,
    "mileage": 15000,
    "remarks": "已加装驻车空调",
    "created_at": "2025-10-25T10:00:00.000Z",
    "updated_at": "2025-10-25T11:00:00.000Z"
  }
}
```

---

### 2.5 获取车辆列表

**接口**: `GET /api/admin/vehicles`
**权限**: 管理员
**描述**: 获取车辆列表，支持筛选和分页

**查询参数**:

| 参数           | 类型   | 必填 | 说明                       |
| -------------- | ------ | ---- | -------------------------- |
| page           | number | ❌   | 页码，默认 1               |
| pageSize       | number | ❌   | 每页数量，默认 10          |
| status         | string | ❌   | 车辆状态筛选               |
| ownershipType  | string | ❌   | 所有权类型筛选             |
| vehicleModelId | string | ❌   | 车型模板ID筛选             |
| storeId        | string | ❌   | 门店ID筛选                 |
| keyword        | string | ❌   | 关键词搜索（车牌号/VIN码） |

**请求示例**:

```
GET /api/admin/vehicles?page=1&pageSize=10&status=available
```

**响应示例**:

```json
{
  "success": true,
  "message": "获取车辆列表成功",
  "data": {
    "list": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440020",
        "licensePlate": "京A12345",
        "vin": "LSYDA28V9K1000001",
        "vehicleModel": {
          "modelName": "大通RV80",
          "brand": "上汽大通"
        },
        "status": "available",
        "ownershipType": "platform",
        "year": 2024,
        "mileage": 15000,
        "created_at": "2025-10-25T10:00:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "pageSize": 10
  }
}
```

---

### 2.6 更新车辆状态

**接口**: `PUT /api/admin/vehicles/:id/status`
**权限**: 管理员
**描述**: 更新车辆状态

**URL参数**:

- `id`: 车辆ID

**请求体**:

```json
{
  "status": "maintenance"
}
```

**状态枚举**:

- `available`: 可用
- `rented`: 已租
- `maintenance`: 维护中
- `retired`: 停用

**响应示例**:

```json
{
  "success": true,
  "message": "车辆状态更新成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "status": "maintenance",
    "updated_at": "2025-10-25T12:00:00.000Z"
  }
}
```

---

## 3. 车辆维护记录

### 3.1 添加维护记录

**接口**: `POST /api/admin/vehicles/:id/maintenance`
**权限**: 管理员
**描述**: 为车辆添加维护记录

**URL参数**:

- `id`: 车辆ID

**请求体**:

```json
{
  "maintenanceDate": "2025-10-25T10:00:00.000Z",
  "maintenanceContent": "更换机油、机滤，检查制动系统",
  "maintenanceCost": 580.0,
  "mileage": 15000,
  "fuelLevel": 80,
  "vehicleCondition": "车况良好，无明显故障",
  "maintainedBy": "张师傅",
  "storeId": "550e8400-e29b-41d4-a716-446655440010"
}
```

**字段说明**:

| 字段               | 类型     | 必填 | 说明               |
| ------------------ | -------- | ---- | ------------------ |
| maintenanceDate    | datetime | ✅   | 维护时间           |
| maintenanceContent | string   | ✅   | 维护内容           |
| maintenanceCost    | number   | ✅   | 维护费用           |
| mileage            | number   | ✅   | 维护时里程数       |
| fuelLevel          | number   | ❌   | 油量百分比 (0-100) |
| vehicleCondition   | string   | ❌   | 车况评估           |
| maintainedBy       | string   | ❌   | 维护人员           |
| storeId            | string   | ❌   | 维护门店ID         |

**响应示例**:

```json
{
  "success": true,
  "message": "维护记录添加成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "vehicleId": "550e8400-e29b-41d4-a716-446655440020",
    "maintenanceDate": "2025-10-25T10:00:00.000Z",
    "maintenanceContent": "更换机油、机滤，检查制动系统",
    "maintenanceCost": "580.00",
    "mileage": 15000,
    "created_at": "2025-10-25T10:00:00.000Z"
  }
}
```

---

### 3.2 获取维护记录

**接口**: `GET /api/admin/vehicles/:id/maintenance`
**权限**: 管理员
**描述**: 获取车辆的所有维护记录

**URL参数**:

- `id`: 车辆ID

**响应示例**:

```json
{
  "success": true,
  "message": "获取维护记录成功",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440030",
      "vehicleId": "550e8400-e29b-41d4-a716-446655440020",
      "maintenanceDate": "2025-10-25T10:00:00.000Z",
      "maintenanceContent": "更换机油、机滤，检查制动系统",
      "maintenanceCost": "580.00",
      "mileage": 15000,
      "fuelLevel": 80,
      "vehicleCondition": "车况良好",
      "maintainedBy": "张师傅",
      "created_at": "2025-10-25T10:00:00.000Z"
    }
  ]
}
```

---

## 4. 车辆调度记录

### 4.1 添加调度记录

**接口**: `POST /api/admin/vehicles/:id/transfers`
**权限**: 管理员
**描述**: 为车辆添加调度记录

**URL参数**:

- `id`: 车辆ID

**请求体**:

```json
{
  "transferDate": "2025-10-25T10:00:00.000Z",
  "fromStoreId": "550e8400-e29b-41d4-a716-446655440010",
  "toStoreId": "550e8400-e29b-41d4-a716-446655440011",
  "reason": "支援分店业务需求",
  "cost": 500.0,
  "operatedBy": "550e8400-e29b-41d4-a716-446655440000"
}
```

**字段说明**:

| 字段         | 类型     | 必填 | 说明       |
| ------------ | -------- | ---- | ---------- |
| transferDate | datetime | ✅   | 调度时间   |
| fromStoreId  | string   | ✅   | 调出门店ID |
| toStoreId    | string   | ✅   | 调入门店ID |
| reason       | string   | ❌   | 调度原因   |
| cost         | number   | ❌   | 费用分摊   |
| operatedBy   | string   | ❌   | 操作人员ID |

**响应示例**:

```json
{
  "success": true,
  "message": "调度记录添加成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440040",
    "vehicleId": "550e8400-e29b-41d4-a716-446655440020",
    "transferDate": "2025-10-25T10:00:00.000Z",
    "fromStoreId": "550e8400-e29b-41d4-a716-446655440010",
    "toStoreId": "550e8400-e29b-41d4-a716-446655440011",
    "created_at": "2025-10-25T10:00:00.000Z"
  }
}
```

---

### 4.2 获取调度记录

**接口**: `GET /api/admin/vehicles/:id/transfers`
**权限**: 管理员
**描述**: 获取车辆的所有调度记录

**URL参数**:

- `id`: 车辆ID

**响应示例**:

```json
{
  "success": true,
  "message": "获取调度记录成功",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440040",
      "vehicleId": "550e8400-e29b-41d4-a716-446655440020",
      "transferDate": "2025-10-25T10:00:00.000Z",
      "fromStoreId": "550e8400-e29b-41d4-a716-446655440010",
      "toStoreId": "550e8400-e29b-41d4-a716-446655440011",
      "reason": "支援分店业务需求",
      "cost": "500.00",
      "created_at": "2025-10-25T10:00:00.000Z"
    }
  ]
}
```

---

## 5. 数据模型

### 车型模板 (VehicleModel)

```typescript
interface VehicleModel {
  id: string; // UUID
  modelName: string; // 车型名称
  brand: string; // 品牌
  model: string; // 型号
  category: VehicleCategory; // 车型分类
  seatCount: number; // 座位数
  bedCount: number; // 床位数
  length?: string; // 车身长度
  width?: string; // 车身宽度
  height?: string; // 车身高度
  weight?: string; // 整备质量
  facilities?: string[]; // 设施配置
  images?: string[]; // 车型图片
  description?: string; // 车型详情
  dailyPrice: number; // 日租价
  weeklyPrice?: number; // 周租价
  monthlyPrice?: number; // 月租价
  deposit: number; // 押金
  isActive: boolean; // 是否启用
  created_at: Date; // 创建时间
  updated_at: Date; // 更新时间
}

enum VehicleCategory {
  TYPE_B = 'type_b', // B型房车
  TYPE_C = 'type_c', // C型房车
  TRAILER = 'trailer', // 拖挂式
}
```

### 车辆 (Vehicle)

```typescript
interface Vehicle {
  id: string; // UUID
  licensePlate: string; // 车牌号
  vin: string; // VIN码
  vehicleModelId: string; // 车型模板ID
  ownershipType: OwnershipType; // 所有权类型
  storeId?: string; // 所属门店ID
  status: VehicleStatus; // 车辆状态
  actualFacilities?: string[]; // 实际配置
  images?: string[]; // 车辆图片
  year: number; // 车辆年份
  mileage: number; // 当前里程数
  remarks?: string; // 备注信息
  created_at: Date; // 创建时间
  updated_at: Date; // 更新时间
}

enum VehicleStatus {
  AVAILABLE = 'available', // 可用
  RENTED = 'rented', // 已租
  MAINTENANCE = 'maintenance', // 维护中
  RETIRED = 'retired', // 停用
}

enum OwnershipType {
  PLATFORM = 'platform', // 平台自有
  CROWDFUNDING = 'crowdfunding', // 众筹房车
}
```

### 维护记录 (VehicleMaintenanceRecord)

```typescript
interface VehicleMaintenanceRecord {
  id: string; // UUID
  vehicleId: string; // 车辆ID
  maintenanceDate: Date; // 维护时间
  maintenanceContent: string; // 维护内容
  maintenanceCost: number; // 维护费用
  mileage: number; // 维护时里程数
  fuelLevel?: number; // 油量百分比
  vehicleCondition?: string; // 车况评估
  maintainedBy?: string; // 维护人员
  storeId?: string; // 维护门店ID
  created_at: Date; // 创建时间
}
```

### 调度记录 (VehicleTransfer)

```typescript
interface VehicleTransfer {
  id: string; // UUID
  vehicleId: string; // 车辆ID
  transferDate: Date; // 调度时间
  fromStoreId: string; // 调出门店ID
  toStoreId: string; // 调入门店ID
  reason?: string; // 调度原因
  cost?: number; // 费用分摊
  operatedBy?: string; // 操作人员ID
  created_at: Date; // 创建时间
}
```

---

## 6. 错误码说明

| HTTP状态码 | 错误信息                           | 说明                           |
| ---------- | ---------------------------------- | ------------------------------ |
| 400        | 车型名称、品牌、型号、分类为必填项 | 缺少必填参数                   |
| 400        | 车型分类不合法                     | category 值不在枚举范围内      |
| 400        | 车辆状态不合法                     | status 值不在枚举范围内        |
| 400        | 所有权类型不合法                   | ownershipType 值不在枚举范围内 |
| 400        | 调出门店和调入门店不能相同         | 调度记录参数错误               |
| 401        | 未授权                             | JWT token 无效或过期           |
| 403        | 权限不足                           | 非管理员用户                   |
| 404        | 车型模板不存在                     | 指定ID的车型模板不存在         |
| 404        | 车辆不存在                         | 指定ID的车辆不存在             |
| 500        | 车牌号已存在                       | 车牌号重复                     |
| 500        | VIN码已存在                        | VIN码重复                      |
| 500        | 该车型模板下还有关联车辆，无法删除 | 删除车型模板时存在关联车辆     |
| 500        | 创建/更新/删除失败                 | 数据库操作失败                 |

---

## 使用示例

### 完整工作流示例

#### 1. 创建车型模板

```bash
curl -X POST http://localhost:3000/api/admin/vehicle-models \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modelName": "大通RV80",
    "brand": "上汽大通",
    "model": "RV80",
    "category": "type_b",
    "seatCount": 4,
    "bedCount": 2,
    "dailyPrice": 599.00,
    "deposit": 5000.00
  }'
```

#### 2. 基于车型模板创建车辆

```bash
curl -X POST http://localhost:3000/api/admin/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "licensePlate": "京A12345",
    "vin": "LSYDA28V9K1000001",
    "vehicleModelId": "MODEL_ID",
    "year": 2024
  }'
```

#### 3. 添加维护记录

```bash
curl -X POST http://localhost:3000/api/admin/vehicles/VEHICLE_ID/maintenance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maintenanceDate": "2025-10-25T10:00:00.000Z",
    "maintenanceContent": "首保：更换机油机滤",
    "maintenanceCost": 580.00,
    "mileage": 5000
  }'
```

#### 4. 更新车辆状态

```bash
curl -X PUT http://localhost:3000/api/admin/vehicles/VEHICLE_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "maintenance"
  }'
```

#### 5. 车辆调度

```bash
curl -X POST http://localhost:3000/api/admin/vehicles/VEHICLE_ID/transfers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transferDate": "2025-10-25T10:00:00.000Z",
    "fromStoreId": "STORE_ID_1",
    "toStoreId": "STORE_ID_2",
    "reason": "支援分店业务"
  }'
```

---

## 附录

### 业务规则说明

1. **车型模板与车辆的关系**
   - 车型模板是标准化配置，多个车辆可引用同一车型模板
   - 车辆的实际配置基于车型模板，可根据实际情况调整
   - 删除车型模板前必须确保没有关联的车辆

2. **车辆唯一性约束**
   - 车牌号必须唯一
   - VIN码必须唯一

3. **车辆状态管理**
   - `available`: 可以被租用
   - `rented`: 正在租用中
   - `maintenance`: 维护中，不可租用
   - `retired`: 已停用，不可租用

4. **维护记录关联**
   - 添加维护记录时，如果记录的里程数大于车辆当前里程数，会自动更新车辆里程数

5. **调度记录关联**
   - 添加调度记录时，会自动更新车辆的所属门店为调入门店
   - 原始归属门店不会改变（用于收益分配）

---

**文档维护**: 后端开发团队
**技术支持**: 如有疑问，请联系后端负责人

# 特惠租车 API 文档

## 1. 概述

特惠租车 API 提供限时特惠套餐的管理和预订功能，包括套餐管理、订单管理、库存管理等核心功能。

### 1.1 业务定位

- 特惠租车是**限时促销套餐**，不是普通租赁
- 提供**固定路线+固定租期+套餐价格**的标准化产品
- 通过**批量采购**获得价格优势
- **免费异地还车**降低用户出行成本

### 1.2 核心特点

- **固定路线**：预设路线组合（如"伊宁 → 乌鲁木齐"）
- **固定租期**：限定租期天数（如必须租 5 天）
- **套餐价格**：特惠总价或特惠日租价
- **限时活动**：限定取车时间段
- **免费异地还车**：固定路线免异地还车费
- **限量库存**：活动车辆数量有限

## 2. 数据模型

### 2.1 特惠套餐 (SpecialOffer)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | ✅ | 主键 |
| name | string(100) | ✅ | 套餐名称（如"伊宁-乌鲁木齐 5天"） |
| pickupCity | string(50) | ✅ | 取车城市 |
| returnCity | string(50) | ✅ | 还车城市 |
| fixedDays | int | ✅ | 固定租期（天数） |
| originalPrice | decimal(10,2) | ✅ | 原价 |
| offerPrice | decimal(10,2) | ✅ | 特惠价 |
| vehicleModelIds | json | ✅ | 可选车型ID列表 |
| startDate | date | ✅ | 活动开始日期 |
| endDate | date | ✅ | 活动结束日期 |
| totalStock | int | ✅ | 总库存 |
| remainingStock | int | ✅ | 剩余库存 |
| description | text | ❌ | 套餐描述 |
| highlights | json | ❌ | 亮点列表 |
| includedServices | json | ❌ | 包含服务 |
| excludedServices | json | ❌ | 不含服务 |
| coverImage | string(500) | ❌ | 封面图 |
| images | json | ❌ | 图片列表 |
| status | enum | ✅ | 状态（draft/active/inactive/expired） |
| createdAt | datetime | ✅ | 创建时间 |
| updatedAt | datetime | ✅ | 更新时间 |

### 2.2 特惠订单 (SpecialOfferBooking)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uuid | ✅ | 主键 |
| bookingNo | string(32) | ✅ | 订单号（SOB前缀） |
| offerId | uuid | ✅ | 特惠套餐ID |
| userId | uuid | ✅ | 用户ID |
| vehicleId | uuid | ❌ | 分配的车辆ID |
| pickupDate | datetime | ✅ | 取车时间 |
| returnDate | datetime | ✅ | 还车时间（自动计算） |
| offerPrice | decimal(10,2) | ✅ | 套餐价格（锁定） |
| additionalServices | json | ❌ | 附加服务 |
| totalAmount | decimal(10,2) | ✅ | 订单总金额 |
| status | enum | ✅ | 状态（pending/paid/confirmed/completed/cancelled） |
| paymentId | uuid | ❌ | 支付ID |
| cancelReason | string(500) | ❌ | 取消原因 |
| createdAt | datetime | ✅ | 创建时间 |
| updatedAt | datetime | ✅ | 更新时间 |

## 3. 业务规则

### 3.1 套餐创建规则

- 特惠价必须低于原价
- 活动结束日期必须晚于开始日期
- 固定租期必须在 2-30 天之间
- 总库存必须大于 0
- 新创建的套餐默认为草稿状态

### 3.2 套餐启用规则

- 必须上传封面图
- 剩余库存必须大于 0
- 活动未过期

### 3.3 订单创建规则

- 套餐必须为启用状态
- 活动未过期
- 剩余库存大于 0
- 取车日期必须在活动期限内
- 还车日期自动计算为：取车日期 + 固定租期
- 所选车型必须在套餐可选范围内
- 创建订单时扣减库存
- 订单取消时恢复库存

### 3.4 状态流转规则

**套餐状态**：
- draft（草稿）→ active（启用）→ inactive（禁用）
- 活动结束日期过期后自动变为 expired

**订单状态**：
- pending（待支付）→ paid（已支付）→ confirmed（已确认）→ completed（已完成）
- pending → cancelled（已取消）

## 4. API 端点

### 4.1 用户端 API

#### 4.1.1 获取特惠套餐列表

**接口**: `GET /api/special-offers`

**查询参数**:
- `page`: 页码（默认 1）
- `pageSize`: 每页数量（默认 10）
- `pickupCity`: 取车城市
- `returnCity`: 还车城市
- `keyword`: 关键词搜索
- `sortBy`: 排序字段（createdAt/offerPrice/startDate）
- `sortOrder`: 排序方向（ASC/DESC）

**响应示例**:
```json
{
  "code": 200,
  "message": "获取特惠套餐列表成功",
  "data": {
    "offers": [
      {
        "id": "uuid",
        "name": "伊宁-乌鲁木齐 5天",
        "pickupCity": "伊宁",
        "returnCity": "乌鲁木齐",
        "fixedDays": 5,
        "originalPrice": 4499.00,
        "offerPrice": 1799.00,
        "startDate": "2025-09-15",
        "endDate": "2025-09-21",
        "remainingStock": 10,
        "coverImage": "https://...",
        "status": "active"
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 10
  }
}
```

#### 4.1.2 获取特惠套餐详情

**接口**: `GET /api/special-offers/:id`

**响应示例**:
```json
{
  "code": 200,
  "message": "获取特惠套餐详情成功",
  "data": {
    "id": "uuid",
    "name": "伊宁-乌鲁木齐 5天",
    "pickupCity": "伊宁",
    "returnCity": "乌鲁木齐",
    "fixedDays": 5,
    "originalPrice": 4499.00,
    "offerPrice": 1799.00,
    "vehicleModelIds": ["uuid1", "uuid2"],
    "startDate": "2025-09-15",
    "endDate": "2025-09-21",
    "totalStock": 20,
    "remainingStock": 10,
    "description": "新疆天山环线特惠套餐",
    "highlights": ["免费异地还车", "含基础保险", "24小时道路救援"],
    "includedServices": ["基础保险", "道路救援"],
    "excludedServices": ["油费", "过路费"],
    "coverImage": "https://...",
    "images": ["https://...", "https://..."],
    "status": "active"
  }
}
```

#### 4.1.3 创建特惠订单

**接口**: `POST /api/special-offers/bookings`

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "offerId": "uuid",
  "pickupDate": "2025-09-16T10:00:00",
  "vehicleModelId": "uuid",
  "additionalServices": [
    {
      "serviceId": "uuid",
      "serviceName": "儿童座椅",
      "price": 30.00,
      "quantity": 5
    }
  ]
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "创建特惠订单成功",
  "data": {
    "id": "uuid",
    "bookingNo": "SOB20251028123456",
    "offerId": "uuid",
    "userId": "uuid",
    "pickupDate": "2025-09-16T10:00:00",
    "returnDate": "2025-09-21T10:00:00",
    "offerPrice": 1799.00,
    "additionalServices": [...],
    "totalAmount": 1949.00,
    "status": "paid"
  }
}
```

#### 4.1.4 获取我的特惠订单列表

**接口**: `GET /api/special-offers/bookings`

**请求头**: `Authorization: Bearer <token>`

**查询参数**:
- `page`: 页码
- `pageSize`: 每页数量
- `status`: 订单状态

**响应示例**:
```json
{
  "code": 200,
  "message": "获取订单列表成功",
  "data": {
    "bookings": [...],
    "total": 5,
    "page": 1,
    "pageSize": 10
  }
}
```

#### 4.1.5 获取特惠订单详情

**接口**: `GET /api/special-offers/bookings/:id`

**请求头**: `Authorization: Bearer <token>`

#### 4.1.6 取消特惠订单

**接口**: `POST /api/special-offers/bookings/:id/cancel`

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "cancelReason": "行程变更"
}
```

### 4.2 管理端 API

#### 4.2.1 创建特惠套餐

**接口**: `POST /api/admin/special-offers`

**请求头**: `Authorization: Bearer <admin_token>`

**请求体**:
```json
{
  "name": "伊宁-乌鲁木齐 5天",
  "pickupCity": "伊宁",
  "returnCity": "乌鲁木齐",
  "fixedDays": 5,
  "originalPrice": 4499.00,
  "offerPrice": 1799.00,
  "vehicleModelIds": ["uuid1", "uuid2"],
  "startDate": "2025-09-15",
  "endDate": "2025-09-21",
  "totalStock": 20,
  "description": "新疆天山环线特惠套餐",
  "highlights": ["免费异地还车", "含基础保险"],
  "includedServices": ["基础保险", "道路救援"],
  "excludedServices": ["油费", "过路费"],
  "coverImage": "https://...",
  "images": ["https://..."]
}
```

#### 4.2.2 更新特惠套餐

**接口**: `PUT /api/admin/special-offers/:id`

**请求头**: `Authorization: Bearer <admin_token>`

#### 4.2.3 获取特惠套餐列表（管理端）

**接口**: `GET /api/admin/special-offers`

**请求头**: `Authorization: Bearer <admin_token>`

**查询参数**: 同用户端，但可查看所有状态的套餐

#### 4.2.4 切换套餐状态

**接口**: `PUT /api/admin/special-offers/:id/status`

**请求头**: `Authorization: Bearer <admin_token>`

**请求体**:
```json
{
  "status": "active"
}
```

#### 4.2.5 删除特惠套餐

**接口**: `DELETE /api/admin/special-offers/:id`

**请求头**: `Authorization: Bearer <admin_token>`

#### 4.2.6 获取特惠订单列表（管理端）

**接口**: `GET /api/admin/special-offers/bookings`

**请求头**: `Authorization: Bearer <admin_token>`

**查询参数**:
- `page`: 页码
- `pageSize`: 每页数量
- `userId`: 用户ID
- `offerId`: 套餐ID
- `status`: 订单状态

#### 4.2.7 分配车辆

**接口**: `PUT /api/admin/special-offers/bookings/:id/assign-vehicle`

**请求头**: `Authorization: Bearer <admin_token>`

**请求体**:
```json
{
  "vehicleId": "uuid"
}
```

#### 4.2.8 完成订单

**接口**: `PUT /api/admin/special-offers/bookings/:id/complete`

**请求头**: `Authorization: Bearer <admin_token>`

## 5. 错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

## 6. 更新历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2025-10-28 | 初始版本，完成特惠租车 API 开发 |


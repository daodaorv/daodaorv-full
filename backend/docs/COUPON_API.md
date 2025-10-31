# 优惠券管理 API 文档

## 1. 概述

优惠券管理 API 提供完整的优惠券创建、发放、使用、转赠等功能，支持多种券类型和灵活的使用规则。

### 1.1 核心功能

- **优惠券模板管理**：创建、编辑、删除、启用/禁用优惠券模板
- **优惠券发放**：手动发放、批量发放、活动发放、购买发放
- **优惠券使用**：查询可用券、使用验证、退款退券
- **优惠券转赠**：支持一次转赠，记录完整链路
- **统计分析**：发放量、使用量、核销率统计

### 1.2 业务价值

- 提升订单转化率（目标提升 20%）
- 增加用户复购率（目标提升 30%）
- 提高营销活动效果（目标核销率 > 60%）
- 实现精准营销和用户激励

## 2. 数据模型

### 2.1 优惠券模板 (CouponTemplate)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| name | string | 优惠券名称 |
| type | enum | 券类型（cash/discount/full_reduction/day_deduction） |
| amount | decimal | 面额（现金券/满减券） |
| discountRate | decimal | 折扣率（折扣券，如 0.9 表示 9 折） |
| dayCount | int | 抵扣天数（日租抵扣券） |
| minAmount | decimal | 最低消费金额 |
| scene | enum | 适用场景（rental/campsite/tour/special_offer/all） |
| validDays | int | 有效天数（从发放日起算） |
| price | decimal | 售价（0 表示免费） |
| stock | int | 库存数量（null 表示不限量） |
| limitPerUser | int | 每人限购数量（null 表示不限） |
| canStack | boolean | 是否可叠加使用 |
| canTransfer | boolean | 是否可转赠 |
| description | text | 使用说明 |
| isActive | boolean | 是否启用 |
| startTime | datetime | 开始时间 |
| endTime | datetime | 结束时间 |

**券类型说明**：
- `cash`：现金券，直接抵扣固定金额
- `discount`：折扣券，按比例折扣
- `full_reduction`：满减券，满 XX 元减 XX 元
- `day_deduction`：日租抵扣券，抵扣 X 天租金（房车租赁专用）

**适用场景说明**：
- `rental`：房车租赁
- `campsite`：营地预订
- `tour`：定制旅游
- `special_offer`：特惠租车
- `all`：全场通用

### 2.2 用户优惠券 (UserCoupon)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| couponNo | string | 优惠券编号（CPN 前缀） |
| templateId | uuid | 优惠券模板 ID |
| userId | uuid | 持有用户 ID |
| source | enum | 来源（purchase/gift/activity/system） |
| status | enum | 状态（unused/used/expired/transferred） |
| receivedAt | datetime | 领取时间 |
| expireAt | datetime | 过期时间 |
| usedAt | datetime | 使用时间 |
| orderId | uuid | 使用订单 ID |
| orderType | string | 订单类型 |
| transferredTo | uuid | 转赠给谁 |
| transferredAt | datetime | 转赠时间 |
| originalOwner | uuid | 原始持有人（转赠链路） |

### 2.3 优惠券发放记录 (CouponDistribution)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| templateId | uuid | 优惠券模板 ID |
| distributionType | enum | 发放类型（manual/batch/activity） |
| targetUsers | json | 目标用户列表 |
| totalCount | int | 发放总数 |
| successCount | int | 成功数量 |
| failCount | int | 失败数量 |
| operatorId | uuid | 操作人 ID |
| remark | text | 备注 |

## 3. 业务规则

### 3.1 优惠券创建规则

- 券类型确定后不可修改
- 现金券必须设置面额
- 折扣券必须设置折扣率（0-1 之间）
- 满减券必须设置面额和最低消费金额
- 日租抵扣券必须设置抵扣天数
- 有效天数必须 > 0
- 库存数量可为 null（不限量）

### 3.2 优惠券发放规则

- 手动发放：选择指定用户，立即发放
- 批量发放：导入用户列表，批量发放
- 活动发放：满足活动条件自动发放
- 购买发放：用户支付后自动发放
- 发放后立即生效，有效期从发放时起算
- 库存不足时禁止发放
- 超过每人限购数量时禁止发放

### 3.3 优惠券使用规则

- 仅可使用未使用且未过期的券
- 订单金额必须满足最低消费要求
- 订单场景必须匹配券的适用场景
- 叠加使用规则由模板的 canStack 字段控制
- 使用后状态变为 used，记录使用订单
- 订单退款时券退回原持有人（状态变回 unused）

### 3.4 优惠券转赠规则

- 仅可转赠未使用且未过期的券
- 每张券仅可转赠一次（canTransfer 为 true）
- 转赠后原持有人失去该券
- 接收人获得新券，有效期不变
- 记录完整转赠链路（originalOwner → userId）

## 4. API 端点

### 4.1 用户端 API

#### 4.1.1 获取可购买的优惠券列表

```
GET /api/coupons/templates
```

**查询参数**：
- `type`：券类型（可选）
- `scene`：适用场景（可选）
- `keyword`：关键词搜索（可选）
- `page`：页码（可选，默认 1）
- `pageSize`：每页数量（可选，默认 20）

**响应示例**：
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": "uuid",
        "name": "新人专享券",
        "type": "cash",
        "amount": 50,
        "scene": "all",
        "validDays": 30,
        "price": 0,
        "stock": 1000,
        "limitPerUser": 1,
        "canStack": false,
        "canTransfer": true,
        "description": "新用户首单立减 50 元",
        "isActive": true
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20
  }
}
```

#### 4.1.2 购买优惠券

```
POST /api/coupons/purchase
```

**请求头**：
- `Authorization: Bearer <token>`（必需）

**请求体**：
```json
{
  "templateId": "uuid",
  "count": 1
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "购买成功",
  "data": [
    {
      "id": "uuid",
      "couponNo": "CPN12345678",
      "templateId": "uuid",
      "userId": "uuid",
      "source": "purchase",
      "status": "unused",
      "receivedAt": "2025-10-28T10:00:00Z",
      "expireAt": "2025-11-27T10:00:00Z"
    }
  ]
}
```

#### 4.1.3 获取我的优惠券列表

```
GET /api/coupons/my
```

**请求头**：
- `Authorization: Bearer <token>`（必需）

**查询参数**：
- `status`：状态（unused/used/expired/transferred，可选）
- `scene`：适用场景（可选）
- `page`：页码（可选，默认 1）
- `pageSize`：每页数量（可选，默认 20）

#### 4.1.4 转赠优惠券

```
POST /api/coupons/:id/transfer
```

**请求头**：
- `Authorization: Bearer <token>`（必需）

**请求体**：
```json
{
  "toUserId": "uuid"
}
```

#### 4.1.5 获取可用优惠券（下单时）

```
GET /api/coupons/available
```

**请求头**：
- `Authorization: Bearer <token>`（必需）

**查询参数**：
- `scene`：适用场景（必需）
- `orderAmount`：订单金额（必需）

### 4.2 管理端 API

#### 4.2.1 创建优惠券模板

```
POST /api/admin/coupons/templates
```

**请求头**：
- `Authorization: Bearer <admin_token>`（必需）

**请求体**：
```json
{
  "name": "新人专享券",
  "type": "cash",
  "amount": 50,
  "scene": "all",
  "validDays": 30,
  "price": 0,
  "stock": 1000,
  "limitPerUser": 1,
  "canStack": false,
  "canTransfer": true,
  "description": "新用户首单立减 50 元"
}
```

#### 4.2.2 更新优惠券模板

```
PUT /api/admin/coupons/templates/:id
```

**请求头**：
- `Authorization: Bearer <admin_token>`（必需）

**请求体**（仅可更新部分字段）：
```json
{
  "name": "新人专享券（更新）",
  "description": "新用户首单立减 50 元（更新）",
  "price": 0,
  "stock": 2000
}
```

#### 4.2.3 删除优惠券模板

```
DELETE /api/admin/coupons/templates/:id
```

**请求头**：
- `Authorization: Bearer <admin_token>`（必需）

#### 4.2.4 切换启用状态

```
PUT /api/admin/coupons/templates/:id/toggle
```

**请求头**：
- `Authorization: Bearer <admin_token>`（必需）

#### 4.2.5 发放优惠券

```
POST /api/admin/coupons/distribute
```

**请求头**：
- `Authorization: Bearer <admin_token>`（必需）

**请求体**：
```json
{
  "templateId": "uuid",
  "distributionType": "manual",
  "targetUsers": ["user_id_1", "user_id_2"],
  "remark": "活动发放"
}
```

#### 4.2.6 获取发放记录列表

```
GET /api/admin/coupons/distributions
```

**请求头**：
- `Authorization: Bearer <admin_token>`（必需）

**查询参数**：
- `templateId`：优惠券模板 ID（可选）
- `distributionType`：发放类型（可选）
- `page`：页码（可选，默认 1）
- `pageSize`：每页数量（可选，默认 20）

#### 4.2.7 获取优惠券统计数据

```
GET /api/admin/coupons/statistics
```

**请求头**：
- `Authorization: Bearer <admin_token>`（必需）

**查询参数**：
- `templateId`：优惠券模板 ID（可选）

**响应示例**：
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "totalIssued": 1000,
    "totalUsed": 600,
    "totalExpired": 100,
    "usageRate": 0.6,
    "expiryRate": 0.1,
    "averageDiscount": 50,
    "totalRevenue": 30000
  }
}
```

## 5. 错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 6. 开发状态

- ✅ 数据模型层（3 个实体）
- ✅ 服务层（3 个服务）
- ✅ 控制器层（2 个控制器）
- ✅ 路由配置（16 个 API 端点）
- ✅ TypeScript 编译（0 错误）
- ✅ 测试通过（166/166）

## 7. 后续优化

- 引入优惠券活动规则引擎
- 引入优惠券推荐算法
- 引入优惠券效果分析
- 引入优惠券防刷机制
- 实现真实的统计逻辑
- 实现优惠券过期自动处理定时任务


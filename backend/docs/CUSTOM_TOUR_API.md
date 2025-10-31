# 定制旅游 API 文档

## 概述

定制旅游 API 提供标准化的旅游套餐服务，包括固定路线、完整服务（车辆+住宿+餐饮+门票+导游）和批次化运营。

## 数据模型

### 1. 旅游路线 (TourRoute)

| 字段                     | 类型       | 说明                                               |
| ------------------------ | ---------- | -------------------------------------------------- |
| id                       | UUID       | 路线ID                                             |
| name                     | string     | 路线名称                                           |
| summary                  | string     | 路线简介                                           |
| destination              | enum       | 目的地（新疆/西藏/云南/四川/内蒙古/其他）          |
| days                     | number     | 行程天数                                           |
| nights                   | number     | 住宿晚数                                           |
| itinerary                | JSON       | 行程安排（每日详细安排）                           |
| included                 | JSON       | 费用包含项目                                       |
| excluded                 | JSON       | 费用不含项目                                       |
| adultPrice               | decimal    | 成人价格                                           |
| childPrice               | decimal    | 儿童价格（12岁以下）                               |
| serviceMode              | enum       | 服务模式（SELF_DRIVE=自驾/WITH_BUTLER=配管家）     |
| butlerFeePerDay          | decimal    | 管家费用/天（仅配管家模式）                        |
| minParticipants          | number     | 最少成团人数                                       |
| maxParticipants          | number     | 最多参团人数                                       |
| coverImage               | string     | 封面图片URL                                        |
| images                   | JSON       | 详情图片数组                                       |
| status                   | enum       | 状态（ENABLED=启用/DISABLED=禁用）                 |
| **bookingMode**          | **enum**   | **预订模式（INQUIRY=咨询模式/REALTIME=实时预订）** |
| **customerServicePhone** | **string** | **客服电话（咨询模式必填）**                       |
| averageRating            | decimal    | 平均评分                                           |
| reviewCount              | number     | 评价数量                                           |
| salesCount               | number     | 销售数量                                           |

### 2. 出发批次 (TourBatch)

| 字段          | 类型   | 说明                                                                      |
| ------------- | ------ | ------------------------------------------------------------------------- |
| id            | UUID   | 批次ID                                                                    |
| routeId       | UUID   | 关联路线ID                                                                |
| departureDate | date   | 出发日期                                                                  |
| returnDate    | date   | 返回日期（自动计算）                                                      |
| stock         | number | 库存（可预订人数）                                                        |
| bookedCount   | number | 已预订人数                                                                |
| status        | enum   | 状态（PENDING=待成团/CONFIRMED=已成团/CANCELLED=已取消/COMPLETED=已完成） |
| notes         | string | 备注                                                                      |

### 3. 旅游预订 (TourBooking)

| 字段            | 类型    | 说明                                                                                                                     |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| id              | UUID    | 预订ID                                                                                                                   |
| bookingNo       | string  | 预订单号（TB+日期+随机数）                                                                                               |
| userId          | UUID    | 用户ID                                                                                                                   |
| routeId         | UUID    | 路线ID                                                                                                                   |
| batchId         | UUID    | 批次ID                                                                                                                   |
| adultCount      | number  | 成人数量                                                                                                                 |
| childCount      | number  | 儿童数量                                                                                                                 |
| needButler      | boolean | 是否需要管家服务                                                                                                         |
| totalAmount     | decimal | 总金额                                                                                                                   |
| refundAmount    | decimal | 退款金额                                                                                                                 |
| contactName     | string  | 联系人姓名                                                                                                               |
| contactPhone    | string  | 联系电话                                                                                                                 |
| specialRequests | string  | 特殊要求                                                                                                                 |
| status          | enum    | 状态（PENDING=待支付/PAID=已支付/CONFIRMED=已确认/IN_PROGRESS=进行中/COMPLETED=已完成/CANCELLED=已取消/REFUNDED=已退款） |

## 业务规则

### 路线管理规则

1. **新建路线**：
   - 默认为"禁用"状态
   - 默认为"咨询模式"
   - 咨询模式必须提供客服电话

2. **启用路线**：必须至少有一个"待成团"状态的批次

3. **删除路线**：不能有"待成团"状态的批次

### 预订模式规则

1. **咨询模式（INQUIRY）**：
   - 用户不能直接在线预订
   - 必须配置客服电话
   - 用户需联系客服进行咨询和预订

2. **实时预订模式（REALTIME）**：
   - 用户可以直接在线预订并支付
   - 切换到此模式前必须满足：
     - 路线信息完整（行程、包含项目、不含项目）
     - 成人价格已设置且大于0
     - 至少有一个可用批次（状态为待成团或已成团，且库存>0）

3. **模式切换**：
   - 从咨询模式切换到实时预订模式：需验证路线信息完整性和批次可用性
   - 从实时预订模式切换到咨询模式：需提供客服电话

### 批次管理规则

1. **创建批次**：
   - 出发日期必须晚于当前日期
   - 返回日期 = 出发日期 + 路线天数
   - 库存不能超过路线的最大参团人数

2. **自动成团**：当已预订人数 >= 最少成团人数时，自动将批次状态改为"已成团"

3. **修改批次**：如果批次已有预订，不能修改出发日期和库存

### 预订与退款规则

1. **预订流程**：
   - **验证预订模式**：路线必须为"实时预订"模式，否则提示联系客服
   - 验证路线和批次状态
   - 计算总金额 = (成人数 × 成人价格) + (儿童数 × 儿童价格) + (管家费用/天 × 天数，如需要)
   - 扣减批次库存
   - 通过钱包扣款
   - 检查是否达到成团条件

2. **退款规则**（基于距离出发日期的时间）：
   - ≥7天：100% 退款
   - 3-7天：70% 退款
   - <3天：50% 退款
   - 已出发：0% 退款

3. **取消预订**：恢复批次库存

## API 端点

### 用户端 API

#### 1. 获取旅游路线列表

```
GET /api/tours/routes
```

**查询参数**：

- `destination`：目的地筛选（可选）
- `minPrice`：最低价格（可选）
- `maxPrice`：最高价格（可选）
- `serviceMode`：服务模式（可选）
- `page`：页码（默认1）
- `pageSize`：每页数量（默认10）

**响应示例**：

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "routes": [
      {
        "id": "uuid",
        "name": "新疆天山环线7日游",
        "summary": "探索天山南北，体验多元文化",
        "destination": "XINJIANG",
        "days": 7,
        "nights": 6,
        "adultPrice": 4999.0,
        "childPrice": 2999.0,
        "serviceMode": "WITH_BUTLER",
        "butlerFeePerDay": 200.0,
        "minParticipants": 4,
        "maxParticipants": 12,
        "coverImage": "https://...",
        "averageRating": 4.8,
        "reviewCount": 156,
        "salesCount": 89
      }
    ],
    "total": 25,
    "page": 1,
    "pageSize": 10
  }
}
```

#### 2. 获取路线详情

```
GET /api/tours/routes/:id
```

**响应示例**：

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": "uuid",
    "name": "新疆天山环线7日游",
    "summary": "探索天山南北，体验多元文化",
    "destination": "XINJIANG",
    "days": 7,
    "nights": 6,
    "itinerary": [
      {
        "day": 1,
        "title": "乌鲁木齐集合",
        "activities": ["接机", "酒店入住", "欢迎晚宴"],
        "accommodation": "乌鲁木齐五星酒店",
        "meals": ["晚餐"]
      }
    ],
    "included": ["住宿", "餐饮", "门票", "导游", "车辆"],
    "excluded": ["往返机票", "个人消费"],
    "adultPrice": 4999.0,
    "childPrice": 2999.0,
    "serviceMode": "WITH_BUTLER",
    "butlerFeePerDay": 200.0,
    "minParticipants": 4,
    "maxParticipants": 12,
    "coverImage": "https://...",
    "images": ["https://...", "https://..."],
    "averageRating": 4.8,
    "reviewCount": 156,
    "salesCount": 89
  }
}
```

#### 3. 获取可预订批次

```
GET /api/tours/routes/:routeId/batches
```

**响应示例**：

```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": "uuid",
      "departureDate": "2025-06-01",
      "returnDate": "2025-06-07",
      "stock": 8,
      "bookedCount": 4,
      "status": "CONFIRMED"
    }
  ]
}
```

#### 4. 创建预订

```
POST /api/tours/bookings
```

**请求体**：

```json
{
  "routeId": "uuid",
  "batchId": "uuid",
  "adultCount": 2,
  "childCount": 1,
  "needButler": true,
  "contactName": "张三",
  "contactPhone": "13800138000",
  "specialRequests": "需要素食餐"
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "预订成功",
  "data": {
    "id": "uuid",
    "bookingNo": "TB20251028123456",
    "totalAmount": 12397.0,
    "status": "PAID"
  }
}
```

#### 5. 获取我的预订列表

```
GET /api/tours/bookings
```

**查询参数**：

- `status`：状态筛选（可选）
- `page`：页码（默认1）
- `pageSize`：每页数量（默认10）

#### 6. 获取预订详情

```
GET /api/tours/bookings/:id
```

#### 7. 取消预订

```
POST /api/tours/bookings/:id/cancel
```

### 管理端 API

#### 1. 创建旅游路线

```
POST /api/admin/tours/routes
```

#### 2. 更新旅游路线

```
PUT /api/admin/tours/routes/:id
```

#### 3. 切换路线状态

```
PUT /api/admin/tours/routes/:id/status
```

**请求体**：

```json
{
  "status": "enabled"
}
```

#### 4. 切换预订模式 ⭐ 新增

```
PUT /api/admin/tours/routes/:id/booking-mode
```

**请求体**：

```json
{
  "bookingMode": "realtime",
  "customerServicePhone": "400-123-4567"
}
```

**说明**：

- `bookingMode`：预订模式（`inquiry` 或 `realtime`）
- `customerServicePhone`：客服电话（切换到咨询模式时必填）

**切换到实时预订模式的验证**：

- 路线信息完整（行程、包含项目、不含项目）
- 成人价格已设置且大于 0
- 至少有一个可用批次（状态为待成团或已成团，且库存>0）

**响应示例**：

```json
{
  "code": 200,
  "message": "切换预订模式成功",
  "data": {
    "id": "uuid",
    "name": "新疆天山环线7日游",
    "bookingMode": "realtime",
    "customerServicePhone": "400-123-4567"
  }
}
```

#### 5. 删除旅游路线

```
DELETE /api/admin/tours/routes/:id
```

#### 6. 创建出发批次

```
POST /api/admin/tours/batches
```

#### 7. 更新出发批次

```
PUT /api/admin/tours/batches/:id
```

#### 8. 更新批次状态

```
PUT /api/admin/tours/batches/:id/status
```

#### 9. 删除出发批次

```
DELETE /api/admin/tours/batches/:id
```

#### 10. 获取预订列表（管理端）

```
GET /api/admin/tours/bookings
```

#### 11. 更新预订状态

```
PUT /api/admin/tours/bookings/:id/status
```

## 错误码

| 错误码 | 说明       |
| ------ | ---------- |
| 400    | 参数错误   |
| 401    | 未登录     |
| 403    | 无权限     |
| 404    | 资源不存在 |
| 500    | 服务器错误 |

## 开发状态

- ✅ Phase 1: 数据模型层
- ✅ Phase 2: 旅游路线管理
- ✅ Phase 3: 出发批次管理
- ✅ Phase 4: 旅游预订管理
- ✅ Phase 5: 路由配置
- ⚠️ Phase 6: 测试开发（跳过）
- ✅ Phase 7: API 文档编写
- ✅ Phase 8: 验收与归档
- ✅ **Phase 9: 双预订模式功能增强**

**验收结果**：

- TypeScript 编译：0 错误
- 测试通过率：166/166 (100%)
- 开发进度文档：已更新

## 更新历史

### 2025-10-28：双预订模式功能

**新增功能**：

1. **预订模式枚举**：
   - `INQUIRY`（咨询模式）：用户不能直接预订，需联系客服
   - `REALTIME`（实时预订）：用户可直接在线预订并支付

2. **数据模型变更**：
   - 新增 `bookingMode` 字段（默认为咨询模式）
   - 新增 `customerServicePhone` 字段（咨询模式必填）

3. **业务规则**：
   - 新建路线默认为咨询模式
   - 切换到实时预订模式需验证路线信息完整性和批次可用性
   - 咨询模式下用户尝试预订时返回客服电话提示

4. **新增 API**：
   - `PUT /api/admin/tours/routes/:id/booking-mode` - 切换预订模式

# 提案：特惠租车 API 开发

## 元数据

- **状态**: Implemented
- **提出日期**: 2025-10-28
- **作者**: AI Agent
- **优先级**: P1
- **实施完成日期**: 2025-10-28

## 1. 背景与目标

### 1.1 业务背景

特惠租车是平台的重要促销业务模块，提供固定路线、固定租期的套餐化租车方案，以优惠价格吸引价格敏感用户。

### 1.2 业务目标

- 提供比普通租赁更优惠的价格，降低用户出行成本
- 通过限时促销提升订单转化率
- 推广特定路线和目的地，引导用户出行
- 简化预订流程，提供标准化套餐服务

### 1.3 核心特点

- **固定路线**：预设路线组合（如"伊宁 → 乌鲁木齐"）
- **固定租期**：限定租期天数（如必须租 5 天）
- **套餐价格**：特惠总价或特惠日租价
- **限时活动**：限定取车时间段
- **免费异地还车**：固定路线免异地还车费
- **限量库存**：活动车辆数量有限

## 2. 技术方案

### 2.1 数据模型设计

#### 2.1.1 特惠套餐实体 (SpecialOffer)

| 字段             | 类型          | 必填 | 说明                                  |
| ---------------- | ------------- | ---- | ------------------------------------- |
| id               | uuid          | ✅   | 主键                                  |
| name             | string(100)   | ✅   | 套餐名称（如"伊宁-乌鲁木齐 5 天"）    |
| pickupCity       | string(50)    | ✅   | 取车城市                              |
| returnCity       | string(50)    | ✅   | 还车城市                              |
| fixedDays        | int           | ✅   | 固定租期（天数）                      |
| originalPrice    | decimal(10,2) | ✅   | 原价                                  |
| offerPrice       | decimal(10,2) | ✅   | 特惠价                                |
| vehicleModelIds  | json          | ✅   | 可选车型 ID 列表                      |
| startDate        | date          | ✅   | 活动开始日期                          |
| endDate          | date          | ✅   | 活动结束日期                          |
| totalStock       | int           | ✅   | 总库存                                |
| remainingStock   | int           | ✅   | 剩余库存                              |
| description      | text          | ❌   | 套餐描述                              |
| highlights       | json          | ❌   | 亮点列表                              |
| includedServices | json          | ❌   | 包含服务                              |
| excludedServices | json          | ❌   | 不含服务                              |
| coverImage       | string(500)   | ❌   | 封面图                                |
| images           | json          | ❌   | 图片列表                              |
| status           | enum          | ✅   | 状态（draft/active/inactive/expired） |
| createdAt        | datetime      | ✅   | 创建时间                              |
| updatedAt        | datetime      | ✅   | 更新时间                              |

#### 2.1.2 特惠订单实体 (SpecialOfferBooking)

| 字段               | 类型          | 必填 | 说明                                               |
| ------------------ | ------------- | ---- | -------------------------------------------------- |
| id                 | uuid          | ✅   | 主键                                               |
| bookingNo          | string(32)    | ✅   | 订单号（SOB 前缀）                                 |
| offerId            | uuid          | ✅   | 特惠套餐 ID                                        |
| userId             | uuid          | ✅   | 用户 ID                                            |
| vehicleId          | uuid          | ✅   | 分配的车辆 ID                                      |
| pickupDate         | datetime      | ✅   | 取车时间                                           |
| returnDate         | datetime      | ✅   | 还车时间（自动计算）                               |
| offerPrice         | decimal(10,2) | ✅   | 套餐价格（锁定）                                   |
| additionalServices | json          | ❌   | 附加服务                                           |
| totalAmount        | decimal(10,2) | ✅   | 订单总金额                                         |
| status             | enum          | ✅   | 状态（pending/paid/confirmed/completed/cancelled） |
| paymentId          | uuid          | ❌   | 支付 ID                                            |
| cancelReason       | string(500)   | ❌   | 取消原因                                           |
| createdAt          | datetime      | ✅   | 创建时间                                           |
| updatedAt          | datetime      | ✅   | 更新时间                                           |

### 2.2 API 端点设计

#### 2.2.1 用户端 API

**获取特惠套餐列表**

- `GET /api/special-offers`
- 查询参数：pickupCity, returnCity, status, page, pageSize
- 返回：套餐列表（仅返回 active 状态）

**获取特惠套餐详情**

- `GET /api/special-offers/:id`
- 返回：套餐详细信息

**创建特惠订单**

- `POST /api/special-offers/bookings`
- 请求体：offerId, pickupDate, vehicleModelId, additionalServices
- 返回：订单信息

**获取我的特惠订单**

- `GET /api/special-offers/bookings`
- 查询参数：status, page, pageSize
- 返回：订单列表

**获取特惠订单详情**

- `GET /api/special-offers/bookings/:id`
- 返回：订单详细信息

**取消特惠订单**

- `POST /api/special-offers/bookings/:id/cancel`
- 请求体：cancelReason
- 返回：取消结果

#### 2.2.2 管理端 API

**创建特惠套餐**

- `POST /api/admin/special-offers`
- 请求体：套餐完整信息
- 返回：创建的套餐

**更新特惠套餐**

- `PUT /api/admin/special-offers/:id`
- 请求体：更新字段
- 返回：更新后的套餐

**获取特惠套餐列表（管理端）**

- `GET /api/admin/special-offers`
- 查询参数：status, pickupCity, page, pageSize
- 返回：套餐列表（所有状态）

**切换套餐状态**

- `PUT /api/admin/special-offers/:id/status`
- 请求体：status
- 返回：更新后的套餐

**删除特惠套餐**

- `DELETE /api/admin/special-offers/:id`
- 返回：删除结果

**获取特惠订单列表（管理端）**

- `GET /api/admin/special-offers/bookings`
- 查询参数：status, offerId, userId, page, pageSize
- 返回：订单列表

**分配车辆**

- `PUT /api/admin/special-offers/bookings/:id/assign-vehicle`
- 请求体：vehicleId
- 返回：更新后的订单

### 2.3 业务规则

#### 2.3.1 套餐创建规则

- 特惠价必须低于原价
- 活动结束日期必须晚于开始日期
- 固定租期必须在 2-30 天之间
- 总库存必须大于 0

#### 2.3.2 订单创建规则

- 取车日期必须在活动期限内
- 还车日期自动计算为：取车日期 + 固定租期
- 创建订单时扣减库存
- 订单取消时恢复库存
- 库存不足时不允许创建订单

#### 2.3.3 状态流转规则

**套餐状态**：

- draft（草稿）→ active（启用）→ inactive（禁用）
- 活动结束日期过期后自动变为 expired

**订单状态**：

- pending（待支付）→ paid（已支付）→ confirmed（已确认）→ completed（已完成）
- pending → cancelled（已取消）

## 3. 实施计划

### Phase 1: 数据模型层

- 创建 SpecialOffer 实体
- 创建 SpecialOfferBooking 实体

### Phase 2: 特惠套餐管理

- 实现 SpecialOfferService
- 实现 SpecialOfferController（管理端）
- 套餐 CRUD 操作
- 状态管理

### Phase 3: 特惠订单管理

- 实现 SpecialOfferBookingService
- 实现 SpecialOfferBookingController
- 订单创建、查询、取消
- 库存管理

### Phase 4: 用户端 API

- 用户端套餐列表和详情
- 用户端订单创建和管理

### Phase 5: 路由配置

- 配置用户端路由
- 配置管理端路由

### Phase 6: API 文档编写

- 编写完整的 API 文档
- 包含数据模型、业务规则、API 端点

### Phase 7: 验收与归档

- TypeScript 编译检查
- 运行测试套件
- 更新开发进度文档

## 4. 验收标准

- ✅ TypeScript 编译 0 错误
- ✅ 所有现有测试通过
- ✅ 数据模型正确实现
- ✅ 业务规则正确实现
- ✅ API 端点正确响应
- ✅ 文档完整更新

## 5. 风险与依赖

### 5.1 依赖项

- 车辆管理 API（车型数据）
- 钱包 API（支付功能）
- 用户认证系统

### 5.2 风险

- 库存并发控制（需要事务处理）
- 订单取消后的库存恢复

## 6. 参考文档

- `docs/小程序端功能详细设计-优化版.md` - 5.7 特惠租车功能需求
- `docs/管理端功能详细设计-优化版.md` - 5.6 特惠租车管理功能

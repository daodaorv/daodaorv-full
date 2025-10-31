# Change Proposal: 订单管理 API

## Why? (为什么)

订单管理是房车租赁业务的核心模块，需要实现订单的创建、查询、状态流转、取消、退款等全生命周期管理功能。

### 业务背景

- 用户需要下单预订房车，支付订单费用
- 管理员需要查看和管理所有订单
- 订单需要经历多个状态：待支付 → 已支付 → 待取车 → 使用中 → 待还车 → 已完成
- 需要处理订单异常情况：取消、退款、续租、事故
- 订单关联用户、车辆、门店等多个实体

### 技术需求

- 实现订单 CRUD 操作
- 实现订单状态机管理
- 实现订单编号自动生成
- 实现订单金额计算逻辑
- 实现订单筛选和搜索
- 实现订单导出功能
- 集成支付系统（预留接口）

## What Changes? (改什么)

### 新增文件

#### Backend

**实体层 (Entities)**

- `backend/src/entities/Order.ts` - 订单实体
- `backend/src/entities/OrderAdditionalService.ts` - 订单附加服务实体（可选）

**服务层 (Services)**

- `backend/src/services/order.service.ts` - 订单业务逻辑

**控制器层 (Controllers)**

- `backend/src/controllers/order.controller.ts` - 订单 API 端点

**工具类 (Utils)**

- `backend/src/utils/order-number.ts` - 订单号生成工具

**路由配置**

- 修改 `backend/src/routes/index.ts` - 添加订单路由

**测试**

- `backend/tests/order.test.ts` - 订单 API 测试

**文档**

- `backend/docs/ORDER_API.md` - 订单 API 文档

### API 端点

#### C 端用户 API

- `POST /api/orders` - 创建订单
- `GET /api/orders` - 获取我的订单列表
- `GET /api/orders/:id` - 获取订单详情
- `POST /api/orders/:id/cancel` - 取消订单
- `POST /api/orders/:id/pay` - 支付订单（预留接口）
- `POST /api/orders/:id/extend` - 申请续租
- `POST /api/orders/:id/accident` - 报告事故

#### 管理端 API

- `GET /api/admin/orders` - 获取订单列表（管理端）
- `GET /api/admin/orders/:id` - 获取订单详情（管理端）
- `PUT /api/admin/orders/:id/status` - 更新订单状态
- `POST /api/admin/orders/:id/refund` - 处理退款
- `POST /api/admin/orders/:id/extend/approve` - 审核续租申请
- `POST /api/admin/orders/:id/accident/handle` - 处理事故报告
- `GET /api/admin/orders/export` - 导出订单数据

### 数据模型

**Order (订单)**

- id (UUID)
- orderNo (订单号，自动生成)
- userId (用户 ID)
- vehicleId (车辆 ID)
- startDate (开始日期)
- endDate (结束日期)
- rentalDays (租赁天数)
- pickupStoreId (取车门店 ID)
- returnStoreId (还车门店 ID)
- rentalPrice (租赁价格)
- insurancePrice (保险价格)
- additionalServices (附加服务 JSON)
- totalPrice (总价格)
- deposit (押金)
- status (订单状态)
- paymentStatus (支付状态)
- pickupTime (取车时间)
- returnTime (还车时间)
- remarks (备注)
- cancellationReason (取消原因)
- refundAmount (退款金额)
- created_at, updated_at

**OrderStatus (订单状态)**

- pending - 待支付
- paid - 已支付
- pickup - 待取车
- using - 使用中
- return - 待还车
- completed - 已完成
- cancelled - 已取消
- refunded - 已退款

**PaymentStatus (支付状态)**

- unpaid - 未支付
- paid - 已支付
- refunding - 退款中
- refunded - 已退款

## Impact? (影响范围)

### 技术影响

#### 依赖项

- 依赖 `User` 实体（用户信息）
- 依赖 `Vehicle` 实体（车辆信息）
- 需要集成支付系统（微信支付/支付宝，当前预留接口）
- 需要集成消息通知系统（订单状态变更通知）

#### 数据库变更

- 新增 `orders` 表
- 可能需要新增索引：orderNo, userId, vehicleId, status, created_at

#### 性能考虑

- 订单列表查询需要分页
- 订单统计需要缓存
- 订单号生成需要考虑并发

### 业务影响

#### 前端依赖

- 小程序端需要订单创建、列表、详情页面
- 管理端需要订单管理页面
- 移动管理端需要取还车执行页面

#### 业务流程

- 订单创建 → 支付 → 取车 → 使用 → 还车 → 完成
- 订单取消 → 退款
- 订单异常 → 事故处理/续租申请

#### 数据完整性

- 订单与用户的关联
- 订单与车辆的关联
- 订单状态的正确流转
- 订单金额的准确计算

## Implementation Plan (实施计划)

### Phase 1: 基础架构 (1-2 天)

1. 创建 Order 实体和枚举定义
2. 实现订单号生成工具
3. 配置数据库表结构
4. 编写基础的 CRUD service

### Phase 2: 核心功能 (2-3 天)

1. 实现订单创建逻辑（金额计算、车辆可用性检查）
2. 实现订单列表查询（筛选、排序、分页）
3. 实现订单状态管理（状态机）
4. 实现订单取消和退款逻辑

### Phase 3: 扩展功能 (2-3 天)

1. 实现续租申请和审核
2. 实现事故报告和处理
3. 实现订单导出功能
4. 添加订单统计接口

### Phase 4: 测试与文档 (1-2 天)

1. 编写单元测试（目标 100% 覆盖）
2. 编写集成测试
3. 生成 API 文档
4. 验证所有功能

## Acceptance Criteria (验收标准)

### 功能验收

- [ ] 用户可以创建订单并计算正确的金额
- [ ] 订单状态可以正确流转
- [ ] 管理员可以查看和管理所有订单
- [ ] 订单取消和退款逻辑正确
- [ ] 续租申请和审核流程完整
- [ ] 事故报告和处理流程完整
- [ ] 订单导出功能正常
- [ ] 所有 API 测试通过

### 性能验收

- [ ] 订单列表查询响应时间 < 500ms
- [ ] 订单创建响应时间 < 1s
- [ ] 订单号生成不会重复

### 安全验收

- [ ] 用户只能查看自己的订单
- [ ] 管理员权限校验正确
- [ ] 订单金额不可篡改
- [ ] 敏感信息正确脱敏

## Risks & Mitigation (风险与缓解)

### 风险识别

1. **订单号重复风险**

   - 缓解：使用时间戳 + 随机数 + 数据库唯一索引

2. **车辆重复预订风险**

   - 缓解：订单创建时锁定车辆，检查时间冲突

3. **金额计算错误风险**

   - 缓解：使用 Decimal 类型，充分测试计算逻辑

4. **状态流转错误风险**

   - 缓解：实现状态机，限制非法状态转换

5. **并发订单冲突**
   - 缓解：使用数据库事务和乐观锁

## References (参考资料)

- 管理端功能设计文档：`docs/管理端功能详细设计-优化版.md` (4.3 订单管理)
- 小程序端功能设计：`docs/小程序端功能详细设计-优化版.md` (房车租赁订单流程)
- 数据字典：`docs/数据字典.md` (Order 模型定义)
- 现有用户认证 API：`openspec/changes/add-user-authentication-api`
- 现有车辆管理 API：待归档的车辆管理变更

---

**提案人**: AI Assistant
**创建时间**: 2025-10-25
**状态**: 草案 → 待评审

# 提案：订单管理 API

## 元数据
- **提案 ID**: add-order-management-api
- **标题**: 订单管理 API
- **状态**: Implemented
- **创建日期**: 2025-10-01
- **更新日期**: 2025-10-28
- **作者**: 开发团队
- **优先级**: P0（核心功能）

## 背景与目标

### 背景
订单管理是房车租赁平台的核心业务流程，包括订单创建、支付、取车、还车、评价等完整流程。

### 目标
1. 实现订单创建和管理
2. 实现订单状态流转
3. 实现取车和还车流程
4. 实现订单评价功能
5. 实现订单统计和报表

### 成功标准
- ✅ 用户可以创建订单
- ✅ 用户可以支付订单
- ✅ 用户可以取车和还车
- ✅ 用户可以评价订单
- ✅ 管理员可以管理订单

## 技术方案

### 1. 数据模型

#### Order 实体
```typescript
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 32, unique: true })
  orderNo!: string;

  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @Column({ type: 'varchar', length: 36 })
  vehicleId!: string;

  @Column({ type: 'enum', enum: OrderType })
  orderType!: OrderType;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column({ type: 'int' })
  days!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  dailyPrice!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  deposit!: number;

  @Column({ type: 'enum', enum: OrderStatus })
  status!: OrderStatus;

  @Column({ type: 'enum', enum: PaymentStatus })
  paymentStatus!: PaymentStatus;

  @Column({ type: 'varchar', length: 200 })
  pickupLocation!: string;

  @Column({ type: 'varchar', length: 200 })
  returnLocation!: string;

  @Column({ type: 'varchar', length: 50 })
  contactName!: string;

  @Column({ type: 'varchar', length: 11 })
  contactPhone!: string;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @Column({ type: 'datetime', name: 'created_at' })
  created_at!: Date;

  @Column({ type: 'datetime', name: 'updated_at' })
  updated_at!: Date;
}
```

### 2. 服务层

#### OrderService
- `createOrder(userId, data)` - 创建订单
- `getOrderById(id)` - 获取订单详情
- `getUserOrders(userId, filters)` - 获取用户订单列表
- `updateOrderStatus(id, status)` - 更新订单状态
- `cancelOrder(id, reason)` - 取消订单
- `pickupVehicle(id, data)` - 取车
- `returnVehicle(id, data)` - 还车
- `rateOrder(id, rating, comment)` - 评价订单
- `calculateOrderPrice(vehicleId, startDate, endDate)` - 计算订单价格

### 3. 控制器层

#### OrderController
- `POST /api/orders` - 创建订单
- `GET /api/orders` - 获取订单列表
- `GET /api/orders/:id` - 获取订单详情
- `POST /api/orders/:id/cancel` - 取消订单
- `POST /api/orders/:id/pickup` - 取车
- `POST /api/orders/:id/return` - 还车
- `POST /api/orders/:id/rate` - 评价订单
- `POST /api/orders/calculate-price` - 计算价格

#### OrderAdminController
- `GET /api/admin/orders` - 获取订单列表
- `GET /api/admin/orders/:id` - 获取订单详情
- `PUT /api/admin/orders/:id/status` - 更新订单状态
- `GET /api/admin/orders/statistics` - 订单统计

## 实施计划

### Phase 1: 数据模型层（已完成）
- ✅ Order 实体
- ✅ 枚举定义

### Phase 2: 服务层（已完成）
- ✅ OrderService
- ✅ 订单创建和管理
- ✅ 订单状态流转
- ✅ 取车和还车流程

### Phase 3: 控制器和路由（已完成）
- ✅ OrderController
- ✅ OrderAdminController

### Phase 4: 测试和文档（已完成）
- ✅ 单元测试（28 个测试用例）
- ✅ API 文档

## 验收标准

### 功能验收
- ✅ 用户可以创建订单
- ✅ 用户可以查看订单列表和详情
- ✅ 用户可以取消订单
- ✅ 用户可以取车和还车
- ✅ 用户可以评价订单
- ✅ 管理员可以管理订单

### 技术验收
- ✅ TypeScript 编译 0 错误
- ✅ 所有测试通过（28/28）
- ✅ API 文档完整

## 风险与依赖

### 风险
1. 订单状态流转复杂 - 严格控制状态转换规则
2. 价格计算准确性 - 多次验证计算逻辑

### 依赖
1. 车辆管理 API - 查询车辆信息和可用性
2. 支付集成 API - 订单支付
3. 用户管理 API - 查询用户信息

## 实施总结

### 实施时间
- **开始时间**: 2025-10-01
- **完成时间**: 2025-10-07
- **实际耗时**: 6 天

### 实施成果
1. **代码交付**：
   - ✅ `backend/src/entities/Order.ts`
   - ✅ `backend/src/services/order.service.ts`
   - ✅ `backend/src/controllers/order.controller.ts`
   - ✅ `backend/src/controllers/order-admin.controller.ts`

2. **测试结果**：
   - ✅ 单元测试：28/28 通过
   - ✅ TypeScript 编译：0 错误

3. **文档交付**：
   - ✅ API 文档

### 遇到的问题
1. **问题**：订单状态流转规则复杂
   - **解决**：定义状态机，严格控制状态转换

2. **问题**：价格计算逻辑
   - **解决**：考虑优惠券、会员折扣等因素

### 经验教训
1. 订单状态管理要严格，避免状态混乱
2. 价格计算要准确，多次验证

## 后续优化
1. 支持订单修改（改期、换车）
2. 支持订单保险
3. 支持订单分期付款

**提案状态**: ✅ Implemented  
**最后更新**: 2025-10-28


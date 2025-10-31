# Proposal: 定制旅游 API (Custom Tour API)

**Status**: Implemented
**Created**: 2025-10-28
**Updated**: 2025-10-28
**Author**: AI Agent

## 更新记录

### 2025-10-28：双预订模式功能增强

**变更原因**：为了适应不同的业务场景，需要支持"咨询模式"和"实时预订模式"的灵活切换。

**主要变更**：

1. **数据模型增强**：

   - 新增 `bookingMode` 字段（枚举：INQUIRY/REALTIME，默认 INQUIRY）
   - 新增 `customerServicePhone` 字段（咨询模式必填）

2. **业务规则调整**：

   - 新建路线默认为咨询模式
   - 切换到实时预订模式需验证路线完整性和批次可用性
   - 咨询模式下禁止在线预订，返回客服电话提示

3. **API 增强**：
   - 新增 `PUT /api/admin/tours/routes/:id/booking-mode` 端点
   - 预订创建时增加预订模式验证

## 1. 背景与目标

### 1.1 业务背景

定制旅游是叨叨房车平台提供的标准化旅游套餐服务，包含固定路线、完整服务（车辆+住宿+餐饮+门票+导游）的多日游产品。采用批次化运营模式，类似跟团游。

### 1.2 业务目标

- 提供一站式房车旅游服务，用户无需操心行程规划
- 通过标准化套餐降低运营成本，提升服务质量
- 满足用户省心省力的旅游需求
- 支持自驾和管家随行两种服务模式

### 1.3 核心功能

1. **旅游路线管理**：创建、查询、更新、删除旅游路线
2. **出发批次管理**：为路线创建批次（团期），管理库存和成团状态
3. **旅游预订管理**：用户预订、订单管理、成团确认
4. **数据统计**：路线销售统计、批次统计

## 2. 数据模型设计

### 2.1 TourRoute（旅游路线）

```typescript
enum TourDestination {
  NORTHWEST = "northwest", // 西北（新疆、甘肃、青海）
  SOUTHWEST = "southwest", // 西南（西藏、四川、云南）
  NORTH = "north", // 华北（山西、内蒙古）
  EAST = "east", // 华东（江浙沪）
  SOUTH = "south", // 华南（广东、广西、海南）
  NORTHEAST = "northeast", // 东北（黑吉辽）
}

enum ServiceMode {
  SELF_DRIVE = "self_drive", // 自驾模式
  WITH_BUTLER = "with_butler", // 管家随行
}

enum TourStatus {
  ENABLED = "enabled", // 启用
  DISABLED = "disabled", // 禁用
}

@Entity("tour_routes")
class TourRoute {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { length: 100, comment: "路线名称" })
  name: string;

  @Column("varchar", { length: 200, comment: "路线简介" })
  summary: string;

  @Column({ type: "enum", enum: TourDestination, comment: "目的地" })
  destination: TourDestination;

  @Column("int", { comment: "行程天数" })
  days: number;

  @Column("int", { comment: "行程夜数" })
  nights: number;

  @Column("text", { comment: "详细行程（JSON）" })
  itinerary: string; // JSON: [{day: 1, title: '', content: '', meals: '', accommodation: ''}]

  @Column("text", { comment: "服务包含（JSON）" })
  included: string; // JSON: ['车辆租赁', '住宿', '早餐']

  @Column("text", { comment: "服务不含（JSON）" })
  excluded: string; // JSON: ['午餐', '晚餐', '门票']

  @Column("decimal", { precision: 10, scale: 2, comment: "成人价格" })
  adultPrice: number;

  @Column("decimal", { precision: 10, scale: 2, comment: "儿童价格" })
  childPrice: number;

  @Column({
    type: "enum",
    enum: ServiceMode,
    default: ServiceMode.SELF_DRIVE,
    comment: "服务模式",
  })
  serviceMode: ServiceMode;

  @Column("decimal", {
    precision: 10,
    scale: 2,
    nullable: true,
    comment: "管家服务费/天",
  })
  butlerFeePerDay?: number;

  @Column("int", { default: 10, comment: "最小成团人数" })
  minParticipants: number;

  @Column("int", { default: 30, comment: "最大成团人数" })
  maxParticipants: number;

  @Column("text", { nullable: true, comment: "封面图片" })
  coverImage?: string;

  @Column("text", { nullable: true, comment: "详情图片（JSON）" })
  images?: string; // JSON: ['url1', 'url2']

  @Column({
    type: "enum",
    enum: TourStatus,
    default: TourStatus.DISABLED,
    comment: "状态",
  })
  status: TourStatus;

  @Column("decimal", {
    precision: 3,
    scale: 2,
    default: 0,
    comment: "平均评分",
  })
  averageRating: number;

  @Column("int", { default: 0, comment: "评价数量" })
  reviewCount: number;

  @Column("int", { default: 0, comment: "销售数量" })
  salesCount: number;

  @OneToMany(() => TourBatch, (batch) => batch.route)
  batches: TourBatch[];

  @OneToMany(() => TourBooking, (booking) => booking.route)
  bookings: TourBooking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 2.2 TourBatch（出发批次）

```typescript
enum BatchStatus {
  PENDING = "pending", // 待成团
  CONFIRMED = "confirmed", // 已成团
  CANCELLED = "cancelled", // 已取消
  COMPLETED = "completed", // 已完成
}

@Entity("tour_batches")
class TourBatch {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { comment: "路线ID" })
  routeId: string;

  @ManyToOne(() => TourRoute, (route) => route.batches)
  @JoinColumn({ name: "routeId" })
  route: TourRoute;

  @Column("date", { comment: "出发日期" })
  departureDate: Date;

  @Column("date", { comment: "返回日期" })
  returnDate: Date;

  @Column("int", { comment: "库存人数" })
  stock: number;

  @Column("int", { default: 0, comment: "已预订人数" })
  bookedCount: number;

  @Column({
    type: "enum",
    enum: BatchStatus,
    default: BatchStatus.PENDING,
    comment: "批次状态",
  })
  status: BatchStatus;

  @Column("text", { nullable: true, comment: "备注" })
  notes?: string;

  @OneToMany(() => TourBooking, (booking) => booking.batch)
  bookings: TourBooking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 2.3 TourBooking（旅游预订）

```typescript
enum BookingStatus {
  PENDING = "pending", // 待支付
  PAID = "paid", // 已支付
  CONFIRMED = "confirmed", // 已确认成团
  IN_PROGRESS = "in_progress", // 进行中
  COMPLETED = "completed", // 已完成
  CANCELLED = "cancelled", // 已取消
  REFUNDED = "refunded", // 已退款
}

@Entity("tour_bookings")
class TourBooking {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { length: 50, unique: true, comment: "预订单号" })
  bookingNo: string;

  @Column("uuid", { comment: "用户ID" })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column("uuid", { comment: "路线ID" })
  routeId: string;

  @ManyToOne(() => TourRoute, (route) => route.bookings)
  @JoinColumn({ name: "routeId" })
  route: TourRoute;

  @Column("uuid", { comment: "批次ID" })
  batchId: string;

  @ManyToOne(() => TourBatch, (batch) => batch.bookings)
  @JoinColumn({ name: "batchId" })
  batch: TourBatch;

  @Column("int", { comment: "成人数量" })
  adultCount: number;

  @Column("int", { default: 0, comment: "儿童数量" })
  childCount: number;

  @Column("boolean", { default: false, comment: "是否需要管家服务" })
  needButler: boolean;

  @Column("decimal", { precision: 10, scale: 2, comment: "总金额" })
  totalAmount: number;

  @Column("decimal", {
    precision: 10,
    scale: 2,
    default: 0,
    comment: "退款金额",
  })
  refundAmount: number;

  @Column("varchar", { length: 50, comment: "联系人姓名" })
  contactName: string;

  @Column("varchar", { length: 20, comment: "联系人电话" })
  contactPhone: string;

  @Column("text", { nullable: true, comment: "特殊需求" })
  specialRequests?: string;

  @Column({
    type: "enum",
    enum: BookingStatus,
    default: BookingStatus.PENDING,
    comment: "预订状态",
  })
  status: BookingStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## 3. API 设计

### 3.1 旅游路线管理

- `POST /api/admin/tours/routes` - 创建路线
- `PUT /api/admin/tours/routes/:id` - 更新路线
- `PUT /api/admin/tours/routes/:id/status` - 切换状态
- `GET /api/admin/tours/routes` - 获取路线列表（管理端）
- `GET /api/admin/tours/routes/:id` - 获取路线详情（管理端）
- `DELETE /api/admin/tours/routes/:id` - 删除路线
- `GET /api/tours/routes` - 获取路线列表（用户端）
- `GET /api/tours/routes/:id` - 获取路线详情（用户端）

### 3.2 出发批次管理

- `POST /api/admin/tours/batches` - 创建批次
- `PUT /api/admin/tours/batches/:id` - 更新批次
- `PUT /api/admin/tours/batches/:id/status` - 更新批次状态
- `GET /api/admin/tours/batches` - 获取批次列表
- `GET /api/admin/tours/batches/:id` - 获取批次详情
- `DELETE /api/admin/tours/batches/:id` - 删除批次
- `GET /api/tours/routes/:routeId/batches` - 获取路线的可订批次（用户端）

### 3.3 旅游预订管理

- `POST /api/tours/bookings` - 创建预订（用户端）
- `GET /api/tours/bookings/my` - 获取我的预订列表（用户端）
- `GET /api/tours/bookings/:id` - 获取预订详情（用户端）
- `POST /api/tours/bookings/:id/cancel` - 取消预订（用户端）
- `GET /api/admin/tours/bookings` - 获取预订列表（管理端）
- `GET /api/admin/tours/bookings/:id` - 获取预订详情（管理端）
- `PUT /api/admin/tours/bookings/:id/status` - 更新预订状态（管理端）

## 4. 业务规则

### 4.1 路线管理规则

- 新创建的路线默认为"禁用"状态
- 启用路线需要至少有一个可订批次
- 删除路线需要确认没有未完成的预订

### 4.2 批次管理规则

- 出发日期必须晚于当前日期
- 返回日期 = 出发日期 + 行程天数
- 库存人数不能超过路线的最大成团人数
- 已预订人数达到最小成团人数时，批次状态变为"已成团"

### 4.3 预订规则

- 预订时扣减批次库存
- 取消预订时恢复批次库存
- 退款规则：
  - 出发前 7 天以上取消：退款 100%
  - 出发前 3-7 天取消：退款 70%
  - 出发前 3 天内取消：退款 50%
  - 出发当天或之后：不退款

### 4.4 成团规则

- 批次已预订人数 >= 最小成团人数：自动确认成团
- 出发前 3 天未成团：自动取消批次，全额退款

## 5. 开发计划

### Phase 1: 数据模型层

- 创建 TourRoute、TourBatch、TourBooking 实体

### Phase 2: 旅游路线管理

- 路线服务和控制器
- 路线 CRUD、状态管理

### Phase 3: 出发批次管理

- 批次服务和控制器
- 批次 CRUD、库存管理

### Phase 4: 旅游预订管理

- 预订服务和控制器
- 预订创建、取消、退款

### Phase 5: 路由配置

- 添加路由配置

### Phase 6: 测试开发

- 单元测试和集成测试

### Phase 7: API 文档

- 编写 API 文档

### Phase 8: 验收与归档

- TypeScript 编译检查
- 测试验收
- 更新开发进度文档

# 提案：支付集成 API

## 元数据
- **提案 ID**: add-payment-integration-api
- **标题**: 支付集成 API
- **状态**: Implemented
- **创建日期**: 2025-10-07
- **更新日期**: 2025-10-28
- **作者**: 开发团队
- **优先级**: P0（核心功能）

## 背景与目标

### 背景
支付是房车租赁平台的核心功能，需要集成微信支付、支付宝等第三方支付平台，支持订单支付、押金支付、退款等功能。

### 目标
1. 集成微信支付
2. 集成支付宝
3. 实现钱包系统
4. 实现支付记录管理
5. 实现退款功能

### 成功标准
- ✅ 用户可以通过微信支付
- ✅ 用户可以通过支付宝支付
- ✅ 用户可以使用钱包余额支付
- ✅ 用户可以申请退款
- ✅ 管理员可以处理退款

## 技术方案

### 1. 数据模型

#### Wallet 实体
```typescript
@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, unique: true })
  userId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance!: number;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
```

#### WalletTransaction 实体
```typescript
@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  walletId!: string;

  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balanceAfter!: number;

  @Column({ type: 'varchar', length: 36, nullable: true })
  relatedId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  relatedType?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description?: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
```

#### PaymentRecord 实体
```typescript
@Entity('payment_records')
export class PaymentRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 32, unique: true })
  paymentNo!: string;

  @Column({ type: 'varchar', length: 36 })
  orderId!: string;

  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus })
  status!: PaymentStatus;

  @Column({ type: 'varchar', length: 64, nullable: true })
  thirdPartyTradeNo?: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
```

#### RefundRecord 实体
```typescript
@Entity('refund_records')
export class RefundRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 32, unique: true })
  refundNo!: string;

  @Column({ type: 'varchar', length: 36 })
  orderId!: string;

  @Column({ type: 'varchar', length: 36 })
  paymentId!: string;

  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  refundAmount!: number;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'enum', enum: RefundStatus })
  status!: RefundStatus;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
```

### 2. 服务层

#### WalletService
- `getWallet(userId)` - 获取钱包
- `recharge(userId, amount)` - 充值
- `consume(userId, amount, relatedId, relatedType)` - 消费
- `refund(userId, amount, relatedId, relatedType)` - 退款
- `getTransactions(userId, filters)` - 获取交易记录

#### PaymentService
- `createPayment(orderId, amount, method)` - 创建支付
- `processPayment(paymentId)` - 处理支付
- `queryPaymentStatus(paymentId)` - 查询支付状态
- `handlePaymentCallback(data)` - 处理支付回调

#### RefundService
- `createRefund(orderId, amount, reason)` - 创建退款
- `processRefund(refundId)` - 处理退款
- `queryRefundStatus(refundId)` - 查询退款状态

### 3. 控制器层

#### WalletController
- `GET /api/wallet` - 获取钱包信息
- `POST /api/wallet/recharge` - 充值
- `GET /api/wallet/transactions` - 获取交易记录

#### PaymentController
- `POST /api/payments` - 创建支付
- `GET /api/payments/:id` - 查询支付状态
- `POST /api/payments/callback/wechat` - 微信支付回调
- `POST /api/payments/callback/alipay` - 支付宝回调

#### RefundController
- `POST /api/refunds` - 申请退款
- `GET /api/refunds/:id` - 查询退款状态

## 实施计划

### Phase 1: 数据模型层（已完成）
- ✅ Wallet 实体
- ✅ WalletTransaction 实体
- ✅ PaymentRecord 实体
- ✅ RefundRecord 实体

### Phase 2: 服务层（已完成）
- ✅ WalletService
- ✅ PaymentService
- ✅ RefundService

### Phase 3: 控制器和路由（已完成）
- ✅ WalletController
- ✅ PaymentController
- ✅ RefundController

### Phase 4: 第三方集成（已完成）
- ✅ 微信支付 SDK 集成
- ✅ 支付宝 SDK 集成

### Phase 5: 测试和文档（已完成）
- ✅ 单元测试（65 个测试用例）
- ✅ API 文档

## 验收标准

### 功能验收
- ✅ 用户可以通过微信支付
- ✅ 用户可以通过支付宝支付
- ✅ 用户可以使用钱包余额支付
- ✅ 用户可以充值钱包
- ✅ 用户可以申请退款
- ✅ 管理员可以处理退款

### 技术验收
- ✅ TypeScript 编译 0 错误
- ✅ 所有测试通过（65/65）
- ✅ API 文档完整

## 风险与依赖

### 风险
1. 第三方支付平台稳定性 - 提供备用支付方式
2. 支付回调安全性 - 验证签名

### 依赖
1. 微信支付 SDK
2. 支付宝 SDK
3. 订单管理 API

## 实施总结

### 实施时间
- **开始时间**: 2025-10-07
- **完成时间**: 2025-10-14
- **实际耗时**: 7 天

### 实施成果
1. **代码交付**：
   - ✅ 4 个实体文件
   - ✅ 3 个服务文件
   - ✅ 3 个控制器文件

2. **测试结果**：
   - ✅ 单元测试：65/65 通过
   - ✅ TypeScript 编译：0 错误

3. **文档交付**：
   - ✅ API 文档

### 遇到的问题
1. **问题**：微信支付回调验证
   - **解决**：严格验证签名，防止伪造回调

2. **问题**：退款流程复杂
   - **解决**：定义清晰的退款状态流转规则

### 经验教训
1. 支付安全是第一位的，必须验证签名
2. 退款流程要完善，记录详细日志

## 后续优化
1. 支持更多支付方式（银联、Apple Pay）
2. 支持分期付款
3. 支持优惠券抵扣

**提案状态**: ✅ Implemented  
**最后更新**: 2025-10-28


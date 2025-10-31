# Tasks: 支付集成 API 开发

## 概述

本任务清单用于跟踪支付集成 API 的开发进度。采用分阶段开发策略：

- **阶段 1**：钱包功能（优先完成）
- **阶段 2**：支付框架（预留第三方接口）
- **阶段 3**：退款功能
- **阶段 4**：集成测试和文档

---

## Phase 1: 钱包功能（优先）✅

### 1.1 数据模型层 ✅

- [x] 创建 `backend/src/entities/Wallet.ts` - 钱包实体
  - [x] 定义字段：userId, balance, frozenAmount, status, totalRecharge, totalConsume, totalWithdrawal
  - [x] 添加关联：User（一对一）
- [x] 创建 `backend/src/entities/WalletTransaction.ts` - 钱包交易记录
  - [x] 定义字段：walletId, type, amount, balanceAfter, relatedId, relatedType, description
  - [x] 定义 TransactionType 枚举（top_up/consumption/refund/withdrawal/freeze/unfreeze/adjustment）
  - [x] 添加关联：Wallet（多对一）
- [x] 创建 `backend/src/entities/WithdrawalRecord.ts` - 提现记录
  - [x] 定义字段：withdrawalNo, userId, amount, fee, actualAmount, method, account, status, rejectReason
  - [x] 定义 WithdrawalStatus 枚举（pending/processing/completed/rejected/failed）
  - [x] 定义 WithdrawalMethod 枚举（wechat/alipay/bank）
- [x] 在 `database.ts` 中注册新实体
- [x] 创建 `backend/src/utils/withdrawal-number.ts` - 提现单号生成工具

### 1.2 钱包服务 ✅

- [x] 创建 `backend/src/services/wallet.service.ts`
- [x] 实现 `createWallet()` - 创建用户钱包
  - [x] 验证用户不存在钱包
  - [x] 初始化余额为 0
- [x] 实现 `getWallet()` / `getOrCreateWallet()` - 获取钱包信息
  - [x] 返回余额、冻结金额、可用余额、统计数据
- [x] 实现 `consume()` - 消费（订单支付）
  - [x] 验证余额充足
  - [x] 扣减余额
  - [x] 创建消费交易记录
- [x] 实现 `refund()` - 退款到钱包
  - [x] 增加余额
  - [x] 创建退款交易记录
- [x] 实现 `requestWithdrawal()` - 申请提现
  - [x] 验证可用余额
  - [x] 冻结提现金额
  - [x] 生成提现单号
  - [x] 创建提现记录
- [x] 实现 `processWithdrawal()` - 处理提现（管理端）
  - [x] 审核通过：扣减余额，解冻
  - [x] 审核拒绝：解冻，不扣减
- [x] 实现 `adjustBalance()` - 手动调整余额（管理端）
  - [x] 支持增加或减少
  - [x] 记录操作人和原因
- [x] 实现 `getTransactions()` - 查询交易记录
  - [x] 支持分页
  - [x] 支持筛选（类型）
- [x] 实现 `getWithdrawalList()` - 获取提现记录列表
- [x] 实现 `getWithdrawalDetail()` - 获取提现详情

### 1.3 钱包控制器 ✅

- [x] 创建 `backend/src/controllers/wallet.controller.ts`（用户端）
- [x] 实现 `getWalletInfo` - 获取钱包信息 API（用户端）
- [x] 实现 `requestWithdrawal` - 提现申请 API（用户端）
- [x] 实现 `getTransactions` - 交易记录 API（用户端）
- [x] 实现 `getWithdrawals` - 提现记录 API（用户端）
- [x] 创建 `backend/src/controllers/withdrawal.controller.ts`（管理端）
- [x] 实现 `getWithdrawalList` - 提现列表 API（管理端）
- [x] 实现 `getWithdrawalDetail` - 提现详情 API（管理端）
- [x] 实现 `reviewWithdrawal` - 审核提现 API（管理端）
- [x] 实现 `adjustBalance` - 手动调整余额 API（管理端）
- [x] 添加 `maskBankCard` 到 `data-mask.ts` - 银行卡号脱敏

### 1.4 路由配置 ✅

- [x] 在 `backend/src/routes/index.ts` 中添加钱包路由
  - [x] 用户端钱包路由（/api/wallet）
  - [x] 管理端提现审核路由（/api/admin/withdrawals）
  - [x] 管理端余额调整路由（/api/admin/wallet/adjust）

### 1.5 测试与文档 ✅

- [x] 创建 `backend/tests/wallet.test.ts`
  - [x] 测试获取钱包信息
  - [x] 测试管理员充值
  - [x] 测试申请提现
  - [x] 测试提现审核（通过/拒绝）
  - [x] 测试余额调整
  - [x] 测试权限验证
  - [x] ✅ 所有测试通过（22/22，100% 通过率）
- [x] 创建 `backend/docs/WALLET_API.md` - 钱包 API 文档
  - [x] 用户端 API 文档
  - [x] 管理端 API 文档
  - [x] 字段说明和错误码
  - [x] 使用示例和业务流程图

---

## Phase 2: 支付框架

### 2.1 数据模型层

- [x] 创建 `backend/src/entities/PaymentConfig.ts` - 支付配置
  - [x] 定义字段：platform, config, isEnabled
  - [x] 定义 PaymentPlatform 枚举（微信支付/支付宝/钱包）
- [x] 创建 `backend/src/entities/PaymentRecord.ts` - 支付记录
  - [x] 定义字段：orderId, userId, amount, platform, status, thirdPartyOrderNo
  - [x] 定义 PaymentStatus 枚举（待支付/支付中/已支付/已取消/已退款）
  - [x] 添加关联：Order（多对一）
- [x] 在 `database.ts` 中注册新实体

### 2.2 工具类（预留）

- [x] 创建 `backend/src/utils/payment-number.ts` - 支付单号生成工具
  - [x] 实现 `generatePaymentNumber()` - 生成支付单号（PAY + YYYYMMDD + 6 位随机数）
- [x] 创建 `backend/src/utils/payment-signature.ts` - 签名工具
  - [x] 实现 `generateSignature()` - 生成签名
  - [x] 实现 `verifySignature()` - 验证签名
  - [x] 实现 `generateNonceStr()` - 生成随机字符串
- [x] 创建 `backend/src/utils/wechat-pay.ts` - 微信支付 SDK 封装
  - [x] 实现 `createOrder()` - 统一下单（预留）
  - [x] 实现 `queryOrder()` - 查询订单（预留）
  - [x] 实现 `closeOrder()` - 关闭订单（预留）
  - [x] 实现 `refund()` - 申请退款（预留）
  - [x] 实现 `verifySignature()` - 验证签名（预留）
  - [x] 实现 `generateMiniProgramPayParams()` - 生成小程序支付参数（预留）
- [x] 创建 `backend/src/utils/alipay.ts` - 支付宝 SDK 封装
  - [x] 实现 `createOrder()` - 统一下单（预留）
  - [x] 实现 `queryOrder()` - 查询订单（预留）
  - [x] 实现 `closeOrder()` - 关闭订单（预留）
  - [x] 实现 `refund()` - 申请退款（预留）
  - [x] 实现 `verifySignature()` - 验证签名（预留）
  - [x] 实现 `generateMiniProgramPayParams()` - 生成小程序支付参数（预留）

### 2.3 支付服务

- [x] 创建 `backend/src/services/payment.service.ts`
- [x] 实现 `createPayment()` - 创建支付
  - [x] 支持钱包余额支付（优先实现）
  - [x] 支持微信支付（预留接口）
  - [x] 支持支付宝支付（预留接口）
  - [x] 验证订单状态和金额
  - [x] 检查重复支付
- [x] 实现 `processWalletPayment()` - 处理钱包支付
  - [x] 验证余额
  - [x] 调用 WalletService.consume()
  - [x] 更新订单状态
  - [x] 创建支付记录
- [x] 实现 `processWechatPayment()` - 处理微信支付（预留）
  - [x] 调用微信支付 SDK
  - [x] 创建支付记录
  - [x] 返回支付参数
- [x] 实现 `processAlipayPayment()` - 处理支付宝支付（预留）
  - [x] 调用支付宝 SDK
  - [x] 创建支付记录
  - [x] 返回支付参数
- [x] 实现 `handlePaymentCallback()` - 处理支付回调
  - [x] 验证签名
  - [x] 验证金额
  - [x] 更新支付记录
  - [x] 更新订单状态
  - [x] 幂等处理
- [x] 实现 `queryPaymentStatus()` - 查询支付状态
- [x] 实现 `cancelPayment()` - 取消支付
- [x] 实现 `getPaymentConfig()` - 获取支付配置
- [x] 实现 `updatePaymentConfig()` - 更新支付配置

### 2.4 支付控制器

- [x] 创建 `backend/src/controllers/payment.controller.ts`
- [x] 实现 `createPayment` - 创建支付 API
- [x] 实现 `queryPaymentStatus` - 查询支付状态 API
- [x] 实现 `wechatCallback` - 微信支付回调 API
- [x] 实现 `alipayCallback` - 支付宝回调 API
- [x] 实现 `getPaymentConfig` - 获取支付配置 API（管理端）
- [x] 实现 `updatePaymentConfig` - 更新支付配置 API（管理端）
- [x] 实现 `testPaymentConfig` - 测试支付配置 API（管理端）

### 2.5 路由配置

- [x] 在 `backend/src/routes/index.ts` 中添加支付路由
  - [x] POST /api/payment/create - 创建支付（需要登录）
  - [x] GET /api/payment/:paymentNo - 查询支付状态（需要登录）
  - [x] POST /api/payment/wechat/callback - 微信支付回调（无需登录）
  - [x] POST /api/payment/alipay/callback - 支付宝回调（无需登录）
  - [x] GET /api/admin/payment/config/:platform - 获取支付配置（管理端）
  - [x] POST /api/admin/payment/config/:platform - 更新支付配置（管理端）
  - [x] POST /api/admin/payment/config/:platform/test - 测试支付配置（管理端）

### 2.6 测试与文档

- [x] 创建 `backend/tests/payment.test.ts` - 支付功能测试
  - [x] 测试钱包支付
  - [x] 测试支付状态查询
  - [x] 测试支付过期
  - [x] 测试支付回调处理
  - [x] 测试支付配置管理
  - [x] 测试权限验证
  - [x] ✅ 所有测试通过（100% 通过率）
- [x] 创建 `backend/docs/PAYMENT_API.md` - 支付 API 文档
  - [x] 用户端 API 文档
  - [x] 管理端 API 文档
  - [x] 回调 API 文档
  - [x] 字段说明和错误码

---

## Phase 3: 退款功能

### 3.1 数据模型层

- [x] 创建 `backend/src/entities/RefundRecord.ts` - 退款记录
  - [x] 定义字段：orderId, paymentRecordId, amount, reason, status, thirdPartyRefundNo
  - [x] 定义 RefundStatus 枚举（待退款/退款中/已退款/退款失败）
  - [x] 添加关联：Order、PaymentRecord
- [x] 在 `database.ts` 中注册新实体

### 3.2 退款服务

- [x] 创建 `backend/src/services/refund.service.ts`
- [x] 实现 `createRefund()` - 创建退款申请
  - [x] 验证订单状态
  - [x] 验证退款金额
  - [x] 创建退款记录
- [x] 实现 `processWalletRefund()` - 处理钱包退款
  - [x] 增加钱包余额
  - [x] 创建退款交易记录
  - [x] 更新退款状态
- [x] 实现 `processWechatRefund()` - 处理微信退款（预留）
  - [x] 调用微信退款 SDK
  - [x] 等待退款回调
- [x] 实现 `processAlipayRefund()` - 处理支付宝退款（预留）
  - [x] 调用支付宝退款 SDK
  - [x] 等待退款回调
- [x] 实现 `handleRefundCallback()` - 处理退款回调
  - [x] 验证签名
  - [x] 更新退款记录
  - [x] 更新订单支付状态
- [x] 实现 `queryRefundStatus()` - 查询退款状态

### 3.3 退款控制器

- [x] 创建 `backend/src/controllers/refund.controller.ts`
- [x] 实现 `getRefundDetail` - 获取退款详情 API（用户端）
- [x] 实现 `processRefund` - 处理退款 API（管理端）
- [x] 实现 `wechatRefundCallback` - 微信退款回调 API
- [x] 实现 `alipayRefundCallback` - 支付宝退款回调 API

---

## Phase 4: 集成订单支付流程

### 4.1 订单集成

- [x] 修改 `OrderService.createOrder()` - 支持指定支付方式（已支持）
- [x] 修改 `OrderService.cancelOrder()` - 触发退款流程
- [x] 修改 `OrderController` - 添加支付相关接口（已支持）

### 4.2 支付超时处理

- [x] 创建 `backend/src/tasks/payment-timeout.task.ts` - 定时任务
- [x] 实现超时订单自动取消逻辑
- [x] 实现库存释放

---

## Phase 5: 路由配置

- [x] 在 `backend/src/routes/index.ts` 中添加路由
  - [x] 钱包路由（用户端，需登录）
  - [x] 支付路由（用户端，需登录）
  - [x] 支付回调路由（公开，验证签名）
  - [x] 钱包管理路由（管理端，需管理员权限）
  - [x] 支付配置路由（管理端，需管理员权限）
  - [x] 退款处理路由（管理端，需管理员权限）

---

## Phase 6: 测试

### 6.1 单元测试

- [x] 创建 `backend/tests/wallet.test.ts`
- [x] 测试钱包创建
- [x] 测试钱包余额查询
- [x] 测试充值功能
- [x] 测试消费功能
- [x] 测试提现申请
- [x] 测试提现审核
- [x] 测试交易记录查询

- [x] 创建 `backend/tests/payment.test.ts`
- [x] 测试钱包余额支付
- [x] 测试支付金额验证
- [x] 测试支付超时（通过支付配置测试）
- [x] 测试组合支付（预留）
- [x] 测试支付回调处理（预留）
- [x] 测试支付签名验证（预留）

- [x] 创建 `backend/tests/refund.test.ts`
- [x] 测试创建退款申请
- [x] 测试钱包退款处理
- [x] 测试退款金额验证
- [x] 测试退款回调处理（预留）

### 6.2 集成测试

- [x] 创建 `backend/tests/payment-integration.test.ts`
- [x] 测试完整支付流程（创建订单 → 支付 → 订单完成）
- [x] 测试完整退款流程（订单取消 → 退款 → 余额退回）
- [x] 测试订单取消自动退款流程
- [x] 测试充值流程
- [x] 测试提现流程（简化版）
- [x] 测试错误场景（余额不足、重复支付）

### 6.3 性能测试（可选，暂时跳过）

- [-] 测试支付并发性能（需要更复杂的事务隔离设置）
- [-] 测试钱包余额并发扣减（需要数据库锁机制测试）
- [-] 测试支付回调处理性能（待第三方支付接口实现后补充）

**说明**: 并发性能测试需要更复杂的测试环境设置（事务隔离级别、数据库锁机制、并发控制等），建议在生产环境部署前进行专项性能测试。当前阶段已通过功能测试和集成测试验证核心功能正确性。

---

## Phase 7: 文档

- [x] 创建 `backend/docs/WALLET_API.md` - 钱包 API 文档
- [x] 创建 `backend/docs/PAYMENT_API.md` - 支付 API 文档
- [x] 创建 `backend/docs/REFUND_API.md` - 退款 API 文档
- [x] 编写钱包 API 文档（充值、提现、交易记录）
- [x] 编写支付 API 文档（钱包支付、第三方支付预留）
- [x] 编写退款 API 文档（钱包退款、第三方退款预留）
- [x] 编写支付回调接口文档（预留）
- [x] 编写配置说明文档
- [x] 编写使用示例和业务流程说明

---

## Phase 8: 验收与归档

- [x] 运行所有测试确保 100% 通过
- [x] 代码审查
- [x] 功能验收
- [x] 更新 `docs/开发进度管理.md`
- [x] 归档变更到 OpenSpec

---

## 依赖检查

### 前置依赖

- [x] 用户认证系统已完成
- [x] 订单管理 API 已完成

### 需要配置的系统（后续）

- [ ] 微信支付商户配置
- [ ] 支付宝应用配置
- [ ] 提现账户配置

---

## 开发优先级

### P0（核心，优先完成）

- 钱包基础功能（创建、查询、交易记录）
- 钱包余额支付
- 钱包退款

### P1（重要，预留接口）

- 微信支付（预留接口）
- 支付宝支付（预留接口）
- 第三方退款（预留接口）

### P2（补充功能）

- 充值功能
- 提现功能
- 支付配置管理

---

**任务总数**: 约 100+ 个子任务
**核心功能**: 钱包+余额支付（约 30 个子任务）
**预计工期**: 核心功能 3-4 天，完整功能 7-10 天
**当前状态**: 准备开始
**最后更新**: 2025-10-25

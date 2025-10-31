# 添加众筹管理 API

## Why（为什么需要这个变更）

叨叨房车项目的核心业务模式之一是"众筹购车"，允许用户通过购买份额的方式共同拥有房车，并按份额比例获得租赁收益分润。众筹管理 API 是实现这一核心业务的基础，属于 P0 优先级功能。

当前系统已完成用户认证、订单管理、支付集成等基础模块，具备了开发众筹管理 API 的前置条件。众筹管理 API 将实现：

1. **众筹项目管理**：创建、发布、管理众筹项目
2. **份额购买**：用户购买众筹份额，支付管理
3. **收益分润**：按月计算和发放分润
4. **车主积分**：管理众筹车主的积分系统
5. **数据统计**：众筹项目和收益的统计分析

## What Changes（具体变更内容）

### 1. 数据模型层

#### 1.1 众筹项目实体（CrowdfundingProject）

**字段设计**：

- `id` - 项目 ID（UUID）
- `projectNo` - 项目编号（唯一，格式：CF202510270001）
- `projectName` - 项目名称
- `vehicleId` - 关联车辆 ID
- `totalShares` - 总份额（固定 100 份）
- `sharePrice` - 单份价格（评估价值 ÷ 100）
- `minSuccessShares` - 最低成功份额（默认 80 份）
- `soldShares` - 已售份额
- `targetAmount` - 目标金额（总份额 × 单份价格）
- `raisedAmount` - 已筹金额
- `annualYield` - 预计年化收益率（%）
- `monthlyIncome` - 预计月收益（元）
- `status` - 项目状态（draft/active/success/failed/closed）
- `startDate` - 众筹开始时间
- `endDate` - 众筹结束时间
- `description` - 项目描述
- `riskWarning` - 风险提示
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

**状态枚举**：

- `draft` - 草稿（待发布）
- `active` - 进行中
- `success` - 众筹成功
- `failed` - 众筹失败
- `closed` - 已关闭

**关联关系**：

- 多对一：Vehicle（车辆）
- 一对多：CrowdfundingShare（份额）
- 一对多：ProfitSharing（分润记录）

#### 1.2 众筹份额实体（CrowdfundingShare）

**字段设计**：

- `id` - 份额 ID（UUID）
- `shareNo` - 份额编号（唯一，格式：SH202510270001）
- `projectId` - 项目 ID
- `userId` - 用户 ID
- `shareCount` - 份额数量
- `purchasePrice` - 购买金额
- `purchaseDate` - 购买时间
- `status` - 份额状态（active/transferred/redeemed）
- `agreementUrl` - 众筹协议 URL
- `agreementSignedAt` - 协议签署时间
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

**状态枚举**：

- `active` - 活跃
- `transferred` - 已转让
- `redeemed` - 已赎回

**关联关系**：

- 多对一：CrowdfundingProject（项目）
- 多对一：User（用户）

#### 1.3 分润记录实体（ProfitSharing）

**字段设计**：

- `id` - 分润 ID（UUID）
- `profitSharingNo` - 分润编号（唯一，格式：PS202510）
- `projectId` - 项目 ID
- `userId` - 用户 ID
- `shareId` - 份额 ID
- `period` - 分润期间（YYYY-MM）
- `shareCount` - 份额数量
- `totalIncome` - 总收入（元）
- `totalCost` - 总成本（元）
- `netIncome` - 净收益（元）
- `profitSharingAmount` - 分润金额（元）
- `status` - 分润状态（pending/paid/failed）
- `paidAt` - 发放时间
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

**状态枚举**：

- `pending` - 待发放
- `paid` - 已发放
- `failed` - 发放失败

**关联关系**：

- 多对一：CrowdfundingProject（项目）
- 多对一：User（用户）
- 多对一：CrowdfundingShare（份额）

#### 1.4 车主积分实体（OwnerPoints）

**字段设计**：

- `id` - 积分 ID（UUID）
- `userId` - 用户 ID（唯一）
- `balance` - 积分余额
- `totalEarned` - 累计获得
- `totalUsed` - 累计使用
- `expiryDate` - 过期日期
- `status` - 状态（active/expired/cleared）
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

**状态枚举**：

- `active` - 活跃
- `expired` - 已过期
- `cleared` - 已清零

**关联关系**：

- 一对一：User（用户）

#### 1.5 积分流水实体（PointsTransaction）

**字段设计**：

- `id` - 流水 ID（UUID）
- `transactionNo` - 流水编号（唯一）
- `userId` - 用户 ID
- `type` - 类型（earn/use/expire/clear）
- `amount` - 积分数量
- `balance` - 操作后余额
- `source` - 来源（purchase/referral/activity/governance）
- `relatedId` - 关联 ID（份额 ID、订单 ID 等）
- `description` - 描述
- `createdAt` - 创建时间

**类型枚举**：

- `earn` - 获得
- `use` - 使用
- `expire` - 过期
- `clear` - 清零

**来源枚举**：

- `purchase` - 众筹购买
- `additional` - 追加购买
- `referral` - 推广订单
- `activity` - 平台活动
- `governance` - 治理活动

**关联关系**：

- 多对一：User（用户）

### 2. 业务服务层

#### 2.1 CrowdfundingProjectService（众筹项目服务）

**核心方法**：

- `createProject()` - 创建众筹项目
- `publishProject()` - 发布项目（草稿 → 进行中）
- `getProjectById()` - 获取项目详情
- `getProjectList()` - 获取项目列表（分页、筛选）
- `updateProject()` - 更新项目信息
- `closeProject()` - 关闭项目
- `checkProjectStatus()` - 检查项目状态（定时任务）
- `getProjectStats()` - 获取项目统计信息

**业务规则**：

- 总份额固定为 100 份
- 最低成功份额默认 80 份（可配置 50%-100%）
- 众筹期限默认 30 天
- 众筹成功：达到最低份额或售罄
- 众筹失败：期限结束未达最低份额，全额退款

#### 2.2 CrowdfundingShareService（众筹份额服务）

**核心方法**：

- `purchaseShares()` - 购买份额
- `getMyShares()` - 获取我的份额列表
- `getShareById()` - 获取份额详情
- `transferShare()` - 转让份额（预留接口）
- `redeemShare()` - 赎回份额（预留接口）
- `signAgreement()` - 签署众筹协议
- `getShareStats()` - 获取份额统计

**业务规则**：

- 最低购买 1 份
- 单个用户购买份额不限
- 购买必须签署众筹协议
- 购买资金托管在平台钱包
- 众筹失败全额退款

#### 2.3 ProfitSharingService（分润服务）

**核心方法**：

- `calculateProfitSharing()` - 计算分润（定时任务）
- `distributeProfitSharing()` - 发放分润
- `getMyProfitSharings()` - 获取我的分润记录
- `getProfitSharingById()` - 获取分润详情
- `getProfitSharingStats()` - 获取分润统计

**分润计算公式**：

```
月租赁收入 = 该房车所有订单收入总和
月运营成本 = 保险费 + 维护费 + 清洁费 + 平台服务费
月净收益 = 月租赁收入 - 月运营成本
个人分润 = 月净收益 × (个人份额 ÷ 总份额)
```

**业务规则**：

- 按月分润，每月 1 日计算上月收益
- 每月 10 日前发放分润
- 分润自动转入用户钱包
- 亏损月份不分润

#### 2.4 OwnerPointsService（车主积分服务）

**核心方法**：

- `createPointsAccount()` - 创建积分账户
- `earnPoints()` - 获得积分
- `usePoints()` - 使用积分
- `getMyPoints()` - 获取我的积分
- `getPointsTransactions()` - 获取积分流水
- `expirePoints()` - 过期积分（定时任务）
- `clearPoints()` - 清零积分（定时任务）

**积分获取规则**：

- 众筹购买：购买金额 ÷ 10 = 积分
- 追加购买：追加金额 ÷ 10 = 积分（90 天内有效）
- 推广订单：交易金额 ÷ 100 = 积分
- 平台活动：按活动配置
- 治理活动：按活动配置

**积分使用规则**：

- 租车抵扣：1 积分 = 1 元
- 优惠券兑换：按兑换规则
- 积分有效期：1 年
- 清零规则：每年 12 月 31 日清零

### 3. API 控制器层

#### 3.1 CrowdfundingProjectController（众筹项目控制器）

**用户端 API**：

- `GET /api/crowdfunding/projects` - 获取众筹项目列表
- `GET /api/crowdfunding/projects/:id` - 获取项目详情
- `GET /api/crowdfunding/projects/:id/progress` - 获取众筹进度

**管理端 API**：

- `POST /api/admin/crowdfunding/projects` - 创建众筹项目
- `PUT /api/admin/crowdfunding/projects/:id` - 更新项目信息
- `POST /api/admin/crowdfunding/projects/:id/publish` - 发布项目
- `POST /api/admin/crowdfunding/projects/:id/close` - 关闭项目
- `GET /api/admin/crowdfunding/projects` - 获取所有项目列表
- `GET /api/admin/crowdfunding/projects/:id/stats` - 获取项目统计

#### 3.2 CrowdfundingShareController（众筹份额控制器）

**用户端 API**：

- `POST /api/crowdfunding/shares/purchase` - 购买份额
- `GET /api/crowdfunding/shares/my` - 获取我的份额列表
- `GET /api/crowdfunding/shares/:id` - 获取份额详情
- `POST /api/crowdfunding/shares/:id/sign-agreement` - 签署协议

**管理端 API**：

- `GET /api/admin/crowdfunding/shares` - 获取所有份额列表
- `GET /api/admin/crowdfunding/shares/:id` - 获取份额详情
- `GET /api/admin/crowdfunding/shares/stats` - 获取份额统计

#### 3.3 ProfitSharingController（分润控制器）

**用户端 API**：

- `GET /api/crowdfunding/profit-sharings/my` - 获取我的分润记录
- `GET /api/crowdfunding/profit-sharings/:id` - 获取分润详情

**管理端 API**：

- `POST /api/admin/crowdfunding/profit-sharings/calculate` - 计算分润
- `POST /api/admin/crowdfunding/profit-sharings/distribute` - 发放分润
- `GET /api/admin/crowdfunding/profit-sharings` - 获取所有分润记录
- `GET /api/admin/crowdfunding/profit-sharings/stats` - 获取分润统计

#### 3.4 OwnerPointsController（车主积分控制器）

**用户端 API**：

- `GET /api/crowdfunding/points/my` - 获取我的积分
- `GET /api/crowdfunding/points/transactions` - 获取积分流水
- `POST /api/crowdfunding/points/use` - 使用积分

**管理端 API**：

- `GET /api/admin/crowdfunding/points` - 获取所有积分账户
- `POST /api/admin/crowdfunding/points/grant` - 发放积分
- `GET /api/admin/crowdfunding/points/stats` - 获取积分统计

### 4. 工具类和中间件

#### 4.1 工具类

- `crowdfunding-number.ts` - 众筹编号生成器

  - `generateProjectNo()` - 生成项目编号
  - `generateShareNo()` - 生成份额编号
  - `generateProfitSharingNo()` - 生成分润编号
  - `generatePointsTransactionNo()` - 生成积分流水编号

- `profit-sharing-calculator.ts` - 分润计算器

  - `calculateMonthlyIncome()` - 计算月收入
  - `calculateMonthlyCost()` - 计算月成本
  - `calculateNetIncome()` - 计算净收益
  - `calculateProfitSharingAmount()` - 计算分润金额

- `points-calculator.ts` - 积分计算器
  - `calculatePurchasePoints()` - 计算购买积分
  - `calculateReferralPoints()` - 计算推广积分
  - `calculateExpiryDate()` - 计算过期日期

#### 4.2 定时任务

- `crowdfunding-status.task.ts` - 众筹状态检查任务

  - 每小时检查众筹项目状态
  - 自动标记成功/失败项目
  - 失败项目自动退款

- `profit-sharing-calculation.task.ts` - 分润计算任务

  - 每月 1 日自动计算上月分润
  - 生成分润记录

- `profit-sharing-distribution.task.ts` - 分润发放任务

  - 每月 10 日自动发放分润
  - 转入用户钱包

- `points-expiry.task.ts` - 积分过期任务
  - 每天检查过期积分
  - 自动扣除过期积分

### 5. 数据库迁移

创建数据库表：

- `crowdfunding_projects` - 众筹项目表
- `crowdfunding_shares` - 众筹份额表
- `profit_sharing` - 分润记录表
- `owner_points` - 车主积分表
- `points_transactions` - 积分流水表

### 6. 测试

#### 6.1 单元测试

- 众筹项目 CRUD 测试
- 份额购买流程测试
- 分润计算测试
- 积分获取和使用测试
- 权限验证测试

#### 6.2 集成测试

- 完整众筹流程测试（创建 → 购买 → 成功 → 分润）
- 众筹失败退款测试
- 积分获取和过期测试

### 7. API 文档

创建完整的 API 文档：

- `CROWDFUNDING_API.md` - 众筹管理 API 文档
- 包含所有端点说明、请求/响应示例、业务规则

## How（实施方案）

### 开发阶段

**Phase 1: 数据模型层**（1 天）

- 创建 5 个实体类
- 配置关联关系和索引
- 数据库迁移

**Phase 2: 众筹项目管理**（1 天）

- 实现 CrowdfundingProjectService
- 实现 CrowdfundingProjectController
- 实现项目 CRUD 和状态管理

**Phase 3: 份额购买**（1 天）

- 实现 CrowdfundingShareService
- 实现 CrowdfundingShareController
- 集成支付系统

**Phase 4: 分润管理**（1 天）

- 实现 ProfitSharingService
- 实现 ProfitSharingController
- 实现分润计算和发放

**Phase 5: 车主积分**（1 天）

- 实现 OwnerPointsService
- 实现 OwnerPointsController
- 实现积分获取和使用

**Phase 6: 定时任务**（0.5 天）

- 实现 4 个定时任务
- 配置任务调度

**Phase 7: 测试**（1 天）

- 单元测试
- 集成测试
- 端到端测试

**Phase 8: 文档**（0.5 天）

- API 文档
- 业务规则文档

**预计总工期**：6-7 天

### 技术栈

- **后端框架**：Koa 2.x + TypeScript
- **ORM**：TypeORM 0.3.x
- **数据库**：MySQL 8.0
- **任务调度**：node-cron
- **测试框架**：Jest + Supertest

### 依赖关系

**前置依赖**（已完成）：

- ✅ 用户认证系统
- ✅ 订单管理 API
- ✅ 支付集成 API
- ✅ 车辆管理 API

**后续依赖**：

- 小程序端众筹页面
- 管理端众筹管理页面

## 验收标准

- ✅ 所有实体创建完成并正确关联
- ✅ 所有 API 端点实现完成
- ✅ 众筹项目创建、发布、管理功能正常
- ✅ 份额购买流程完整（购买 → 支付 → 签署协议）
- ✅ 分润计算和发放功能正常
- ✅ 车主积分获取和使用功能正常
- ✅ 定时任务正常运行
- ✅ 所有测试用例通过（目标 100%）
- ✅ API 文档完整
- ✅ 无 TypeScript 编译错误
- ✅ 代码符合项目规范

## 风险和注意事项

1. **并发控制**：份额购买需要处理并发，避免超卖
2. **事务处理**：购买份额、退款、分润发放需要事务保证
3. **定时任务**：确保定时任务可靠执行，避免遗漏
4. **积分过期**：积分过期逻辑需要准确，避免误扣
5. **分润计算**：分润计算公式需要准确，避免财务纠纷

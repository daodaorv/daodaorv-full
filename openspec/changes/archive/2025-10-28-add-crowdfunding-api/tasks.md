# Tasks: 众筹管理 API 开发

## 概述

本任务清单用于跟踪众筹管理 API 的开发进度。采用分阶段开发策略：

- **阶段 1**：数据模型层（实体、关联、迁移）
- **阶段 2**：众筹项目管理（创建、发布、管理）
- **阶段 3**：份额购买（购买、支付、协议）
- **阶段 4**：分润管理（计算、发放、查询）
- **阶段 5**：车主积分（获取、使用、过期）
- **阶段 6**：定时任务（状态检查、分润、积分过期）
- **阶段 7**：测试与文档

---

## Phase 1: 数据模型层 ✅

### 1.1 众筹项目实体 ✅

- [x] 创建 `backend/src/entities/CrowdfundingProject.ts` - 众筹项目实体
  - [x] 定义字段：id, projectNo, projectName, vehicleId
  - [x] 定义字段：totalShares, sharePrice, minSuccessShares, soldShares
  - [x] 定义字段：targetAmount, raisedAmount, annualYield, monthlyIncome
  - [x] 定义字段：status, startDate, endDate, description, riskWarning
  - [x] 定义 ProjectStatus 枚举（draft/active/success/failed/closed）
  - [x] 添加关联：Vehicle（多对一）
  - [x] 添加关联：CrowdfundingShare（一对多）
  - [x] 添加关联：Dividend（一对多）
  - [x] 添加索引：projectNo, vehicleId, status, startDate, endDate
  - [x] 添加计算属性：remainingShares, progress, isMinSuccessReached, isSoldOut, isEnded, remainingDays
- [x] 在 `database.ts` 中注册新实体

### 1.2 众筹份额实体 ✅

- [x] 创建 `backend/src/entities/CrowdfundingShare.ts` - 众筹份额实体
  - [x] 定义字段：id, shareNo, projectId, userId
  - [x] 定义字段：shareCount, purchasePrice, purchaseDate
  - [x] 定义字段：status, agreementUrl, agreementSignedAt
  - [x] 定义 ShareStatus 枚举（active/transferred/redeemed）
  - [x] 添加关联：CrowdfundingProject（多对一）
  - [x] 添加关联：User（多对一）
  - [x] 添加关联：ProfitSharing（一对多）
  - [x] 添加索引：shareNo, projectId, userId, purchaseDate
  - [x] 添加计算属性：isAgreementSigned, pricePerShare
- [x] 在 `database.ts` 中注册新实体

### 1.3 分润记录实体 ✅

- [x] 创建 `backend/src/entities/ProfitSharing.ts` - 分润记录实体
  - [x] 定义字段：id, profitSharingNo, projectId, userId, shareId
  - [x] 定义字段：period, shareCount, totalIncome, totalCost, netIncome
  - [x] 定义字段：profitSharingAmount, status, paidAt
  - [x] 定义 ProfitSharingStatus 枚举（pending/paid/failed）
  - [x] 添加关联：CrowdfundingProject（多对一）
  - [x] 添加关联：User（多对一）
  - [x] 添加关联：CrowdfundingShare（多对一）
  - [x] 添加索引：profitSharingNo, projectId, userId, period, status
  - [x] 添加计算属性：isPaid, yieldRate, profitSharingRatio
- [x] 在 `database.ts` 中注册新实体

### 1.4 车主积分实体 ✅

- [x] 创建 `backend/src/entities/OwnerPoints.ts` - 车主积分实体
  - [x] 定义字段：id, userId, balance, totalEarned, totalUsed
  - [x] 定义字段：expiryDate, status
  - [x] 定义 PointsStatus 枚举（active/expired/cleared）
  - [x] 添加关联：User（一对一）
  - [x] 添加关联：PointsTransaction（一对多）
  - [x] 添加索引：userId（唯一）, status, expiryDate
  - [x] 添加计算属性：isExpired, isActive, remainingDays
- [x] 在 `database.ts` 中注册新实体

### 1.5 积分流水实体 ✅

- [x] 创建 `backend/src/entities/PointsTransaction.ts` - 积分流水实体
  - [x] 定义字段：id, transactionNo, userId, type, amount, balance
  - [x] 定义字段：source, relatedId, description
  - [x] 定义 TransactionType 枚举（earn/use/expire/clear）
  - [x] 定义 PointsSource 枚举（purchase/additional/referral/activity/governance）
  - [x] 添加关联：User（多对一）
  - [x] 添加索引：transactionNo, userId, type, source, createdAt
  - [x] 添加计算属性：isEarn, isUse, isExpire, isClear, change
- [x] 在 `database.ts` 中注册新实体

### 1.6 数据库迁移 ✅

- [x] TypeScript 编译检查通过（无错误）
- [ ] 运行迁移创建表结构（需要启动应用）
- [ ] 验证表结构和索引（需要启动应用）

---

## Phase 2: 众筹项目管理 ✅

### 2.1 工具类 ✅

- [x] 创建 `backend/src/utils/crowdfunding-number.ts` - 众筹编号生成器
  - [x] 实现 `generateProjectNo()` - 生成项目编号（CF202510270001）
  - [x] 实现 `generateShareNo()` - 生成份额编号（SH202510270001）
  - [x] 实现 `generateProfitSharingNo()` - 生成分润编号（PS202510）
  - [x] 实现 `generatePointsTransactionNo()` - 生成积分流水编号
  - [x] 实现 `generateNextProjectNo()` - 异步生成下一个项目编号
  - [x] 实现 `generateNextShareNo()` - 异步生成下一个份额编号
  - [x] 实现 `generateNextPointsTransactionNo()` - 异步生成下一个积分流水编号
  - [x] 实现 `parseProjectNo()` - 解析项目编号
  - [x] 实现 `parseShareNo()` - 解析份额编号
  - [x] 实现 `parseProfitSharingNo()` - 解析分润编号
  - [x] 实现 `parsePointsTransactionNo()` - 解析积分流水编号

### 2.2 众筹项目服务 ✅

- [x] 创建 `backend/src/services/crowdfunding-project.service.ts` - 众筹项目服务
- [x] 实现 `createProject()` - 创建众筹项目
  - [x] 验证车辆是否存在
  - [x] 验证车辆是否已有众筹项目
  - [x] 生成项目编号
  - [x] 计算目标金额
  - [x] 创建项目记录（状态：draft）
- [x] 实现 `publishProject()` - 发布项目
  - [x] 验证项目状态（必须是 draft）
  - [x] 验证日期有效性
  - [x] 更新状态为 active
  - [x] 设置开始时间和结束时间
- [x] 实现 `getProjectById()` - 获取项目详情
  - [x] 关联查询车辆信息
  - [x] 关联查询车型信息
  - [x] 使用实体计算属性（剩余份额、众筹进度）
- [x] 实现 `getProjectList()` - 获取项目列表
  - [x] 支持分页
  - [x] 支持筛选（状态、车辆类型、关键词）
  - [x] 支持排序（创建时间、众筹进度、开始时间）
- [x] 实现 `updateProject()` - 更新项目信息
  - [x] 验证项目状态（只能更新 draft 状态）
  - [x] 更新项目信息
  - [x] 自动重新计算目标金额
- [x] 实现 `closeProject()` - 关闭项目
  - [x] 验证项目状态
  - [x] 更新状态为 closed
- [x] 实现 `checkProjectStatus()` - 检查项目状态
  - [x] 检查是否售罄
  - [x] 检查众筹期限
  - [x] 检查已售份额
  - [x] 自动标记成功/失败
- [x] 实现 `getProjectStats()` - 获取项目统计
  - [x] 统计总项目数
  - [x] 统计各状态项目数
  - [x] 统计总筹资金额

### 2.3 众筹项目控制器 ✅

- [x] 创建 `backend/src/controllers/crowdfunding-project.controller.ts` - 众筹项目控制器
- [x] 实现 `getProjects` - 获取众筹项目列表（用户端）
- [x] 实现 `getProjectById` - 获取项目详情（用户端）
- [x] 实现 `getProjectProgress` - 获取众筹进度（用户端）
- [x] 实现 `createProject` - 创建众筹项目（管理端）
- [x] 实现 `updateProject` - 更新项目信息（管理端）
- [x] 实现 `publishProject` - 发布项目（管理端）
- [x] 实现 `closeProject` - 关闭项目（管理端）
- [x] 实现 `getAllProjects` - 获取所有项目列表（管理端）
- [x] 实现 `getProjectStats` - 获取项目统计（管理端）

### 2.4 路由配置 ✅

- [x] 在 `backend/src/routes/index.ts` 中添加众筹项目路由
- [x] 用户端路由（需要登录）
  - [x] GET /api/crowdfunding/projects - 获取众筹项目列表
  - [x] GET /api/crowdfunding/projects/:id - 获取项目详情
  - [x] GET /api/crowdfunding/projects/:id/progress - 获取众筹进度
- [x] 管理端路由（需要管理员权限）
  - [x] POST /api/admin/crowdfunding/projects - 创建众筹项目
  - [x] PUT /api/admin/crowdfunding/projects/:id - 更新项目信息
  - [x] POST /api/admin/crowdfunding/projects/:id/publish - 发布项目
  - [x] POST /api/admin/crowdfunding/projects/:id/close - 关闭项目
  - [x] GET /api/admin/crowdfunding/projects - 获取所有项目列表
  - [x] GET /api/admin/crowdfunding/projects/stats - 获取项目统计

### 2.5 编译检查 ✅

- [x] TypeScript 编译检查通过（无错误）

---

## Phase 3: 份额购买 ✅

### 3.1 众筹份额服务 ✅

- [x] 创建 `backend/src/services/crowdfunding-share.service.ts` - 众筹份额服务
- [x] 实现 `purchaseShares()` - 购买份额
  - [x] 验证项目状态（必须是 active）
  - [x] 验证剩余份额
  - [x] 计算购买金额
  - [x] 验证用户钱包余额并扣款（调用 WalletService.consume）
  - [x] 生成份额编号
  - [x] 创建份额记录
  - [x] 更新项目已售份额和已筹金额
  - [x] 创建或更新积分账户
  - [x] 发放购买积分（购买金额 ÷ 10）
  - [x] 创建积分流水记录
  - [x] 事务处理（使用 QueryRunner）
- [x] 实现 `getMyShares()` - 获取我的份额列表
  - [x] 关联查询项目信息
  - [x] 关联查询车辆和车型信息
  - [x] 支持分页
  - [x] 支持筛选（项目状态）
- [x] 实现 `getShareById()` - 获取份额详情
  - [x] 关联查询项目、车辆、车型、用户信息
- [ ] 实现 `transferShare()` - 转让份额（预留接口，未实现）
- [ ] 实现 `redeemShare()` - 赎回份额（预留接口，未实现）
- [x] 实现 `signAgreement()` - 签署众筹协议
  - [x] 验证份额存在性
  - [x] 验证协议未签署
  - [x] 更新协议 URL 和签署时间
- [x] 实现 `getShareStats()` - 获取份额统计
  - [x] 统计总份额数
  - [x] 统计总购买金额
  - [x] 统计各状态份额数
- [x] 实现 `getAllShares()` - 获取所有份额列表（管理端）
  - [x] 支持分页
  - [x] 支持筛选（状态、项目 ID、用户 ID）
- [x] 实现私有方法 `createOrUpdatePointsAccount()` - 创建或更新积分账户
- [x] 实现私有方法 `generateShareNo()` - 生成份额编号
- [x] 实现私有方法 `generatePointsTransactionNo()` - 生成积分流水编号

### 3.2 众筹份额控制器 ✅

- [x] 创建 `backend/src/controllers/crowdfunding-share.controller.ts` - 众筹份额控制器
- [x] 实现 `purchaseShares` - 购买份额（用户端）
  - [x] 参数验证（项目 ID、份额数量）
  - [x] 获取当前用户 ID
- [x] 实现 `getMyShares` - 获取我的份额列表（用户端）
  - [x] 获取当前用户 ID
  - [x] 支持分页和筛选
- [x] 实现 `getShareById` - 获取份额详情（用户端）
  - [x] 验证份额所有权
- [x] 实现 `signAgreement` - 签署协议（用户端）
  - [x] 参数验证（协议 URL）
  - [x] 验证份额所有权
- [x] 实现 `getAllShares` - 获取所有份额列表（管理端）
- [x] 实现 `getShareDetails` - 获取份额详情（管理端）
- [x] 实现 `getShareStats` - 获取份额统计（管理端）

### 3.3 路由配置 ✅

- [x] 在 `backend/src/routes/index.ts` 中添加众筹份额路由
- [x] 用户端路由（需要登录）
  - [x] POST /api/crowdfunding/shares/purchase - 购买份额
  - [x] GET /api/crowdfunding/shares/my - 获取我的份额列表
  - [x] GET /api/crowdfunding/shares/:id - 获取份额详情
  - [x] POST /api/crowdfunding/shares/:id/sign-agreement - 签署协议
- [x] 管理端路由（需要管理员权限）
  - [x] GET /api/admin/crowdfunding/shares - 获取所有份额列表
  - [x] GET /api/admin/crowdfunding/shares/:id - 获取份额详情
  - [x] GET /api/admin/crowdfunding/shares/stats - 获取份额统计

### 3.4 编译检查 ✅

- [x] TypeScript 编译检查通过（无错误）

---

## Phase 4: 分润管理 ✅

### 4.1 分润计算器 ✅

- [x] 创建 `backend/src/utils/profit-sharing-calculator.ts` - 分润计算器
  - [x] 实现 `calculateMonthlyIncome()` - 计算月收入
  - [x] 实现 `calculateMonthlyCost()` - 计算月成本
  - [x] 实现 `calculateNetIncome()` - 计算净收益
  - [x] 实现 `calculateProfitSharingAmount()` - 计算分润金额
  - [x] 实现 `calculateProfitSharing()` - 计算完整分润数据
  - [x] 实现 `calculatePlatformServiceFee()` - 计算平台服务费（默认 5%）
  - [x] 实现 `validateProfitSharingParams()` - 验证分润参数
  - [x] 实现 `formatProfitSharingPeriod()` - 格式化分润期间（YYYY-MM）
  - [x] 实现 `parseProfitSharingPeriod()` - 解析分润期间
  - [x] 实现 `getLastMonthPeriod()` - 获取上个月期间
  - [x] 实现 `getPeriodDateRange()` - 获取期间日期范围

### 4.2 分润服务 ✅

- [x] 创建 `backend/src/services/profit-sharing.service.ts` - 分润服务
- [x] 实现 `calculateProfitSharing()` - 计算分润
  - [x] 验证项目状态（必须是 success）
  - [x] 检查是否已计算过该期间
  - [x] 查询该期间的订单收入（使用 QueryBuilder）
  - [x] 计算成本（保险费、维护费、清洁费、平台服务费 5%）
  - [x] 计算净收益
  - [x] 为每个活跃份额创建分润记录
  - [x] 生成分润编号
  - [x] 事务处理（使用 QueryRunner）
- [x] 实现 `distributeProfitSharing()` - 发放分润
  - [x] 查询待发放的分润记录
  - [x] 转入用户钱包（使用 WalletService.adjustBalance）
  - [x] 更新分润状态为 PAID
  - [x] 记录发放时间
  - [x] 错误处理（标记为 FAILED）
- [x] 实现 `getMyProfitSharings()` - 获取我的分润记录
  - [x] 关联查询项目和份额信息
  - [x] 支持分页
  - [x] 支持筛选（期间、状态）
  - [x] 按期间倒序排列
- [x] 实现 `getProfitSharingById()` - 获取分润详情
  - [x] 关联查询项目、车辆、份额、用户信息
- [x] 实现 `getProfitSharingStats()` - 获取分润统计
  - [x] 统计总分润数
  - [x] 统计总分润金额（仅已发放）
  - [x] 按状态统计（待发放、已发放、失败）
- [x] 实现 `getAllProfitSharings()` - 获取所有分润记录（管理端）
  - [x] 支持分页
  - [x] 支持筛选（期间、状态、项目 ID）

### 4.3 分润控制器 ✅

- [x] 创建 `backend/src/controllers/profit-sharing.controller.ts` - 分润控制器
- [x] 实现 `getMyProfitSharings` - 获取我的分润记录（用户端）
  - [x] 获取当前用户 ID
  - [x] 支持分页和筛选
- [x] 实现 `getProfitSharingById` - 获取分润详情（用户端）
  - [x] 验证分润所有权
- [x] 实现 `calculateProfitSharing` - 计算分润（管理端）
  - [x] 参数验证（项目 ID、期间）
  - [x] 期间格式验证（YYYY-MM）
- [x] 实现 `distributeProfitSharing` - 发放分润（管理端）
  - [x] 参数验证（期间）
  - [x] 期间格式验证（YYYY-MM）
- [x] 实现 `getAllProfitSharings` - 获取所有分润记录（管理端）
- [x] 实现 `getProfitSharingStats` - 获取分润统计（管理端）

### 4.4 路由配置 ✅

- [x] 在 `backend/src/routes/index.ts` 中添加分润路由
- [x] 用户端路由（需要登录）
  - [x] GET /api/crowdfunding/profit-sharings/my - 获取我的分润记录
  - [x] GET /api/crowdfunding/profit-sharings/:id - 获取分润详情
- [x] 管理端路由（需要管理员权限）
  - [x] POST /api/admin/crowdfunding/profit-sharings/calculate - 计算分润
  - [x] POST /api/admin/crowdfunding/profit-sharings/distribute - 发放分润
  - [x] GET /api/admin/crowdfunding/profit-sharings - 获取所有分润记录
  - [x] GET /api/admin/crowdfunding/profit-sharings/stats - 获取分润统计

### 4.5 编译检查 ✅

- [x] TypeScript 编译检查通过（无错误）

---

## Phase 5: 车主积分

### 5.1 积分计算器

- [ ] 创建 `backend/src/utils/points-calculator.ts` - 积分计算器
  - [ ] 实现 `calculatePurchasePoints()` - 计算购买积分（金额 ÷ 10）
  - [ ] 实现 `calculateReferralPoints()` - 计算推广积分（金额 ÷ 100）
  - [ ] 实现 `calculateExpiryDate()` - 计算过期日期（1 年后）

### 5.2 车主积分服务

- [ ] 创建 `backend/src/services/owner-points.service.ts` - 车主积分服务
- [ ] 实现 `createPointsAccount()` - 创建积分账户
- [ ] 实现 `earnPoints()` - 获得积分
  - [ ] 验证积分账户
  - [ ] 计算积分数量
  - [ ] 更新积分余额和累计获得
  - [ ] 创建积分流水
  - [ ] 事务处理
- [ ] 实现 `usePoints()` - 使用积分
  - [ ] 验证积分余额
  - [ ] 扣除积分
  - [ ] 更新累计使用
  - [ ] 创建积分流水
  - [ ] 事务处理
- [ ] 实现 `getMyPoints()` - 获取我的积分
- [ ] 实现 `getPointsTransactions()` - 获取积分流水
  - [ ] 支持分页
  - [ ] 支持筛选（类型、来源）
- [ ] 实现 `expirePoints()` - 过期积分
  - [ ] 查询过期的积分账户
  - [ ] 扣除过期积分
  - [ ] 创建过期流水
  - [ ] 更新账户状态
- [ ] 实现 `clearPoints()` - 清零积分
  - [ ] 查询需要清零的积分账户
  - [ ] 清零积分余额
  - [ ] 创建清零流水
  - [ ] 更新账户状态

### 5.3 车主积分控制器

- [ ] 创建 `backend/src/controllers/owner-points.controller.ts` - 车主积分控制器
- [ ] 实现 `getMyPoints` - 获取我的积分（用户端）
- [ ] 实现 `getPointsTransactions` - 获取积分流水（用户端）
- [ ] 实现 `usePoints` - 使用积分（用户端）
- [ ] 实现 `getAllPoints` - 获取所有积分账户（管理端）
- [ ] 实现 `grantPoints` - 发放积分（管理端）
- [ ] 实现 `getPointsStats` - 获取积分统计（管理端）

---

## Phase 6: 定时任务

### 6.1 众筹状态检查任务

- [ ] 创建 `backend/src/tasks/crowdfunding-status.task.ts` - 众筹状态检查任务
  - [ ] 配置定时任务（每小时执行）
  - [ ] 查询进行中的众筹项目
  - [ ] 检查众筹期限
  - [ ] 检查已售份额
  - [ ] 自动标记成功/失败
  - [ ] 失败项目自动退款

### 6.2 分润计算任务

- [ ] 创建 `backend/src/tasks/profit-sharing-calculation.task.ts` - 分润计算任务
  - [ ] 配置定时任务（每月 1 日执行）
  - [ ] 调用 ProfitSharingService.calculateProfitSharing()
  - [ ] 记录执行日志

### 6.3 分润发放任务

- [ ] 创建 `backend/src/tasks/profit-sharing-distribution.task.ts` - 分润发放任务
  - [ ] 配置定时任务（每月 10 日执行）
  - [ ] 调用 ProfitSharingService.distributeProfitSharing()
  - [ ] 记录执行日志

### 6.4 积分过期任务

- [ ] 创建 `backend/src/tasks/points-expiry.task.ts` - 积分过期任务
  - [ ] 配置定时任务（每天执行）
  - [ ] 调用 ShareholderPointsService.expirePoints()
  - [ ] 记录执行日志

---

## Phase 7: 路由配置

- [ ] 在 `backend/src/routes/index.ts` 中添加众筹管理路由

**用户端路由**（需要登录）：

- [ ] GET /api/crowdfunding/projects - 获取众筹项目列表
- [ ] GET /api/crowdfunding/projects/:id - 获取项目详情
- [ ] GET /api/crowdfunding/projects/:id/progress - 获取众筹进度
- [ ] POST /api/crowdfunding/shares/purchase - 购买份额
- [ ] GET /api/crowdfunding/shares/my - 获取我的份额列表
- [ ] GET /api/crowdfunding/shares/:id - 获取份额详情
- [ ] POST /api/crowdfunding/shares/:id/sign-agreement - 签署协议
- [ ] GET /api/crowdfunding/profit-sharings/my - 获取我的分润记录
- [ ] GET /api/crowdfunding/profit-sharings/:id - 获取分润详情
- [ ] GET /api/crowdfunding/points/my - 获取我的积分
- [ ] GET /api/crowdfunding/points/transactions - 获取积分流水
- [ ] POST /api/crowdfunding/points/use - 使用积分

**管理端路由**（需要管理员权限）：

- [ ] POST /api/admin/crowdfunding/projects - 创建众筹项目
- [ ] PUT /api/admin/crowdfunding/projects/:id - 更新项目信息
- [ ] POST /api/admin/crowdfunding/projects/:id/publish - 发布项目
- [ ] POST /api/admin/crowdfunding/projects/:id/close - 关闭项目
- [ ] GET /api/admin/crowdfunding/projects - 获取所有项目列表
- [ ] GET /api/admin/crowdfunding/projects/:id/stats - 获取项目统计
- [ ] GET /api/admin/crowdfunding/shares - 获取所有份额列表
- [ ] GET /api/admin/crowdfunding/shares/:id - 获取份额详情
- [ ] GET /api/admin/crowdfunding/shares/stats - 获取份额统计
- [ ] POST /api/admin/crowdfunding/profit-sharings/calculate - 计算分润
- [ ] POST /api/admin/crowdfunding/profit-sharings/distribute - 发放分润
- [ ] GET /api/admin/crowdfunding/profit-sharings - 获取所有分润记录
- [ ] GET /api/admin/crowdfunding/profit-sharings/stats - 获取分润统计
- [ ] GET /api/admin/crowdfunding/points - 获取所有积分账户
- [ ] POST /api/admin/crowdfunding/points/grant - 发放积分
- [ ] GET /api/admin/crowdfunding/points/stats - 获取积分统计

---

## Phase 8: 测试

### 8.1 单元测试

- [ ] 创建 `backend/tests/crowdfunding-project.test.ts` - 众筹项目测试

  - [ ] 测试创建项目
  - [ ] 测试发布项目
  - [ ] 测试获取项目列表
  - [ ] 测试获取项目详情
  - [ ] 测试更新项目
  - [ ] 测试关闭项目
  - [ ] 测试权限验证

- [ ] 创建 `backend/tests/crowdfunding-share.test.ts` - 众筹份额测试

  - [ ] 测试购买份额
  - [ ] 测试余额不足（失败）
  - [ ] 测试份额不足（失败）
  - [ ] 测试获取我的份额
  - [ ] 测试签署协议
  - [ ] 测试权限验证

- [ ] 创建 `backend/tests/profit-sharing.test.ts` - 分润测试

  - [ ] 测试计算分润
  - [ ] 测试发放分润
  - [ ] 测试获取分润记录
  - [ ] 测试分润统计
  - [ ] 测试权限验证

- [ ] 创建 `backend/tests/owner-points.test.ts` - 车主积分测试
  - [ ] 测试创建积分账户
  - [ ] 测试获得积分
  - [ ] 测试使用积分
  - [ ] 测试积分不足（失败）
  - [ ] 测试积分过期
  - [ ] 测试积分清零
  - [ ] 测试权限验证

### 8.2 集成测试

- [ ] 创建 `backend/tests/crowdfunding-integration.test.ts` - 众筹集成测试
  - [ ] 测试完整众筹流程（创建 → 发布 → 购买 → 成功 → 分润）
  - [ ] 测试众筹失败退款流程
  - [ ] 测试积分获取和使用流程
  - [ ] 测试并发购买份额

---

## Phase 9: 文档

- [ ] 创建 `backend/docs/CROWDFUNDING_API.md` - 众筹管理 API 文档
- [ ] 编写用户端 API 文档
  - [ ] 众筹项目 API
  - [ ] 份额购买 API
  - [ ] 分润查询 API
  - [ ] 积分管理 API
- [ ] 编写管理端 API 文档
  - [ ] 项目管理 API
  - [ ] 份额管理 API
  - [ ] 分润管理 API
  - [ ] 积分管理 API
- [ ] 编写业务规则说明
- [ ] 编写使用示例和最佳实践
- [ ] 编写错误码说明

---

## Phase 10: 验收与归档

- [ ] 运行所有测试确保 100% 通过
- [ ] 代码审查
- [ ] 功能验收
- [ ] 更新 `docs/开发进度管理.md`
- [ ] 归档变更到 OpenSpec

---

## 依赖检查

### 前置依赖

- [x] 用户认证系统已完成
- [x] 订单管理 API 已完成
- [x] 支付集成 API 已完成
- [x] 车辆管理 API 已完成

### 需要安装的依赖

- [ ] `node-cron` - 定时任务调度
- [ ] `@types/node-cron` - TypeScript 类型定义

---

## 开发优先级

### P0（核心，必须完成）

- 数据模型层（5 个实体）
- 众筹项目管理（创建、发布、查询）
- 份额购买（购买、支付、协议）
- 分润管理（计算、发放）
- 车主积分（获得、使用）

### P1（重要，尽量完成）

- 定时任务（状态检查、分润、积分过期）
- 统计功能
- 完整测试

### P2（可选，预留接口）

- 份额转让
- 份额赎回
- 积分兑换优惠券

---

**任务总数**: 约 150 个子任务
**核心功能**: 众筹项目 + 份额购买 + 分润管理（约 80 个子任务）
**预计工期**: 核心功能 4 天，完整功能 6-7 天
**当前状态**: Phase 4 完成，术语合规性修正完成
**最后更新**: 2025-10-27

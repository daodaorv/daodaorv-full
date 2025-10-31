# 众筹管理 API 文档

## 概述

众筹管理 API 提供了完整的房车众筹功能，包括：

- 众筹项目管理（创建、发布、查询）
- 份额购买（购买、签署协议）
- 分润管理（计算、发放、查询）
- 车主积分（获取、使用、查询）

## 基础信息

- **Base URL**: `/api`
- **认证方式**: JWT Token（Header: `Authorization: Bearer <token>`）
- **响应格式**: JSON

## 用户端 API

### 1. 众筹项目

#### 1.1 获取众筹项目列表

```
GET /crowdfunding/projects
```

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20 |
| status | string | 否 | 项目状态：draft/active/success/failed/closed |
| keyword | string | 否 | 搜索关键词（项目名称） |

**响应示例**：

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "projects": [
      {
        "id": "uuid",
        "projectNo": "CF202510270001",
        "projectName": "豪华房车众筹项目",
        "vehicleId": "uuid",
        "totalShares": 100,
        "sharePrice": 5000,
        "soldShares": 60,
        "remainingShares": 40,
        "targetAmount": 500000,
        "raisedAmount": 300000,
        "progress": 60,
        "status": "active",
        "startDate": "2025-10-27",
        "endDate": "2025-11-26",
        "remainingDays": 30
      }
    ],
    "total": 10
  }
}
```

#### 1.2 获取项目详情

```
GET /crowdfunding/projects/:id
```

**响应示例**：

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "id": "uuid",
    "projectNo": "CF202510270001",
    "projectName": "豪华房车众筹项目",
    "description": "项目描述",
    "riskWarning": "风险提示",
    "vehicle": {
      "id": "uuid",
      "licensePlate": "京A12345",
      "model": {
        "name": "大通RV80",
        "brand": "上汽大通"
      }
    },
    "totalShares": 100,
    "sharePrice": 5000,
    "soldShares": 60,
    "remainingShares": 40,
    "minSuccessShares": 80,
    "targetAmount": 500000,
    "raisedAmount": 300000,
    "annualYield": 12.5,
    "monthlyIncome": 5000,
    "status": "active",
    "startDate": "2025-10-27",
    "endDate": "2025-11-26"
  }
}
```

#### 1.3 获取众筹进度

```
GET /crowdfunding/projects/:id/progress
```

**响应示例**：

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "projectId": "uuid",
    "totalShares": 100,
    "soldShares": 60,
    "remainingShares": 40,
    "progress": 60,
    "targetAmount": 500000,
    "raisedAmount": 300000,
    "isMinSuccessReached": false,
    "isSoldOut": false,
    "remainingDays": 30
  }
}
```

### 2. 份额购买

#### 2.1 购买份额

```
POST /crowdfunding/shares/purchase
```

**请求体**：

```json
{
  "projectId": "uuid",
  "shareCount": 10
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "份额购买成功",
  "data": {
    "id": "uuid",
    "shareNo": "SH202510270001",
    "projectId": "uuid",
    "userId": "uuid",
    "shareCount": 10,
    "purchasePrice": 50000,
    "purchaseDate": "2025-10-27T10:00:00Z",
    "status": "active"
  }
}
```

#### 2.2 获取我的份额列表

```
GET /crowdfunding/shares/my
```

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20 |
| status | string | 否 | 份额状态：active/transferred/redeemed |

**响应示例**：

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "shares": [
      {
        "id": "uuid",
        "shareNo": "SH202510270001",
        "project": {
          "projectNo": "CF202510270001",
          "projectName": "豪华房车众筹项目",
          "status": "success"
        },
        "shareCount": 10,
        "purchasePrice": 50000,
        "purchaseDate": "2025-10-27T10:00:00Z",
        "status": "active",
        "isAgreementSigned": true
      }
    ],
    "total": 5
  }
}
```

#### 2.3 获取份额详情

```
GET /crowdfunding/shares/:id
```

#### 2.4 签署众筹协议

```
POST /crowdfunding/shares/:id/sign-agreement
```

**请求体**：

```json
{
  "agreementUrl": "https://example.com/agreement.pdf"
}
```

### 3. 分润记录

#### 3.1 获取我的分润记录

```
GET /crowdfunding/profit-sharings/my
```

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20 |
| period | string | 否 | 期间，格式：YYYY-MM |
| status | string | 否 | 状态：pending/paid/failed |

**响应示例**：

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "profitSharings": [
      {
        "id": "uuid",
        "profitSharingNo": "PS202510",
        "period": "2025-10",
        "project": {
          "projectNo": "CF202510270001",
          "projectName": "豪华房车众筹项目"
        },
        "shareCount": 10,
        "totalIncome": 10000,
        "totalCost": 2000,
        "netIncome": 8000,
        "profitSharingAmount": 800,
        "status": "paid",
        "paidAt": "2025-11-10T03:00:00Z"
      }
    ],
    "total": 12
  }
}
```

#### 3.2 获取分润详情

```
GET /crowdfunding/profit-sharings/:id
```

### 4. 车主积分

#### 4.1 获取我的积分

```
GET /crowdfunding/points/my
```

**响应示例**：

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "balance": 5000,
    "totalEarned": 10000,
    "totalUsed": 5000,
    "expiryDate": "2026-10-27",
    "status": "active",
    "isActive": true,
    "remainingDays": 365
  }
}
```

#### 4.2 获取积分流水

```
GET /crowdfunding/points/transactions
```

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20 |
| type | string | 否 | 类型：earn/use/expire/clear |
| source | string | 否 | 来源：purchase/additional/referral/activity/governance |

**响应示例**：

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "transactionNo": "PT20251027000001",
        "type": "earn",
        "amount": 5000,
        "balance": 5000,
        "source": "purchase",
        "description": "众筹购买获得积分",
        "createdAt": "2025-10-27T10:00:00Z"
      }
    ],
    "total": 20
  }
}
```

#### 4.3 使用积分

```
POST /crowdfunding/points/use
```

**请求体**：

```json
{
  "points": 1000,
  "relatedId": "order_uuid",
  "description": "租车抵扣"
}
```

## 管理端 API

### 1. 众筹项目管理

#### 1.1 创建众筹项目

```
POST /admin/crowdfunding/projects
```

**请求体**：

```json
{
  "projectName": "豪华房车众筹项目",
  "vehicleId": "uuid",
  "sharePrice": 5000,
  "minSuccessShares": 80,
  "annualYield": 12.5,
  "monthlyIncome": 5000,
  "description": "项目描述",
  "riskWarning": "风险提示"
}
```

#### 1.2 更新项目信息

```
PUT /admin/crowdfunding/projects/:id
```

#### 1.3 发布项目

```
POST /admin/crowdfunding/projects/:id/publish
```

**请求体**：

```json
{
  "startDate": "2025-10-27",
  "endDate": "2025-11-26"
}
```

#### 1.4 关闭项目

```
POST /admin/crowdfunding/projects/:id/close
```

#### 1.5 获取所有项目列表

```
GET /admin/crowdfunding/projects
```

#### 1.6 获取项目统计

```
GET /admin/crowdfunding/projects/stats
```

### 2. 份额管理

#### 2.1 获取所有份额列表

```
GET /admin/crowdfunding/shares
```

#### 2.2 获取份额详情

```
GET /admin/crowdfunding/shares/:id
```

#### 2.3 获取份额统计

```
GET /admin/crowdfunding/shares/stats
```

### 3. 分润管理

#### 3.1 计算分润

```
POST /admin/crowdfunding/profit-sharings/calculate
```

**请求体**：

```json
{
  "projectId": "uuid",
  "period": "2025-10"
}
```

#### 3.2 发放分润

```
POST /admin/crowdfunding/profit-sharings/distribute
```

**请求体**：

```json
{
  "period": "2025-10"
}
```

#### 3.3 获取所有分润记录

```
GET /admin/crowdfunding/profit-sharings
```

#### 3.4 获取分润统计

```
GET /admin/crowdfunding/profit-sharings/stats
```

### 4. 车主积分管理

#### 4.1 获取所有积分账户

```
GET /admin/crowdfunding/points
```

#### 4.2 获取积分统计

```
GET /admin/crowdfunding/points/stats
```

#### 4.3 获取用户积分详情

```
GET /admin/crowdfunding/points/:userId
```

#### 4.4 获取用户积分流水

```
GET /admin/crowdfunding/points/:userId/transactions
```

#### 4.5 发放积分

```
POST /admin/crowdfunding/points/grant
```

**请求体**：

```json
{
  "userId": "uuid",
  "amount": 10000,
  "source": "activity",
  "description": "平台活动奖励",
  "ratio": 10
}
```

## 业务规则

### 众筹规则

1. **总份额**: 固定 100 份
2. **份额价格**: 车辆评估价值 ÷ 100
3. **众筹期限**: 默认 30 天
4. **最低成功份额**: 80 份（可配置 50%-100%）
5. **众筹成功**: 售罄或期限到达且达到最低成功份额
6. **众筹失败**: 期限到达但未达到最低成功份额，自动退款

### 分润规则

1. **分润周期**: 每月
2. **计算时间**: 每月 1 日凌晨 2 点
3. **发放时间**: 每月 10 日凌晨 3 点
4. **分润计算**: (月收入 - 月成本) × 份额比例
5. **平台服务费**: 5%

### 积分规则

1. **获取积分**:
   - 众筹购买: 购买金额 ÷ 10
   - 追加购买: 追加金额 ÷ 10（90天有效）
   - 推广订单: 交易金额 ÷ 100
   - 平台活动: 按活动配置
   - 治理活动: 按活动配置

2. **使用积分**:
   - 租车抵扣: 1 积分 = 1 元
   - 优惠券兑换: 按兑换规则

3. **积分有效期**: 1 年
4. **年度清零**: 每年 12 月 31 日 23:59

## 错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 定时任务

1. **众筹状态检查**: 每小时执行
2. **分润计算**: 每月 1 日凌晨 2 点
3. **分润发放**: 每月 10 日凌晨 3 点
4. **积分过期**: 每天凌晨 1 点
5. **积分年度清零**: 每年 12 月 31 日 23:59


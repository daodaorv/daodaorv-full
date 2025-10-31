# API 变更文档 - 术语合规性修正

## 概述

本文档记录了因术语合规性修正而导致的 API 变更。所有变更都是**破坏性变更**，需要前端和第三方集成同步更新。

## 变更日期

2025-10-27

## 变更原因

项目中存在禁止使用的金融投资术语（"投资人"、"股东"、"分红"等），需要替换为合规术语（"众筹车主"、"车主积分"、"分润"）。

---

## API 端点变更

### 1. 用户端 API

#### 1.1 分润相关 API

| 旧端点 | 新端点 | 说明 |
|--------|--------|------|
| `GET /api/crowdfunding/dividends/my` | `GET /api/crowdfunding/profit-sharings/my` | 获取我的分润列表 |
| `GET /api/crowdfunding/dividends/:id` | `GET /api/crowdfunding/profit-sharings/:id` | 获取分润详情 |

### 2. 管理端 API

#### 2.1 分润管理 API

| 旧端点 | 新端点 | 说明 |
|--------|--------|------|
| `POST /api/admin/crowdfunding/dividends/calculate` | `POST /api/admin/crowdfunding/profit-sharings/calculate` | 计算分润 |
| `POST /api/admin/crowdfunding/dividends/distribute` | `POST /api/admin/crowdfunding/profit-sharings/distribute` | 发放分润 |
| `GET /api/admin/crowdfunding/dividends` | `GET /api/admin/crowdfunding/profit-sharings` | 获取所有分润记录 |
| `GET /api/admin/crowdfunding/dividends/stats` | `GET /api/admin/crowdfunding/profit-sharings/stats` | 获取分润统计 |

---

## 请求参数变更

### 1. 计算分润 API

**端点**：`POST /api/admin/crowdfunding/profit-sharings/calculate`

**请求体**：无变更

```json
{
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "period": "2025-10"
}
```

### 2. 发放分润 API

**端点**：`POST /api/admin/crowdfunding/profit-sharings/distribute`

**请求体**：无变更

```json
{
  "period": "2025-10"
}
```

### 3. 获取分润列表 API

**端点**：`GET /api/admin/crowdfunding/profit-sharings`

**查询参数**：无变更

```
?page=1&pageSize=20&status=pending&period=2025-10
```

---

## 响应数据变更

### 1. 分润对象字段变更

#### 旧响应格式

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "dividendNo": "DV202510",
  "dividendAmount": 1250.00,
  "status": "paid",
  "period": "2025-10",
  "projectId": "...",
  "shareId": "...",
  "userId": "...",
  "createdAt": "2025-10-25T10:00:00.000Z",
  "paidAt": "2025-10-26T10:00:00.000Z"
}
```

#### 新响应格式

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "profitSharingNo": "PS202510",
  "profitSharingAmount": 1250.00,
  "status": "paid",
  "period": "2025-10",
  "projectId": "...",
  "shareId": "...",
  "userId": "...",
  "createdAt": "2025-10-25T10:00:00.000Z",
  "paidAt": "2025-10-26T10:00:00.000Z"
}
```

**字段变更**：

| 旧字段名 | 新字段名 | 类型 | 说明 |
|----------|----------|------|------|
| `dividendNo` | `profitSharingNo` | string | 分润编号（格式从 DV202510 改为 PS202510） |
| `dividendAmount` | `profitSharingAmount` | number | 分润金额 |

### 2. 分润列表响应

#### 旧响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "...",
        "dividendNo": "DV202510",
        "dividendAmount": 1250.00,
        ...
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

#### 新响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "...",
        "profitSharingNo": "PS202510",
        "profitSharingAmount": 1250.00,
        ...
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

### 3. 分润统计响应

#### 旧响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalDividends": 100,
    "totalDividendAmount": 125000.00,
    "pendingDividends": 20,
    "pendingDividendAmount": 25000.00,
    "paidDividends": 80,
    "paidDividendAmount": 100000.00
  }
}
```

#### 新响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalProfitSharings": 100,
    "totalProfitSharingAmount": 125000.00,
    "pendingProfitSharings": 20,
    "pendingProfitSharingAmount": 25000.00,
    "paidProfitSharings": 80,
    "paidProfitSharingAmount": 100000.00
  }
}
```

**字段变更**：

| 旧字段名 | 新字段名 | 说明 |
|----------|----------|------|
| `totalDividends` | `totalProfitSharings` | 总分润数 |
| `totalDividendAmount` | `totalProfitSharingAmount` | 总分润金额 |
| `pendingDividends` | `pendingProfitSharings` | 待发放分润数 |
| `pendingDividendAmount` | `pendingProfitSharingAmount` | 待发放分润金额 |
| `paidDividends` | `paidProfitSharings` | 已发放分润数 |
| `paidDividendAmount` | `paidProfitSharingAmount` | 已发放分润金额 |

---

## 错误响应变更

### 旧错误消息

```json
{
  "code": 500,
  "message": "该期间的分红已计算"
}
```

### 新错误消息

```json
{
  "code": 500,
  "message": "该期间的分润已计算"
}
```

**变更内容**：所有错误消息中的"分红"替换为"分润"

---

## 前端适配指南

### 1. API 调用更新

#### 旧代码

```typescript
// 获取分润列表
const response = await axios.get('/api/crowdfunding/dividends/my');

// 获取分润详情
const detail = await axios.get(`/api/crowdfunding/dividends/${id}`);

// 计算分润
await axios.post('/api/admin/crowdfunding/dividends/calculate', {
  projectId,
  period
});
```

#### 新代码

```typescript
// 获取分润列表
const response = await axios.get('/api/crowdfunding/profit-sharings/my');

// 获取分润详情
const detail = await axios.get(`/api/crowdfunding/profit-sharings/${id}`);

// 计算分润
await axios.post('/api/admin/crowdfunding/profit-sharings/calculate', {
  projectId,
  period
});
```

### 2. 数据字段更新

#### 旧代码

```typescript
interface Dividend {
  id: string;
  dividendNo: string;
  dividendAmount: number;
  status: string;
  period: string;
}

// 使用
const dividend = response.data;
console.log(dividend.dividendNo);
console.log(dividend.dividendAmount);
```

#### 新代码

```typescript
interface ProfitSharing {
  id: string;
  profitSharingNo: string;
  profitSharingAmount: number;
  status: string;
  period: string;
}

// 使用
const profitSharing = response.data;
console.log(profitSharing.profitSharingNo);
console.log(profitSharing.profitSharingAmount);
```

### 3. UI 文本更新

所有界面上的文本需要更新：

| 旧文本 | 新文本 |
|--------|--------|
| 分红 | 分润 |
| 分红编号 | 分润编号 |
| 分红金额 | 分润金额 |
| 分红记录 | 分润记录 |
| 分红明细 | 分润明细 |
| 分红统计 | 分润统计 |
| 计算分红 | 计算分润 |
| 发放分红 | 发放分润 |

---

## 测试建议

### 1. API 测试

使用 Postman 或类似工具测试所有新端点：

```bash
# 测试获取分润列表
GET http://localhost:3000/api/crowdfunding/profit-sharings/my
Authorization: Bearer <token>

# 测试获取分润详情
GET http://localhost:3000/api/crowdfunding/profit-sharings/<id>
Authorization: Bearer <token>

# 测试计算分润
POST http://localhost:3000/api/admin/crowdfunding/profit-sharings/calculate
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "projectId": "...",
  "period": "2025-10"
}
```

### 2. 集成测试

确保前端和后端集成正常：

1. 登录系统
2. 查看分润列表
3. 查看分润详情
4. 管理员计算分润
5. 管理员发放分润
6. 验证数据正确性

---

## 兼容性说明

### 不兼容的版本

- 后端版本：< v2.0.0（术语修正前）
- 前端版本：< v2.0.0（术语修正前）

### 兼容的版本

- 后端版本：>= v2.0.0（术语修正后）
- 前端版本：>= v2.0.0（术语修正后）

### 升级路径

1. 先升级后端到 v2.0.0
2. 执行数据库迁移
3. 再升级前端到 v2.0.0
4. 验证功能正常

---

## 支持

如有问题，请联系开发团队。


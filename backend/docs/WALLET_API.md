# 钱包与支付 API 文档

本文档描述了叨叨房车平台的钱包和支付相关API接口。

## 目录

- [用户端钱包API](#用户端钱包api)
  - [获取钱包信息](#获取钱包信息)
  - [获取交易记录](#获取交易记录)
  - [申请提现](#申请提现)
  - [获取提现记录](#获取提现记录)
- [管理端API](#管理端api)
  - [获取提现记录列表](#获取提现记录列表)
  - [获取提现详情](#获取提现详情)
  - [审核提现申请](#审核提现申请)
  - [手动调整余额](#手动调整余额)

---

## 用户端钱包API

### 获取钱包信息

获取当前用户的钱包信息，包括余额、冻结金额等。

**请求**

```
GET /api/wallet
Authorization: Bearer {token}
```

**响应**

```json
{
  "success": true,
  "data": {
    "id": "wallet-uuid",
    "balance": "1000.00",
    "frozenAmount": "100.00",
    "availableBalance": "900.00",
    "totalRecharge": "5000.00",
    "totalConsume": "3500.00",
    "totalWithdrawal": "500.00",
    "status": "active",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-20T10:30:00.000Z"
  }
}
```

**字段说明**

| 字段             | 类型   | 说明                             |
| ---------------- | ------ | -------------------------------- |
| id               | string | 钱包ID                           |
| balance          | string | 账户余额（元）                   |
| frozenAmount     | string | 冻结金额（元）                   |
| availableBalance | string | 可用余额（元）= balance - frozen |
| totalRecharge    | string | 累计充值金额（元）               |
| totalConsume     | string | 累计消费金额（元）               |
| totalWithdrawal  | string | 累计提现金额（元）               |
| status           | string | 钱包状态：active/frozen/closed   |
| createdAt        | string | 创建时间                         |
| updatedAt        | string | 更新时间                         |

**钱包状态说明**

- `active`: 正常使用
- `frozen`: 已冻结，无法操作
- `closed`: 已关闭

---

### 获取交易记录

获取当前用户的钱包交易记录。

**请求**

```
GET /api/wallet/transactions?type=top_up&page=1&pageSize=20
Authorization: Bearer {token}
```

**查询参数**

| 参数     | 类型   | 必填 | 说明                                                                          |
| -------- | ------ | ---- | ----------------------------------------------------------------------------- |
| type     | string | 否   | 交易类型筛选：top_up/consumption/refund/withdrawal/freeze/unfreeze/adjustment |
| page     | number | 否   | 页码（默认1）                                                                 |
| pageSize | number | 否   | 每页数量（默认20）                                                            |

**响应**

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "trans-uuid",
        "type": "consumption",
        "amount": "-100.00",
        "balanceAfter": "900.00",
        "description": "订单支付",
        "relatedId": "order-uuid",
        "relatedType": "order",
        "createdAt": "2025-01-20T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

**交易类型说明**

| 类型        | 说明       |
| ----------- | ---------- |
| top_up      | 充值       |
| consumption | 消费       |
| refund      | 退款       |
| withdrawal  | 提现       |
| freeze      | 冻结       |
| unfreeze    | 解冻       |
| adjustment  | 管理员调整 |

---

### 申请提现

申请将钱包余额提现到微信、支付宝或银行卡。

**请求**

```
POST /api/wallet/withdraw
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**

```json
{
  "amount": 100.0,
  "method": "wechat",
  "account": "13800001111",
  "accountName": "张三",
  "bankName": "中国工商银行"
}
```

**字段说明**

| 字段        | 类型   | 必填 | 说明                             |
| ----------- | ------ | ---- | -------------------------------- |
| amount      | number | 是   | 提现金额（元）                   |
| method      | string | 是   | 提现方式：wechat/alipay/bank     |
| account     | string | 是   | 收款账号（手机号/邮箱/银行卡号） |
| accountName | string | 否   | 开户人姓名（银行卡提现必填）     |
| bankName    | string | 否   | 银行名称（银行卡提现必填）       |

**响应**

```json
{
  "success": true,
  "message": "提现申请成功，等待审核",
  "data": {
    "id": "withdrawal-uuid",
    "withdrawalNo": "WD20250120123456",
    "amount": "100.00",
    "fee": "0.00",
    "actualAmount": "100.00",
    "method": "wechat",
    "status": "pending",
    "createdAt": "2025-01-20T10:30:00.000Z"
  }
}
```

**错误响应**

```json
{
  "success": false,
  "message": "余额不足"
}
```

---

### 获取提现记录

获取当前用户的提现记录。

**请求**

```
GET /api/wallet/withdrawals?page=1&pageSize=20
Authorization: Bearer {token}
```

**查询参数**

| 参数     | 类型   | 必填 | 说明               |
| -------- | ------ | ---- | ------------------ |
| page     | number | 否   | 页码（默认1）      |
| pageSize | number | 否   | 每页数量（默认20） |

**响应**

```json
{
  "success": true,
  "data": {
    "withdrawals": [
      {
        "id": "withdrawal-uuid",
        "withdrawalNo": "WD20250120123456",
        "amount": "100.00",
        "fee": "0.00",
        "actualAmount": "100.00",
        "method": "wechat",
        "status": "completed",
        "account": "1380****1111",
        "createdAt": "2025-01-20T10:30:00.000Z",
        "reviewedAt": "2025-01-20T11:00:00.000Z",
        "completedAt": "2025-01-20T11:05:00.000Z",
        "rejectReason": null
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

**提现状态说明**

| 状态       | 说明   |
| ---------- | ------ |
| pending    | 待审核 |
| processing | 处理中 |
| completed  | 已完成 |
| rejected   | 已拒绝 |
| failed     | 失败   |

---

## 管理端API

### 获取提现记录列表

获取所有用户的提现记录，支持状态筛选。

**请求**

```
GET /api/admin/withdrawals?status=pending&page=1&pageSize=20
Authorization: Bearer {admin-token}
```

**查询参数**

| 参数     | 类型   | 必填 | 说明                                            |
| -------- | ------ | ---- | ----------------------------------------------- |
| status   | string | 否   | 提现状态：pending/processing/completed/rejected |
| page     | number | 否   | 页码（默认1）                                   |
| pageSize | number | 否   | 每页数量（默认20）                              |

**响应**

```json
{
  "success": true,
  "data": {
    "withdrawals": [
      {
        "id": "withdrawal-uuid",
        "withdrawalNo": "WD20250120123456",
        "userId": "user-uuid",
        "userName": "张三",
        "phone": "138****8888",
        "amount": "100.00",
        "fee": "0.00",
        "actualAmount": "100.00",
        "method": "wechat",
        "account": "1380****1111",
        "accountName": "张三",
        "bankName": null,
        "status": "pending",
        "createdAt": "2025-01-20T10:30:00.000Z",
        "reviewedAt": null,
        "completedAt": null,
        "reviewerId": null,
        "rejectReason": null
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

### 获取提现详情

获取指定提现记录的详细信息。

**请求**

```
GET /api/admin/withdrawals/:id
Authorization: Bearer {admin-token}
```

**响应**

```json
{
  "success": true,
  "data": {
    "id": "withdrawal-uuid",
    "withdrawalNo": "WD20250120123456",
    "userId": "user-uuid",
    "userName": "张三",
    "phone": "13800001111",
    "idCard": "110101******1234",
    "amount": "100.00",
    "fee": "0.00",
    "actualAmount": "100.00",
    "method": "bank",
    "account": "6222021234567890123",
    "accountName": "张三",
    "bankName": "中国工商银行",
    "status": "pending",
    "createdAt": "2025-01-20T10:30:00.000Z",
    "reviewedAt": null,
    "completedAt": null,
    "reviewerId": null,
    "rejectReason": null
  }
}
```

---

### 审核提现申请

审核用户的提现申请，可以通过或拒绝。

**请求**

```
POST /api/admin/withdrawals/:id/review
Authorization: Bearer {admin-token}
Content-Type: application/json
```

**请求体 - 通过**

```json
{
  "approved": true
}
```

**请求体 - 拒绝**

```json
{
  "approved": false,
  "rejectReason": "银行卡信息有误，请重新提交"
}
```

**字段说明**

| 字段         | 类型    | 必填 | 说明                   |
| ------------ | ------- | ---- | ---------------------- |
| approved     | boolean | 是   | 是否通过审核           |
| rejectReason | string  | 否   | 拒绝原因（拒绝时必填） |

**响应 - 通过**

```json
{
  "success": true,
  "message": "提现审核通过",
  "data": {
    "id": "withdrawal-uuid",
    "withdrawalNo": "WD20250120123456",
    "status": "completed",
    "reviewedAt": "2025-01-20T11:00:00.000Z"
  }
}
```

**响应 - 拒绝**

```json
{
  "success": true,
  "message": "提现已拒绝",
  "data": {
    "id": "withdrawal-uuid",
    "withdrawalNo": "WD20250120123456",
    "status": "rejected",
    "reviewedAt": "2025-01-20T11:00:00.000Z"
  }
}
```

**业务逻辑说明**

1. **审核通过**：
   - 扣减用户钱包余额
   - 解除冻结金额
   - 更新提现记录状态为 `completed`
   - 记录审核人和审核时间

2. **审核拒绝**：
   - 解除冻结金额，余额不扣减
   - 更新提现记录状态为 `rejected`
   - 记录拒绝原因

---

### 手动调整余额

管理员手动调整用户钱包余额（充值或扣减）。

**请求**

```
POST /api/admin/wallet/adjust
Authorization: Bearer {admin-token}
Content-Type: application/json
```

**请求体**

```json
{
  "userId": "user-uuid",
  "amount": 100,
  "reason": "活动赠送"
}
```

**字段说明**

| 字段   | 类型   | 必填 | 说明                           |
| ------ | ------ | ---- | ------------------------------ |
| userId | string | 是   | 用户ID                         |
| amount | number | 是   | 调整金额（正数增加，负数减少） |
| reason | string | 是   | 调整原因                       |

**响应**

```json
{
  "success": true,
  "message": "余额调整成功",
  "data": {
    "walletId": "wallet-uuid",
    "userId": "user-uuid",
    "newBalance": "1100.00",
    "adjustAmount": "100.00",
    "reason": "活动赠送"
  }
}
```

---

## 错误码说明

| 错误码 | 说明              |
| ------ | ----------------- |
| 400    | 请求参数错误      |
| 401    | 未登录或token无效 |
| 403    | 无权限访问        |
| 404    | 资源不存在        |
| 500    | 服务器内部错误    |

**常见错误信息**

- `余额不足`
- `钱包已冻结或关闭`
- `提现金额必须大于0`
- `提现方式无效`
- `收款账号不能为空`
- `银行卡提现需要提供开户人和银行名称`
- `提现记录不存在`
- `提现记录状态不正确`
- `拒绝提现时必须填写拒绝原因`

---

## 使用示例

### 用户端 - 申请提现到微信

```javascript
// 1. 获取钱包信息，检查余额
const walletResponse = await fetch('/api/wallet', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
const wallet = await walletResponse.json();

// 2. 申请提现
if (parseFloat(wallet.data.availableBalance) >= 100) {
  const withdrawalResponse = await fetch('/api/wallet/withdraw', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: 100,
      method: 'wechat',
      account: '13800001111',
    }),
  });

  const result = await withdrawalResponse.json();
  console.log(result.message); // "提现申请成功，等待审核"
}
```

### 管理端 - 审核提现

```javascript
// 1. 获取待审核的提现列表
const listResponse = await fetch('/api/admin/withdrawals?status=pending&page=1', {
  headers: {
    Authorization: `Bearer ${adminToken}`,
  },
});
const withdrawals = await listResponse.json();

// 2. 审核提现（通过）
const withdrawalId = withdrawals.data.withdrawals[0].id;
const reviewResponse = await fetch(`/api/admin/withdrawals/${withdrawalId}/review`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    approved: true,
  }),
});

const result = await reviewResponse.json();
console.log(result.message); // "提现审核通过"
```

---

## 钱包业务流程

### 提现流程

```
用户发起提现
  ↓
验证余额是否充足
  ↓
冻结提现金额
  ↓
创建提现记录（状态：pending）
  ↓
管理员审核
  ├─通过 → 扣减余额 + 解除冻结 → 状态：completed
  └─拒绝 → 解除冻结 → 状态：rejected
```

### 余额调整流程

```
管理员发起调整
  ↓
输入调整金额和原因
  ↓
系统直接更新钱包余额
  ↓
创建调整交易记录
```

---

## 注意事项

1. **余额精度**: 所有金额字段均为字符串类型，保留两位小数，确保金额精度。
2. **冻结机制**: 提现申请后会冻结相应金额，防止重复提现。
3. **审核流程**: 所有提现申请需要管理员审核后才能完成。
4. **账号脱敏**: 用户端查询提现记录时，收款账号会自动脱敏。
5. **权限控制**: 管理端API需要管理员权限，普通用户无法访问。
6. **钱包自动创建**: 用户首次访问钱包时会自动创建，初始余额为0。

---

## 更新日志

| 版本 | 日期       | 说明     |
| ---- | ---------- | -------- |
| v1.0 | 2025-01-20 | 初版发布 |

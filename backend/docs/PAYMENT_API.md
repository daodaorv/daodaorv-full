# 支付 API 文档

本文档描述了叨叨房车平台的支付相关API接口。

## 目录

- [用户端支付API](#用户端支付api)
  - [创建支付](#创建支付)
  - [查询支付状态](#查询支付状态)
- [支付回调API](#支付回调api)
  - [微信支付回调](#微信支付回调)
  - [支付宝回调](#支付宝回调)
- [管理端API](#管理端api)
  - [获取支付配置](#获取支付配置)
  - [更新支付配置](#更新支付配置)
  - [测试支付配置](#测试支付配置)
- [数据字典](#数据字典)
  - [支付平台](#支付平台)
  - [支付状态](#支付状态)
- [错误码](#错误码)

---

## 用户端支付API

### 创建支付

创建订单支付，支持钱包余额支付、微信支付、支付宝支付。

**请求**

```
POST /api/payment/create
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**

```json
{
  "orderId": "order-uuid",
  "platform": "wallet",
  "amount": 300.00
}
```

**参数说明**

| 参数     | 类型   | 必填 | 说明                                    |
| -------- | ------ | ---- | --------------------------------------- |
| orderId  | string | 是   | 订单ID                                  |
| platform | string | 是   | 支付平台：wallet/wechat/alipay          |
| amount   | number | 是   | 支付金额（元），必须与订单金额一致      |

**响应（钱包支付）**

```json
{
  "success": true,
  "data": {
    "paymentRecord": {
      "paymentNo": "PAY20251026123456",
      "orderId": "order-uuid",
      "userId": "user-uuid",
      "amount": 300.00,
      "platform": "wallet",
      "status": "paid",
      "paidAt": "2025-10-26T10:30:00.000Z",
      "createdAt": "2025-10-26T10:30:00.000Z"
    }
  },
  "message": "支付创建成功"
}
```

**响应（微信/支付宝支付）**

```json
{
  "success": true,
  "data": {
    "paymentRecord": {
      "paymentNo": "PAY20251026123456",
      "orderId": "order-uuid",
      "userId": "user-uuid",
      "amount": 300.00,
      "platform": "wechat",
      "status": "paying",
      "thirdPartyOrderNo": "wx_prepay_id_xxx",
      "expiredAt": "2025-10-26T10:45:00.000Z",
      "createdAt": "2025-10-26T10:30:00.000Z"
    },
    "paymentParams": {
      "appId": "wx1234567890",
      "timeStamp": "1698307800",
      "nonceStr": "abc123",
      "package": "prepay_id=wx_prepay_id_xxx",
      "signType": "RSA",
      "paySign": "signature_string"
    }
  },
  "message": "支付创建成功"
}
```

**字段说明**

| 字段                | 类型   | 说明                                                |
| ------------------- | ------ | --------------------------------------------------- |
| paymentNo           | string | 支付单号                                            |
| orderId             | string | 订单ID                                              |
| userId              | string | 用户ID                                              |
| amount              | number | 支付金额（元）                                      |
| platform            | string | 支付平台：wallet/wechat/alipay                      |
| status              | string | 支付状态：pending/paying/paid/cancelled/refunded/failed |
| thirdPartyOrderNo   | string | 第三方订单号（微信/支付宝）                         |
| paymentParams       | object | 支付参数（用于前端调起支付）                        |
| paidAt              | string | 支付完成时间                                        |
| expiredAt           | string | 支付过期时间（15分钟）                              |
| createdAt           | string | 创建时间                                            |

**错误响应**

```json
{
  "success": false,
  "message": "余额不足"
}
```

**可能的错误**

- `缺少必填参数` - 请求参数不完整
- `不支持的支付平台` - platform 参数无效
- `支付金额必须大于0` - amount 参数无效
- `订单不存在` - orderId 无效
- `订单状态不正确，无法支付` - 订单已支付或已取消
- `支付金额与订单金额不一致` - amount 与订单金额不匹配
- `余额不足` - 钱包余额不足（钱包支付）
- `微信支付未配置或未启用` - 微信支付未开通
- `支付宝支付未配置或未启用` - 支付宝支付未开通

---

### 查询支付状态

查询支付单的状态。

**请求**

```
GET /api/payment/{paymentNo}
Authorization: Bearer {token}
```

**路径参数**

| 参数      | 类型   | 必填 | 说明     |
| --------- | ------ | ---- | -------- |
| paymentNo | string | 是   | 支付单号 |

**响应**

```json
{
  "success": true,
  "data": {
    "paymentNo": "PAY20251026123456",
    "orderId": "order-uuid",
    "amount": 300.00,
    "platform": "wallet",
    "status": "paid",
    "paidAt": "2025-10-26T10:30:00.000Z",
    "createdAt": "2025-10-26T10:30:00.000Z"
  },
  "message": "查询成功"
}
```

**错误响应**

```json
{
  "success": false,
  "message": "支付记录不存在"
}
```

---

## 支付回调API

### 微信支付回调

微信支付异步通知接口（无需登录）。

**请求**

```
POST /api/payment/wechat/callback
Content-Type: application/xml
```

**请求体（XML格式）**

```xml
<xml>
  <appid><![CDATA[wx1234567890]]></appid>
  <mch_id><![CDATA[1234567890]]></mch_id>
  <out_trade_no><![CDATA[PAY20251026123456]]></out_trade_no>
  <transaction_id><![CDATA[wx_transaction_id]]></transaction_id>
  <total_fee>30000</total_fee>
  <sign><![CDATA[signature]]></sign>
</xml>
```

**响应（成功）**

```xml
<xml>
  <return_code><![CDATA[SUCCESS]]></return_code>
  <return_msg><![CDATA[OK]]></return_msg>
</xml>
```

**响应（失败）**

```xml
<xml>
  <return_code><![CDATA[FAIL]]></return_code>
  <return_msg><![CDATA[签名验证失败]]></return_msg>
</xml>
```

---

### 支付宝回调

支付宝异步通知接口（无需登录）。

**请求**

```
POST /api/payment/alipay/callback
Content-Type: application/x-www-form-urlencoded
```

**请求参数**

| 参数            | 类型   | 说明           |
| --------------- | ------ | -------------- |
| out_trade_no    | string | 商户订单号     |
| trade_no        | string | 支付宝交易号   |
| total_amount    | string | 订单金额（元） |
| trade_status    | string | 交易状态       |
| sign            | string | 签名           |

**响应（成功）**

```
success
```

**响应（失败）**

```
fail
```

---

## 管理端API

### 获取支付配置

获取指定支付平台的配置信息（脱敏）。

**请求**

```
GET /api/admin/payment/config/{platform}
Authorization: Bearer {adminToken}
```

**路径参数**

| 参数     | 类型   | 必填 | 说明                           |
| -------- | ------ | ---- | ------------------------------ |
| platform | string | 是   | 支付平台：wechat/alipay/wallet |

**响应**

```json
{
  "success": true,
  "data": {
    "platform": "wechat",
    "isEnabled": true,
    "remark": "微信支付配置",
    "createdAt": "2025-10-26T10:00:00.000Z",
    "updatedAt": "2025-10-26T10:30:00.000Z"
  },
  "message": "查询成功"
}
```

**注意**：出于安全考虑，`config` 字段（包含密钥等敏感信息）不会返回。

---

### 更新支付配置

更新指定支付平台的配置。

**请求**

```
POST /api/admin/payment/config/{platform}
Authorization: Bearer {adminToken}
Content-Type: application/json
```

**路径参数**

| 参数     | 类型   | 必填 | 说明                           |
| -------- | ------ | ---- | ------------------------------ |
| platform | string | 是   | 支付平台：wechat/alipay/wallet |

**请求体（微信支付）**

```json
{
  "config": {
    "appId": "wx1234567890",
    "mchId": "1234567890",
    "apiKey": "your_api_key_here",
    "certPath": "/path/to/cert.pem"
  },
  "isEnabled": true
}
```

**请求体（支付宝）**

```json
{
  "config": {
    "appId": "2021001234567890",
    "privateKey": "your_private_key_here",
    "publicKey": "alipay_public_key_here",
    "gateway": "https://openapi.alipay.com/gateway.do"
  },
  "isEnabled": true
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "platform": "wechat",
    "isEnabled": true
  },
  "message": "配置更新成功"
}
```

---

### 测试支付配置

测试支付配置是否正确（预留功能）。

**请求**

```
POST /api/admin/payment/config/{platform}/test
Authorization: Bearer {adminToken}
```

**路径参数**

| 参数     | 类型   | 必填 | 说明                           |
| -------- | ------ | ---- | ------------------------------ |
| platform | string | 是   | 支付平台：wechat/alipay/wallet |

**响应**

```json
{
  "success": true,
  "data": {
    "success": true
  },
  "message": "配置测试成功（预留功能）"
}
```

---

## 数据字典

### 支付平台

| 值     | 说明       |
| ------ | ---------- |
| wallet | 钱包余额   |
| wechat | 微信支付   |
| alipay | 支付宝支付 |

### 支付状态

| 值        | 说明                   |
| --------- | ---------------------- |
| pending   | 待支付                 |
| paying    | 支付中（第三方支付）   |
| paid      | 已支付                 |
| cancelled | 已取消                 |
| refunded  | 已退款                 |
| failed    | 支付失败               |

---

## 错误码

| 错误码 | 错误信息                       | 说明                   |
| ------ | ------------------------------ | ---------------------- |
| 400    | 缺少必填参数                   | 请求参数不完整         |
| 400    | 不支持的支付平台               | platform 参数无效      |
| 400    | 支付金额必须大于0              | amount 参数无效        |
| 401    | 未登录                         | 需要登录               |
| 404    | 订单不存在                     | orderId 无效           |
| 404    | 支付记录不存在                 | paymentNo 无效         |
| 500    | 订单状态不正确，无法支付       | 订单已支付或已取消     |
| 500    | 支付金额与订单金额不一致       | amount 与订单金额不匹配 |
| 500    | 余额不足                       | 钱包余额不足           |
| 500    | 微信支付未配置或未启用         | 微信支付未开通         |
| 500    | 支付宝支付未配置或未启用       | 支付宝支付未开通       |
| 500    | 支付已完成，无法取消           | 支付状态不允许取消     |

---

## 业务流程

### 钱包支付流程

1. 用户选择钱包支付
2. 前端调用 `POST /api/payment/create`，传入 `platform=wallet`
3. 后端验证订单状态和金额
4. 后端扣减钱包余额
5. 后端更新订单状态为"已支付"
6. 后端创建支付记录，状态为"已支付"
7. 返回支付结果给前端

### 第三方支付流程（微信/支付宝）

1. 用户选择微信/支付宝支付
2. 前端调用 `POST /api/payment/create`，传入 `platform=wechat` 或 `platform=alipay`
3. 后端验证订单状态和金额
4. 后端调用第三方支付接口创建订单
5. 后端创建支付记录，状态为"支付中"
6. 返回支付参数给前端
7. 前端调起微信/支付宝支付
8. 用户完成支付
9. 第三方支付平台异步通知后端（回调接口）
10. 后端验证签名和金额
11. 后端更新支付记录状态为"已支付"
12. 后端更新订单状态为"已支付"
13. 前端轮询查询支付状态或接收推送通知

### 支付过期处理

- 支付单创建后15分钟内未完成支付，自动过期
- 过期后订单状态恢复为"待支付"
- 用户需要重新创建支付单

---

## 注意事项

1. **支付金额验证**：前端传入的 `amount` 必须与订单的 `totalPrice` 完全一致，否则支付失败
2. **支付幂等性**：同一订单可以多次创建支付单，但只有最新的支付单有效
3. **回调幂等性**：支付回调接口支持幂等处理，重复通知不会重复更新订单状态
4. **签名验证**：所有第三方支付回调必须验证签名，确保请求来自官方平台
5. **配置安全**：支付配置中的密钥等敏感信息不会通过API返回，仅存储在数据库中
6. **第三方支付预留**：当前微信支付和支付宝支付接口为预留状态，调用会返回"未配置"错误

---

## 更新日志

- **2025-10-26**: 初始版本，支持钱包支付、预留第三方支付接口


# 退款 API 文档

本文档描述了叨叨房车平台的退款相关API接口。

## 目录

- [用户端退款API](#用户端退款api)
  - [获取退款详情](#获取退款详情)
  - [查询退款状态](#查询退款状态)
- [管理端API](#管理端api)
  - [创建退款申请](#创建退款申请)
  - [处理退款](#处理退款)
- [退款回调API](#退款回调api)
  - [微信退款回调](#微信退款回调)
  - [支付宝退款回调](#支付宝退款回调)
- [数据字典](#数据字典)
  - [退款状态](#退款状态)
- [错误码](#错误码)

---

## 用户端退款API

### 获取退款详情

获取指定退款记录的详细信息。

**请求**

```
GET /api/refund/{refundId}
Authorization: Bearer {token}
```

**路径参数**

| 参数     | 类型   | 必填 | 说明     |
| -------- | ------ | ---- | -------- |
| refundId | string | 是   | 退款ID   |

**响应**

```json
{
  "success": true,
  "data": {
    "id": "refund-uuid",
    "refundNo": "RFD20251026123456",
    "orderId": "order-uuid",
    "paymentRecordId": "payment-uuid",
    "amount": 300.00,
    "reason": "用户申请退款",
    "status": "refunded",
    "thirdPartyRefundNo": null,
    "refundedAt": "2025-10-26T10:30:00.000Z",
    "failureReason": null,
    "createdAt": "2025-10-26T10:00:00.000Z",
    "updatedAt": "2025-10-26T10:30:00.000Z",
    "order": {
      "orderNo": "ORD20251026123456",
      "totalPrice": "300.00"
    },
    "paymentRecord": {
      "paymentNo": "PAY20251026123456",
      "platform": "wallet"
    }
  },
  "message": "查询成功"
}
```

**字段说明**

| 字段                | 类型   | 说明                                      |
| ------------------- | ------ | ----------------------------------------- |
| id                  | string | 退款ID                                    |
| refundNo            | string | 退款单号                                  |
| orderId             | string | 订单ID                                    |
| paymentRecordId     | string | 支付记录ID                                |
| amount              | number | 退款金额（元）                            |
| reason              | string | 退款原因                                  |
| status              | string | 退款状态：pending/processing/refunded/failed |
| thirdPartyRefundNo  | string | 第三方退款单号（微信/支付宝）             |
| refundedAt          | string | 退款完成时间                              |
| failureReason       | string | 退款失败原因                              |
| createdAt           | string | 创建时间                                  |
| updatedAt           | string | 更新时间                                  |

**错误响应**

```json
{
  "success": false,
  "message": "退款记录不存在"
}
```

---

### 查询退款状态

通过退款单号查询退款状态。

**请求**

```
GET /api/refund/status/{refundNo}
Authorization: Bearer {token}
```

**路径参数**

| 参数     | 类型   | 必填 | 说明     |
| -------- | ------ | ---- | -------- |
| refundNo | string | 是   | 退款单号 |

**响应**

```json
{
  "success": true,
  "data": {
    "refundNo": "RFD20251026123456",
    "orderId": "order-uuid",
    "amount": 300.00,
    "status": "refunded",
    "refundedAt": "2025-10-26T10:30:00.000Z",
    "createdAt": "2025-10-26T10:00:00.000Z"
  },
  "message": "查询成功"
}
```

**错误响应**

```json
{
  "success": false,
  "message": "退款记录不存在"
}
```

---

## 管理端API

### 创建退款申请

管理员为订单创建退款申请。

**请求**

```
POST /api/admin/refund/create
Authorization: Bearer {adminToken}
Content-Type: application/json
```

**请求体**

```json
{
  "orderId": "order-uuid",
  "reason": "用户申请退款"
}
```

**参数说明**

| 参数    | 类型   | 必填 | 说明                   |
| ------- | ------ | ---- | ---------------------- |
| orderId | string | 是   | 订单ID                 |
| reason  | string | 否   | 退款原因（默认：用户申请退款） |

**响应**

```json
{
  "success": true,
  "data": {
    "id": "refund-uuid",
    "refundNo": "RFD20251026123456",
    "orderId": "order-uuid",
    "paymentRecordId": "payment-uuid",
    "amount": 300.00,
    "reason": "用户申请退款",
    "status": "pending",
    "createdAt": "2025-10-26T10:00:00.000Z"
  },
  "message": "退款申请创建成功"
}
```

**错误响应**

```json
{
  "success": false,
  "message": "订单未支付，无法退款"
}
```

**可能的错误**

- `缺少订单ID` - 请求参数不完整
- `订单不存在` - orderId 无效
- `订单未支付，无法退款` - 订单状态不正确
- `支付记录不存在` - 找不到对应的支付记录
- `订单已退款` - 订单已经退款过
- `退款处理中，请勿重复提交` - 已有退款申请正在处理

---

### 处理退款

管理员处理退款申请，执行退款操作。

**请求**

```
POST /api/admin/refund/process/{refundId}
Authorization: Bearer {adminToken}
```

**路径参数**

| 参数     | 类型   | 必填 | 说明     |
| -------- | ------ | ---- | -------- |
| refundId | string | 是   | 退款ID   |

**响应**

```json
{
  "success": true,
  "data": {
    "id": "refund-uuid",
    "refundNo": "RFD20251026123456",
    "orderId": "order-uuid",
    "amount": 300.00,
    "status": "refunded",
    "refundedAt": "2025-10-26T10:30:00.000Z",
    "createdAt": "2025-10-26T10:00:00.000Z",
    "updatedAt": "2025-10-26T10:30:00.000Z"
  },
  "message": "退款处理成功"
}
```

**错误响应**

```json
{
  "success": false,
  "message": "退款已完成"
}
```

**可能的错误**

- `退款记录不存在` - refundId 无效
- `退款已完成` - 退款已经处理过
- `退款处理中` - 退款正在处理中
- `微信退款功能暂未实现` - 微信支付退款预留功能
- `支付宝退款功能暂未实现` - 支付宝退款预留功能

---

## 退款回调API

### 微信退款回调

微信退款异步通知接口（无需登录）。

**请求**

```
POST /api/refund/wechat/callback
Content-Type: application/xml
```

**请求体（XML格式）**

```xml
<xml>
  <appid><![CDATA[wx1234567890]]></appid>
  <mch_id><![CDATA[1234567890]]></mch_id>
  <out_refund_no><![CDATA[RFD20251026123456]]></out_refund_no>
  <refund_id><![CDATA[wx_refund_id]]></refund_id>
  <refund_fee>30000</refund_fee>
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
  <return_msg><![CDATA[退款回调功能暂未实现]]></return_msg>
</xml>
```

**注意**：当前为预留功能，实际调用会返回失败。

---

### 支付宝退款回调

支付宝退款异步通知接口（无需登录）。

**请求**

```
POST /api/refund/alipay/callback
Content-Type: application/x-www-form-urlencoded
```

**请求参数**

| 参数            | 类型   | 说明           |
| --------------- | ------ | -------------- |
| out_trade_no    | string | 商户订单号     |
| trade_no        | string | 支付宝交易号   |
| refund_fee      | string | 退款金额（元） |
| sign            | string | 签名           |

**响应（成功）**

```
success
```

**响应（失败）**

```
fail
```

**注意**：当前为预留功能，实际调用会返回失败。

---

## 数据字典

### 退款状态

| 值         | 说明       |
| ---------- | ---------- |
| pending    | 待退款     |
| processing | 退款中     |
| refunded   | 已退款     |
| failed     | 退款失败   |

---

## 错误码

| 错误码 | 错误信息                       | 说明                   |
| ------ | ------------------------------ | ---------------------- |
| 400    | 缺少订单ID                     | 请求参数不完整         |
| 401    | 未登录                         | 需要登录               |
| 403    | 无权限                         | 需要管理员权限         |
| 404    | 订单不存在                     | orderId 无效           |
| 404    | 退款记录不存在                 | refundId 或 refundNo 无效 |
| 500    | 订单未支付，无法退款           | 订单状态不正确         |
| 500    | 支付记录不存在                 | 找不到对应的支付记录   |
| 500    | 订单已退款                     | 订单已经退款过         |
| 500    | 退款处理中，请勿重复提交       | 已有退款申请正在处理   |
| 500    | 退款已完成                     | 退款已经处理过         |
| 500    | 退款处理中                     | 退款正在处理中         |
| 500    | 微信退款功能暂未实现           | 微信支付退款预留功能   |
| 500    | 支付宝退款功能暂未实现         | 支付宝退款预留功能     |

---

## 业务流程

### 钱包退款流程

1. 管理员创建退款申请
2. 后端验证订单状态（必须已支付）
3. 后端查找支付记录
4. 后端创建退款记录，状态为"待退款"
5. 管理员处理退款
6. 后端更新退款状态为"退款中"
7. 后端增加用户钱包余额
8. 后端创建退款交易记录
9. 后端更新退款状态为"已退款"
10. 后端更新订单支付状态为"已退款"
11. 后端更新支付记录状态为"已退款"
12. 返回退款结果

### 第三方退款流程（微信/支付宝）

1. 管理员创建退款申请
2. 后端验证订单状态（必须已支付）
3. 后端查找支付记录
4. 后端创建退款记录，状态为"待退款"
5. 管理员处理退款
6. 后端更新退款状态为"退款中"
7. 后端调用第三方退款接口
8. 第三方平台处理退款
9. 第三方平台异步通知后端（回调接口）
10. 后端验证签名和金额
11. 后端更新退款状态为"已退款"
12. 后端更新订单支付状态为"已退款"
13. 后端更新支付记录状态为"已退款"
14. 用户收到退款（原路返回）

### 订单取消自动退款

1. 用户取消已支付订单
2. 后端计算退款金额
   - 距离开始时间 >= 24小时：全额退款
   - 距离开始时间 < 24小时：扣除10%手续费
3. 后端自动创建退款申请
4. 后端更新订单支付状态为"退款中"
5. 管理员处理退款（或自动处理）
6. 后续流程同上

---

## 注意事项

1. **退款条件**：只有已支付的订单才能退款
2. **退款金额**：退款金额等于实付金额（可能扣除手续费）
3. **退款方式**：
   - 钱包支付：退款到钱包
   - 第三方支付：退款原路返回（预留）
4. **退款时效**：
   - 钱包退款：即时到账
   - 第三方退款：1-7个工作日（预留）
5. **幂等性**：重复创建退款申请会返回已有记录或错误
6. **权限控制**：
   - 创建退款申请：需要管理员权限
   - 处理退款：需要管理员权限
   - 查询退款：用户只能查询自己的退款
7. **第三方退款预留**：当前微信和支付宝退款接口为预留状态，调用会返回"未实现"错误

---

## 更新日志

- **2025-10-26**: 初始版本，支持钱包退款、预留第三方退款接口


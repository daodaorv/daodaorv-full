# 订单管理 API 文档

本文档描述订单管理相关的所有 API 接口。

## 目录

- [订单管理 API 文档](#订单管理-api-文档)
  - [目录](#目录)
  - [API 概览](#api-概览)
  - [用户端订单 API](#用户端订单-api)
    - [1. 创建订单](#1-创建订单)
    - [2. 获取我的订单列表](#2-获取我的订单列表)
    - [3. 获取订单详情](#3-获取订单详情)
    - [4. 取消订单](#4-取消订单)
  - [管理端订单 API](#管理端订单-api)
    - [5. 获取所有订单列表](#5-获取所有订单列表)
    - [6. 获取订单详情（管理端）](#6-获取订单详情管理端)
    - [7. 更新订单状态](#7-更新订单状态)
    - [8. 处理订单退款](#8-处理订单退款)
  - [数据模型](#数据模型)
    - [订单状态（OrderStatus）](#订单状态orderstatus)
    - [支付状态（PaymentStatus）](#支付状态paymentstatus)
    - [订单类型（OrderType）](#订单类型ordertype)
  - [错误码说明](#错误码说明)
  - [使用示例](#使用示例)

---

## API 概览

| 序号 | 接口名称                   | 请求方法 | 路径                           | 认证要求 | 说明                         |
| ---- | -------------------------- | -------- | ------------------------------ | -------- | ---------------------------- |
| 1    | 创建订单                   | POST     | `/api/orders`                  | 需登录   | 用户创建租车订单             |
| 2    | 获取我的订单列表           | GET      | `/api/orders`                  | 需登录   | 查询当前用户的订单列表       |
| 3    | 获取订单详情               | GET      | `/api/orders/:id`              | 需登录   | 查看订单详细信息             |
| 4    | 取消订单                   | POST     | `/api/orders/:id/cancel`       | 需登录   | 取消未开始的订单             |
| 5    | 获取所有订单列表（管理端） | GET      | `/api/admin/orders`            | 需管理员 | 管理员查询所有订单           |
| 6    | 获取订单详情（管理端）     | GET      | `/api/admin/orders/:id`        | 需管理员 | 管理员查看订单详情           |
| 7    | 更新订单状态               | PUT      | `/api/admin/orders/:id/status` | 需管理员 | 更新订单状态（支付、取还车） |
| 8    | 处理订单退款               | POST     | `/api/admin/orders/:id/refund` | 需管理员 | 处理订单退款                 |

---

## 用户端订单 API

### 1. 创建订单

**接口描述**：用户创建租车订单

**请求方法**：`POST`

**请求路径**：`/api/orders`

**认证要求**：需登录

**请求参数**：

| 参数名称           | 类型    | 必填 | 说明                  |
| ------------------ | ------- | ---- | --------------------- |
| vehicleId          | string  | 是   | 车辆ID                |
| startDate          | string  | 是   | 开始日期 (YYYY-MM-DD) |
| endDate            | string  | 是   | 结束日期 (YYYY-MM-DD) |
| pickupStoreId      | string  | 否   | 取车门店ID            |
| returnStoreId      | string  | 否   | 还车门店ID            |
| needInsurance      | boolean | 否   | 是否需要保险          |
| additionalServices | array   | 否   | 附加服务列表          |

**请求示例**：

```json
{
  "vehicleId": "6a9c7dc6-8231-46c1-811c-d7b400078afc",
  "startDate": "2025-11-01",
  "endDate": "2025-11-05",
  "needInsurance": true,
  "additionalServices": [
    {
      "name": "儿童座椅",
      "price": 50
    }
  ]
}
```

**响应示例**：

```json
{
  "success": true,
  "code": 200,
  "message": "订单创建成功",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "orderNo": "ORD20251025123456001234",
    "userId": "1b97a05d-9548-45d2-a151-22583bcc7be4",
    "vehicleId": "6a9c7dc6-8231-46c1-811c-d7b400078afc",
    "orderType": "rv_rental",
    "startDate": "2025-11-01",
    "endDate": "2025-11-05",
    "rentalDays": 4,
    "rentalPrice": "2396.00",
    "insurancePrice": "400.00",
    "totalPrice": "2846.00",
    "deposit": "1198.00",
    "status": "pending",
    "paymentStatus": "unpaid",
    "created_at": "2025-10-25T05:30:00.000Z"
  },
  "timestamp": "2025-10-25T05:30:00.000Z"
}
```

**错误响应**：

- `400`：缺少必填字段
- `500`：车辆不存在 / 车辆不可用 / 日期验证失败 / 车辆已被预订

---

### 2. 获取我的订单列表

**接口描述**：获取当前用户的订单列表，支持分页和状态筛选

**请求方法**：`GET`

**请求路径**：`/api/orders`

**认证要求**：需登录

**请求参数**：

| 参数名称 | 类型   | 必填 | 说明                                                                         |
| -------- | ------ | ---- | ---------------------------------------------------------------------------- |
| page     | number | 否   | 页码，默认1                                                                  |
| pageSize | number | 否   | 每页数量，默认10                                                             |
| status   | string | 否   | 订单状态筛选 (pending/paid/pickup/using/return/completed/cancelled/refunded) |

**请求示例**：

```
GET /api/orders?page=1&pageSize=10&status=pending
```

**响应示例**：

```json
{
  "success": true,
  "code": 200,
  "message": "获取订单列表成功",
  "data": {
    "orders": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "orderNo": "ORD20251025123456001234",
        "vehicleId": "6a9c7dc6-8231-46c1-811c-d7b400078afc",
        "startDate": "2025-11-01",
        "endDate": "2025-11-05",
        "totalPrice": "2846.00",
        "status": "pending",
        "paymentStatus": "unpaid",
        "vehicle": {
          "licensePlate": "粤A12345",
          "vehicleModel": {
            "modelName": "大通RV80",
            "brand": "上汽大通"
          }
        }
      }
    ],
    "total": 1
  },
  "timestamp": "2025-10-25T05:30:00.000Z"
}
```

---

### 3. 获取订单详情

**接口描述**：获取订单的详细信息

**请求方法**：`GET`

**请求路径**：`/api/orders/:id`

**认证要求**：需登录

**路径参数**：

| 参数名称 | 类型   | 必填 | 说明   |
| -------- | ------ | ---- | ------ |
| id       | string | 是   | 订单ID |

**响应示例**：

```json
{
  "success": true,
  "code": 200,
  "message": "获取订单详情成功",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "orderNo": "ORD20251025123456001234",
    "userId": "1b97a05d-9548-45d2-a151-22583bcc7be4",
    "vehicleId": "6a9c7dc6-8231-46c1-811c-d7b400078afc",
    "orderType": "rv_rental",
    "startDate": "2025-11-01",
    "endDate": "2025-11-05",
    "rentalDays": 4,
    "rentalPrice": "2396.00",
    "insurancePrice": "400.00",
    "additionalServices": [
      {
        "name": "儿童座椅",
        "price": 50
      }
    ],
    "totalPrice": "2846.00",
    "deposit": "1198.00",
    "status": "pending",
    "paymentStatus": "unpaid",
    "user": {
      "id": "1b97a05d-9548-45d2-a151-22583bcc7be4",
      "phone": "138****1234",
      "nickname": "测试用户"
    },
    "vehicle": {
      "licensePlate": "粤A12345",
      "vin": "TEST123456789ABCD",
      "vehicleModel": {
        "modelName": "大通RV80",
        "brand": "上汽大通",
        "dailyPrice": "599.00"
      }
    },
    "created_at": "2025-10-25T05:30:00.000Z"
  },
  "timestamp": "2025-10-25T05:30:00.000Z"
}
```

**错误响应**：

- `404`：订单不存在
- `403`：无权访问此订单

---

### 4. 取消订单

**接口描述**：取消待支付或已支付的订单

**请求方法**：`POST`

**请求路径**：`/api/orders/:id/cancel`

**认证要求**：需登录

**路径参数**：

| 参数名称 | 类型   | 必填 | 说明   |
| -------- | ------ | ---- | ------ |
| id       | string | 是   | 订单ID |

**请求参数**：

| 参数名称 | 类型   | 必填 | 说明     |
| -------- | ------ | ---- | -------- |
| reason   | string | 否   | 取消原因 |

**请求示例**：

```json
{
  "reason": "行程变更"
}
```

**响应示例**：

```json
{
  "success": true,
  "code": 200,
  "message": "订单取消成功",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "orderNo": "ORD20251025123456001234",
    "status": "cancelled",
    "cancellationReason": "行程变更",
    "refundAmount": "2846.00",
    "cancelledAt": "2025-10-25T06:00:00.000Z"
  },
  "timestamp": "2025-10-25T06:00:00.000Z"
}
```

**错误响应**：

- `500`：订单不存在 / 无权操作 / 当前订单状态不可取消

---

## 管理端订单 API

### 5. 获取所有订单列表

**接口描述**：管理员获取所有订单列表，支持多条件筛选和分页

**请求方法**：`GET`

**请求路径**：`/api/admin/orders`

**认证要求**：需管理员权限

**请求参数**：

| 参数名称  | 类型   | 必填 | 说明                        |
| --------- | ------ | ---- | --------------------------- |
| page      | number | 否   | 页码，默认1                 |
| pageSize  | number | 否   | 每页数量，默认10            |
| status    | string | 否   | 订单状态筛选                |
| orderType | string | 否   | 订单类型筛选                |
| startDate | string | 否   | 开始日期筛选                |
| endDate   | string | 否   | 结束日期筛选                |
| keyword   | string | 否   | 关键词搜索（订单号/手机号） |

**请求示例**：

```
GET /api/admin/orders?page=1&pageSize=10&status=pending
```

**响应示例**：

```json
{
  "success": true,
  "code": 200,
  "message": "获取订单列表成功",
  "data": {
    "orders": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "orderNo": "ORD20251025123456001234",
        "userId": "1b97a05d-9548-45d2-a151-22583bcc7be4",
        "vehicleId": "6a9c7dc6-8231-46c1-811c-d7b400078afc",
        "startDate": "2025-11-01",
        "endDate": "2025-11-05",
        "totalPrice": "2846.00",
        "status": "pending",
        "paymentStatus": "unpaid",
        "user": {
          "phone": "138****1234",
          "nickname": "测试用户"
        },
        "vehicle": {
          "licensePlate": "粤A12345"
        },
        "created_at": "2025-10-25T05:30:00.000Z"
      }
    ],
    "total": 1
  },
  "timestamp": "2025-10-25T05:30:00.000Z"
}
```

**错误响应**：

- `403`：无管理员权限

---

### 6. 获取订单详情（管理端）

**接口描述**：管理员查看任意订单的详细信息

**请求方法**：`GET`

**请求路径**：`/api/admin/orders/:id`

**认证要求**：需管理员权限

**路径参数**：

| 参数名称 | 类型   | 必填 | 说明   |
| -------- | ------ | ---- | ------ |
| id       | string | 是   | 订单ID |

**响应示例**：

```json
{
  "success": true,
  "code": 200,
  "message": "获取订单详情成功",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "orderNo": "ORD20251025123456001234",
    "userId": "1b97a05d-9548-45d2-a151-22583bcc7be4",
    "vehicleId": "6a9c7dc6-8231-46c1-811c-d7b400078afc",
    "orderType": "rv_rental",
    "startDate": "2025-11-01",
    "endDate": "2025-11-05",
    "rentalDays": 4,
    "rentalPrice": "2396.00",
    "insurancePrice": "400.00",
    "totalPrice": "2846.00",
    "deposit": "1198.00",
    "status": "pending",
    "paymentStatus": "unpaid",
    "user": {
      "id": "1b97a05d-9548-45d2-a151-22583bcc7be4",
      "phone": "13812345678",
      "nickname": "测试用户",
      "realName": "张三"
    },
    "vehicle": {
      "id": "6a9c7dc6-8231-46c1-811c-d7b400078afc",
      "licensePlate": "粤A12345",
      "vin": "TEST123456789ABCD",
      "vehicleModel": {
        "modelName": "大通RV80",
        "brand": "上汽大通"
      }
    },
    "created_at": "2025-10-25T05:30:00.000Z"
  },
  "timestamp": "2025-10-25T05:30:00.000Z"
}
```

**错误响应**：

- `403`：无管理员权限
- `404`：订单不存在

---

### 7. 更新订单状态

**接口描述**：管理员更新订单状态（支付、取还车等流程）

**请求方法**：`PUT`

**请求路径**：`/api/admin/orders/:id/status`

**认证要求**：需管理员权限

**路径参数**：

| 参数名称 | 类型   | 必填 | 说明   |
| -------- | ------ | ---- | ------ |
| id       | string | 是   | 订单ID |

**请求参数**：

| 参数名称 | 类型   | 必填 | 说明                                                                     |
| -------- | ------ | ---- | ------------------------------------------------------------------------ |
| status   | string | 是   | 订单状态 (pending/paid/pickup/using/return/completed/cancelled/refunded) |
| remarks  | string | 否   | 状态更新备注                                                             |

**请求示例**：

```json
{
  "status": "paid",
  "remarks": "用户已完成支付"
}
```

**响应示例**：

```json
{
  "success": true,
  "code": 200,
  "message": "订单状态更新成功",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "orderNo": "ORD20251025123456001234",
    "status": "paid",
    "paymentStatus": "paid",
    "remarks": "用户已完成支付",
    "updated_at": "2025-10-25T06:00:00.000Z"
  },
  "timestamp": "2025-10-25T06:00:00.000Z"
}
```

**状态流转规则**：

- `pending` → `paid`, `cancelled`
- `paid` → `pickup`, `cancelled`
- `pickup` → `using`
- `using` → `return`
- `return` → `completed`
- `cancelled` → `refunded`

**错误响应**：

- `400`：缺少状态参数
- `403`：无管理员权限
- `500`：订单不存在 / 不允许的状态转换

---

### 8. 处理订单退款

**接口描述**：管理员处理已取消订单的退款

**请求方法**：`POST`

**请求路径**：`/api/admin/orders/:id/refund`

**认证要求**：需管理员权限

**路径参数**：

| 参数名称 | 类型   | 必填 | 说明   |
| -------- | ------ | ---- | ------ |
| id       | string | 是   | 订单ID |

**请求参数**：

| 参数名称     | 类型   | 必填 | 说明     |
| ------------ | ------ | ---- | -------- |
| refundAmount | string | 是   | 退款金额 |
| reason       | string | 否   | 退款原因 |

**请求示例**：

```json
{
  "refundAmount": "2846.00",
  "reason": "客户要求全额退款"
}
```

**响应示例**：

```json
{
  "success": true,
  "code": 200,
  "message": "退款处理成功",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "orderNo": "ORD20251025123456001234",
    "status": "refunded",
    "paymentStatus": "refunded",
    "refundAmount": "2846.00",
    "remarks": "退款原因: 客户要求全额退款",
    "updated_at": "2025-10-25T06:30:00.000Z"
  },
  "timestamp": "2025-10-25T06:30:00.000Z"
}
```

**错误响应**：

- `400`：缺少退款金额
- `403`：无管理员权限
- `500`：订单不存在 / 订单状态不允许退款 / 退款金额超过订单总额

---

## 数据模型

### 订单状态（OrderStatus）

| 状态值    | 说明   | 描述                     |
| --------- | ------ | ------------------------ |
| pending   | 待支付 | 订单已创建，等待用户支付 |
| paid      | 已支付 | 用户已完成支付           |
| pickup    | 待取车 | 等待用户取车             |
| using     | 使用中 | 用户正在使用车辆         |
| return    | 待还车 | 等待用户还车             |
| completed | 已完成 | 订单已完成               |
| cancelled | 已取消 | 订单已取消               |
| refunded  | 已退款 | 订单已退款               |

### 支付状态（PaymentStatus）

| 状态值    | 说明   | 描述         |
| --------- | ------ | ------------ |
| unpaid    | 未支付 | 尚未支付     |
| paid      | 已支付 | 已完成支付   |
| refunding | 退款中 | 正在处理退款 |
| refunded  | 已退款 | 退款已完成   |

### 订单类型（OrderType）

| 类型值        | 说明     | 描述             |
| ------------- | -------- | ---------------- |
| rv_rental     | 房车租赁 | 标准房车租赁订单 |
| special_offer | 特惠租车 | 特惠活动租车订单 |
| campsite      | 营地预订 | 营地预订订单     |
| custom_tour   | 定制旅游 | 定制旅游套餐订单 |

---

## 错误码说明

| HTTP状态码 | 错误说明         |
| ---------- | ---------------- |
| 200        | 请求成功         |
| 400        | 请求参数错误     |
| 401        | 未登录或令牌无效 |
| 403        | 无权限访问       |
| 404        | 资源不存在       |
| 500        | 服务器内部错误   |

---

## 使用示例

### 完整订单流程示例（Node.js/TypeScript）

```typescript
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';
const userToken = 'your-user-token';
const adminToken = 'your-admin-token';

// 1. 用户创建订单
async function createOrder() {
  const response = await axios.post(
    `${BASE_URL}/orders`,
    {
      vehicleId: '6a9c7dc6-8231-46c1-811c-d7b400078afc',
      startDate: '2025-11-01',
      endDate: '2025-11-05',
      needInsurance: true,
    },
    {
      headers: { Authorization: `Bearer ${userToken}` },
    }
  );

  console.log('订单创建成功:', response.data);
  return response.data.data.id;
}

// 2. 用户查看订单列表
async function getMyOrders() {
  const response = await axios.get(`${BASE_URL}/orders`, {
    headers: { Authorization: `Bearer ${userToken}` },
    params: { page: 1, pageSize: 10, status: 'pending' },
  });

  console.log('订单列表:', response.data);
}

// 3. 管理员更新订单状态为已支付
async function updateOrderStatus(orderId: string) {
  const response = await axios.put(
    `${BASE_URL}/admin/orders/${orderId}/status`,
    { status: 'paid', remarks: '支付成功' },
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    }
  );

  console.log('订单状态更新:', response.data);
}

// 4. 用户取消订单
async function cancelOrder(orderId: string) {
  const response = await axios.post(
    `${BASE_URL}/orders/${orderId}/cancel`,
    { reason: '行程变更' },
    {
      headers: { Authorization: `Bearer ${userToken}` },
    }
  );

  console.log('订单取消成功:', response.data);
}

// 5. 管理员处理退款
async function processRefund(orderId: string) {
  const response = await axios.post(
    `${BASE_URL}/admin/orders/${orderId}/refund`,
    {
      refundAmount: '2846.00',
      reason: '客户要求全额退款',
    },
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    }
  );

  console.log('退款处理成功:', response.data);
}
```

---

**文档版本**：v1.0.0
**最后更新**：2025-10-25
**维护者**：叨叨房车后端团队

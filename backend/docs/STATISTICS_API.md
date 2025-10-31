# 数据统计 API 文档

## 概述

数据统计 API 提供平台运营数据的统计分析功能，包括实时数据概览、订单统计、用户统计、收入统计、车辆统计和财务统计。

**版本**: v1.0  
**基础路径**: `/api/admin/statistics`  
**权限要求**: 管理员权限

---

## 数据模型

### TimeRange 枚举

时间范围枚举：

```typescript
enum TimeRange {
  DAY = 'day',       // 今日
  WEEK = 'week',     // 本周
  MONTH = 'month',   // 本月
  YEAR = 'year'      // 本年
}
```

---

## API 端点

### 1. 实时数据概览

#### GET /api/admin/statistics/overview

获取平台实时数据概览。

**请求参数**: 无

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "today": {
      "orders": {
        "count": 15,
        "amount": 4500,
        "growth": 12.5
      },
      "users": {
        "count": 8,
        "growth": 20.0
      },
      "revenue": {
        "amount": 4200,
        "growth": 15.3
      },
      "vehicleUtilization": {
        "rate": 75.5,
        "inUse": 30,
        "total": 40
      }
    },
    "total": {
      "users": 1250,
      "orders": 3580,
      "revenue": 856000,
      "vehicles": 40
    }
  }
}
```

---

### 2. 订单统计

#### GET /api/admin/statistics/orders

获取订单统计数据。

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| timeRange | TimeRange | 否 | 时间范围 |
| startDate | string | 否 | 开始日期 (YYYY-MM-DD) |
| endDate | string | 否 | 结束日期 (YYYY-MM-DD) |
| status | OrderStatus | 否 | 订单状态筛选 |

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "period": {
      "startDate": "2025-10-01",
      "endDate": "2025-10-28"
    },
    "totalCount": 358,
    "totalAmount": 107400,
    "averageAmount": 300,
    "byStatus": {
      "pending": 12,
      "paid": 45,
      "using": 30,
      "completed": 250,
      "cancelled": 21
    }
  }
}
```

---

### 3. 订单趋势

#### GET /api/admin/statistics/orders/trend

获取订单趋势数据。

**查询参数**: 同订单统计

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "period": {
      "startDate": "2025-10-01",
      "endDate": "2025-10-28"
    },
    "trend": [
      {
        "date": "2025-10-01",
        "count": 12,
        "amount": 3600
      },
      {
        "date": "2025-10-02",
        "count": 15,
        "amount": 4500
      }
    ]
  }
}
```

---

### 4. 按产品类型统计订单

#### GET /api/admin/statistics/orders/by-product

按产品类型统计订单数据。

**请求参数**: 无

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "rv": {
      "count": 250,
      "amount": 75000
    },
    "campsite": {
      "count": 80,
      "amount": 16000
    },
    "tour": {
      "count": 20,
      "amount": 12000
    },
    "specialOffer": {
      "count": 8,
      "amount": 4400
    }
  }
}
```

**注意**: 当前返回模拟数据，需要后续实现真实统计逻辑。

---

### 5. 用户统计

#### GET /api/admin/statistics/users

获取用户统计数据。

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| timeRange | TimeRange | 否 | 时间范围 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "period": {
      "startDate": "2025-10-01",
      "endDate": "2025-10-28"
    },
    "totalCount": 1250,
    "newCount": 85,
    "activeCount": 420,
    "activeRate": 33.6
  }
}
```

---

### 6. 用户增长趋势

#### GET /api/admin/statistics/users/growth

获取用户增长趋势。

**查询参数**: 同用户统计

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "period": {
      "startDate": "2025-10-01",
      "endDate": "2025-10-28"
    },
    "trend": [
      {
        "date": "2025-10-01",
        "newUsers": 3,
        "totalUsers": 1165
      },
      {
        "date": "2025-10-02",
        "newUsers": 5,
        "totalUsers": 1170
      }
    ]
  }
}
```

---

### 7. 用户行为分析

#### GET /api/admin/statistics/users/behavior

获取用户行为分析数据。

**查询参数**: 同用户统计

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "period": {
      "startDate": "2025-10-01",
      "endDate": "2025-10-28"
    },
    "conversionRate": 45.2,
    "repeatPurchaseRate": 32.8,
    "averageOrderValue": 300
  }
}
```

---

### 8. 收入统计

#### GET /api/admin/statistics/revenue

获取收入统计数据。

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| timeRange | TimeRange | 否 | 时间范围 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "period": {
      "startDate": "2025-10-01",
      "endDate": "2025-10-28"
    },
    "totalRevenue": 107400,
    "totalRefund": 0,
    "netRevenue": 107400
  }
}
```

**注意**: 当前退款金额返回 0，需要 Refund 实体实现后完善。

---

### 9. 收入趋势

#### GET /api/admin/statistics/revenue/trend

获取收入趋势数据。

**查询参数**: 同收入统计

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "period": {
      "startDate": "2025-10-01",
      "endDate": "2025-10-28"
    },
    "trend": [
      {
        "date": "2025-10-01",
        "revenue": 3600,
        "refund": 0,
        "net": 3600
      }
    ]
  }
}
```

---

### 10. 车辆统计

#### GET /api/admin/statistics/vehicles

获取车辆统计数据。

**请求参数**: 无

**响应示例**:

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "totalVehicles": 40,
    "availableVehicles": 25,
    "maintenanceVehicles": 5,
    "inUseVehicles": 10,
    "utilizationRate": 25.0
  }
}
```

---

### 11. 车辆利用率趋势

#### GET /api/admin/statistics/vehicles/utilization

获取车辆利用率趋势。

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| timeRange | TimeRange | 否 | 时间范围 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

---

### 12. 车辆收入排行

#### GET /api/admin/statistics/vehicles/revenue-ranking

获取车辆收入排行榜（Top 10）。

**查询参数**: 同车辆利用率趋势

---

### 13. 财务统计

#### GET /api/admin/statistics/finance

获取财务统计数据。

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| timeRange | TimeRange | 否 | 时间范围 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

---

### 14. 钱包统计

#### GET /api/admin/statistics/finance/wallet

获取钱包统计数据。

---

### 15. 提现统计

#### GET /api/admin/statistics/finance/withdrawal

获取提现统计数据。

**注意**: 当前返回模拟数据，需要 Withdrawal 实体实现后完善。

---

## 已知限制

1. **按产品类型统计**: 返回模拟数据，需要根据订单的 `orderType` 字段实现真实统计
2. **退款统计**: 返回 0，需要 Refund 实体实现后完善
3. **提现统计**: 返回模拟数据，需要 Withdrawal 实体实现后完善
4. **车辆品牌/型号**: 车辆收入排行中不包含品牌/型号信息，需要关联 VehicleModel 实体

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 无权限访问 |
| 500 | 服务器内部错误 |


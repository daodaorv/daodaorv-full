# API 设计规范

## 统一响应格式

所有 API 接口必须返回统一的 JSON 格式:

### 成功响应
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    // 实际数据
  },
  "timestamp": "2025-10-24T10:30:00.000Z"
}
```

### 错误响应
```json
{
  "code": 400,
  "message": "错误描述",
  "data": null,
  "timestamp": "2025-10-24T10:30:00.000Z"
}
```

## 认证 API

### 1. 用户注册
```
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "phone": "13800138000",
  "password": "password123",
  "nickname": "测试用户"
}

Response (200):
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "id": "uuid-string",
    "phone": "13800138000",
    "nickname": "测试用户",
    "status": "active"
  },
  "timestamp": "2025-10-24T10:30:00.000Z"
}
```

### 2. 用户登录
```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "phone": "13800138000",
  "password": "password123"
}

Response (200):
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-string",
      "phone": "13800138000",
      "nickname": "测试用户",
      "member_type": "regular"
    }
  },
  "timestamp": "2025-10-24T10:30:00.000Z"
}
```

### 3. 获取用户信息
```
GET /api/auth/profile
Authorization: Bearer {token}

Response (200):
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": "uuid-string",
    "phone": "13800138000",
    "nickname": "测试用户",
    "avatar": "https://...",
    "member_type": "regular",
    "auth_status": "verified"
  },
  "timestamp": "2025-10-24T10:30:00.000Z"
}
```

### 4. 用户登出
```
POST /api/auth/logout
Authorization: Bearer {token}

Response (200):
{
  "code": 200,
  "message": "登出成功",
  "data": null,
  "timestamp": "2025-10-24T10:30:00.000Z"
}
```

## 测试 API

### 1. Ping 测试
```
GET /api/test/ping

Response (200):
{
  "code": 200,
  "message": "pong",
  "data": {
    "timestamp": "2025-10-24T10:30:00.000Z",
    "server": "DaoDaoRV API Server",
    "version": "1.0.0"
  },
  "timestamp": "2025-10-24T10:30:00.000Z"
}
```

### 2. Echo 测试
```
GET /api/test/echo?message=hello

Response (200):
{
  "code": 200,
  "message": "Success",
  "data": {
    "echo": "hello",
    "timestamp": "2025-10-24T10:30:00.000Z"
  },
  "timestamp": "2025-10-24T10:30:00.000Z"
}
```

### 3. 获取车辆列表 (测试数据)
```
GET /api/test/vehicles?page=1&pageSize=10

Response (200):
{
  "code": 200,
  "message": "Success",
  "data": {
    "list": [
      {
        "id": "uuid-1",
        "license_plate": "京A12345",
        "brand": "大通",
        "model": "V90",
        "status": "available",
        "daily_price": 500,
        "images": ["https://..."],
        "features": {
          "seats": 4,
          "beds": 2,
          "kitchen": true
        }
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10
  },
  "timestamp": "2025-10-24T10:30:00.000Z"
}
```

### 4. 获取车辆详情 (测试数据)
```
GET /api/test/vehicles/:id

Response (200):
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": "uuid-1",
    "license_plate": "京A12345",
    "brand": "大通",
    "model": "V90",
    "year": 2023,
    "status": "available",
    "daily_price": 500,
    "deposit": 5000,
    "images": ["https://..."],
    "features": {
      "seats": 4,
      "beds": 2,
      "kitchen": true,
      "bathroom": true,
      "airConditioner": true
    },
    "description": "舒适的家庭房车..."
  },
  "timestamp": "2025-10-24T10:30:00.000Z"
}
```

## HTTP 状态码

- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未授权 (token 无效或过期)
- `403` - 禁止访问 (权限不足)
- `404` - 资源不存在
- `500` - 服务器内部错误

## 错误码

业务错误码在响应体的 `code` 字段中返回:

- `200` - 成功
- `400` - 请求参数错误
- `401` - 未授权
- `403` - 禁止访问
- `404` - 资源不存在
- `1001` - 用户不存在
- `1002` - 密码错误
- `1003` - 手机号已注册
- `1004` - token 无效
- `1005` - token 过期
- `2001` - 车辆不存在
- `2002` - 车辆不可用

## 认证机制

### JWT Token

- 使用 JWT (JSON Web Token) 进行认证
- Token 有效期: 7 天
- Token 存储位置:
  - 小程序: `wx.setStorageSync('token', token)`
  - PC 端: `localStorage.setItem('token', token)`
- Token 传递方式: HTTP Header `Authorization: Bearer {token}`

### Token 刷新

当 token 过期时,前端应:
1. 清除本地 token
2. 跳转到登录页
3. 提示用户重新登录

## CORS 配置

后端必须配置 CORS 允许以下来源:
- `http://localhost:3001` (PC 管理端开发环境)
- `http://localhost:10086` (小程序 H5 开发环境)
- 生产环境域名

允许的方法: `GET, POST, PUT, DELETE, OPTIONS`
允许的头部: `Content-Type, Authorization`

## 请求限流

为防止滥用,API 应实施请求限流:
- 登录接口: 每个 IP 每分钟最多 5 次
- 其他接口: 每个用户每分钟最多 100 次

## 日志记录

所有 API 请求应记录:
- 请求时间
- 请求方法和路径
- 请求参数
- 响应状态码
- 响应时间
- 用户 ID (如果已登录)
- IP 地址

## 数据验证

所有输入数据必须验证:
- 手机号: 11 位数字,符合中国手机号格式
- 密码: 6-20 位,包含字母和数字
- 分页参数: page >= 1, pageSize 在 1-100 之间


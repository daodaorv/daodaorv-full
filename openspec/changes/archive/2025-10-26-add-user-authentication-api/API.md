# 用户认证系统 API 文档

## 基础信息

- **Base URL**: `http://localhost:3001/api/auth`
- **认证方式**: JWT (JSON Web Token)
- **Content-Type**: `application/json`

## 公开接口（无需认证）

### 1. 用户注册

**接口**: `POST /api/auth/register`

**请求参数**:

```json
{
  "phone": "13800138000",
  "password": "Test123456",
  "nickname": "测试用户"
}
```

| 字段     | 类型   | 必填 | 说明                       |
| -------- | ------ | ---- | -------------------------- |
| phone    | string | 是   | 手机号（11 位，以 1 开头） |
| password | string | 是   | 密码（最少 6 位）          |
| nickname | string | 否   | 昵称（不填则自动生成）     |

**响应示例**:

```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "id": "uuid",
    "phone": "13800138000",
    "nickname": "测试用户",
    "memberType": "normal",
    "status": "normal",
    "created_at": "2025-10-25T10:00:00.000Z",
    "updated_at": "2025-10-25T10:00:00.000Z"
  },
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

### 2. 用户登录

**接口**: `POST /api/auth/login`

**请求参数**:

```json
{
  "phone": "13800138000",
  "password": "Test123456"
}
```

| 字段     | 类型   | 必填 | 说明   |
| -------- | ------ | ---- | ------ |
| phone    | string | 是   | 手机号 |
| password | string | 是   | 密码   |

**响应示例**:

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "phone": "13800138000",
      "nickname": "测试用户",
      "memberType": "normal",
      "status": "normal"
    }
  },
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

### 3. 忘记密码重置

**接口**: `POST /api/auth/reset-password`

**请求参数**:

```json
{
  "phone": "13800138000",
  "verifyCode": "123456",
  "newPassword": "NewPass123456"
}
```

| 字段        | 类型   | 必填 | 说明                              |
| ----------- | ------ | ---- | --------------------------------- |
| phone       | string | 是   | 手机号                            |
| verifyCode  | string | 是   | 短信验证码                        |
| newPassword | string | 是   | 新密码（6-20 位，包含字母和数字） |

**响应示例**:

```json
{
  "code": 200,
  "message": "密码重置成功，请重新登录",
  "data": null,
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

## 受保护接口（需要认证）

**认证方式**: 在请求头中携带 JWT 令牌

```
Authorization: Bearer <token>
```

### 4. 获取当前用户信息

**接口**: `GET /api/auth/profile`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "uuid",
    "phone": "13800138000",
    "nickname": "测试用户",
    "avatar": null,
    "realName": "张三",
    "idCard": "110101199001011234",
    "realNameStatus": "approved",
    "drivingLicense": "110101199001011234",
    "drivingLicenseStatus": "pending",
    "memberType": "plus",
    "status": "normal",
    "created_at": "2025-10-25T10:00:00.000Z",
    "updated_at": "2025-10-25T10:00:00.000Z"
  },
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

### 5. 退出登录

**接口**: `POST /api/auth/logout`

**响应示例**:

```json
{
  "code": 200,
  "message": "退出登录成功",
  "data": null,
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

### 6. 提交实名资料

**接口**: `POST /api/auth/real-name`

**请求参数**:

```json
{
  "realName": "张三",
  "idCard": "110101199001011234",
  "idCardFrontImage": "https://example.com/images/front.jpg",
  "idCardBackImage": "https://example.com/images/back.jpg"
}
```

| 字段             | 类型   | 必填 | 说明               |
| ---------------- | ------ | ---- | ------------------ |
| realName         | string | 是   | 真实姓名           |
| idCard           | string | 是   | 身份证号（18 位）  |
| idCardFrontImage | string | 是   | 身份证正面照片 URL |
| idCardBackImage  | string | 是   | 身份证背面照片 URL |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "message": "实名资料提交成功，等待审核"
  },
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

### 7. 提交驾照资料

**接口**: `POST /api/auth/driving-license`

**请求参数**:

```json
{
  "drivingLicense": "110101199001011234",
  "drivingLicenseFrontImage": "https://example.com/images/license-front.jpg",
  "drivingLicenseBackImage": "https://example.com/images/license-back.jpg"
}
```

| 字段                     | 类型   | 必填 | 说明               |
| ------------------------ | ------ | ---- | ------------------ |
| drivingLicense           | string | 是   | 驾驶证号（18 位）  |
| drivingLicenseFrontImage | string | 是   | 驾驶证正面照片 URL |
| drivingLicenseBackImage  | string | 是   | 驾驶证背面照片 URL |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "message": "驾照资料提交成功，等待审核"
  },
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

### 8. 修改密码

**接口**: `POST /api/auth/change-password`

**请求参数**:

```json
{
  "oldPassword": "OldPass123456",
  "newPassword": "NewPass123456"
}
```

| 字段        | 类型   | 必填 | 说明                              |
| ----------- | ------ | ---- | --------------------------------- |
| oldPassword | string | 是   | 旧密码                            |
| newPassword | string | 是   | 新密码（6-20 位，包含字母和数字） |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "message": "密码修改成功，请重新登录"
  },
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

### 9. 更换手机号

**接口**: `POST /api/auth/change-phone`

**请求参数**:

```json
{
  "oldPhone": "13800138000",
  "newPhone": "13900139000",
  "verifyCode": "123456"
}
```

| 字段       | 类型   | 必填 | 说明       |
| ---------- | ------ | ---- | ---------- |
| oldPhone   | string | 是   | 旧手机号   |
| newPhone   | string | 是   | 新手机号   |
| verifyCode | string | 是   | 短信验证码 |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "message": "手机号更换成功"
  },
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

## 错误响应格式

所有接口在发生错误时返回统一格式：

```json
{
  "code": 400,
  "message": "具体错误信息",
  "data": null,
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

### 常见错误码

| 错误码 | 说明             |
| ------ | ---------------- |
| 400    | 请求参数错误     |
| 401    | 未登录或令牌无效 |
| 403    | 无权限访问       |
| 404    | 资源不存在       |
| 500    | 服务器内部错误   |

---

## 认证状态枚举

### MemberType (会员类型)

- `normal` - 普通会员
- `plus` - PLUS 会员
- `crowdfunding` - 众筹车主

### AuthStatus (认证状态)

- `not_submitted` - 未提交
- `pending` - 审核中
- `approved` - 已通过
- `rejected` - 已拒绝

### UserStatus (账户状态)

- `normal` - 正常
- `frozen` - 冻结
- `banned` - 封禁

---

## 使用示例

### JavaScript/Fetch 示例

```javascript
// 用户登录
const loginResponse = await fetch("http://localhost:3001/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    phone: "13800138000",
    password: "Test123456",
  }),
});

const loginData = await loginResponse.json();
const token = loginData.data.token;

// 获取用户信息（带Token）
const profileResponse = await fetch("http://localhost:3001/api/auth/profile", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const profileData = await profileResponse.json();
console.log(profileData.data);
```

### cURL 示例

```bash
# 用户注册
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"Test123456","nickname":"测试用户"}'

# 用户登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"Test123456"}'

# 获取用户信息
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer <your-token>"
```

---

## 注意事项

1. **令牌有效期**: JWT 令牌有效期为 7 天，过期后需要重新登录
2. **令牌存储**: 令牌同时存储在 Redis 中，退出登录或修改密码会撤销令牌
3. **密码强度**: 密码必须为 6-20 位，且包含字母和数字
4. **身份证/驾驶证格式**: 必须为 18 位有效号码
5. **实名认证**: 提交驾照资料前必须先完成实名认证
6. **短信验证码**: 忘记密码和更换手机号功能需要短信验证码（当前版本暂未实现短信服务）

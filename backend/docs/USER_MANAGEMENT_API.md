# 用户管理 API 文档

## 基础信息

- **Base URL**: `http://localhost:3001/api/admin`
- **认证方式**: JWT (JSON Web Token) + 管理员权限
- **Content-Type**: `application/json`

## 认证说明

所有接口均需要管理员权限，在请求头中携带 JWT 令牌：

```
Authorization: Bearer <token>
```

注意：当前版本简化处理，所有已登录用户视为管理员。实际项目中需要从数据库验证管理员角色。

---

## 用户管理接口

### 1. 获取用户列表

**接口**: `GET /api/admin/users`

**查询参数**:

| 参数                 | 类型   | 必填 | 说明                                                    |
| -------------------- | ------ | ---- | ------------------------------------------------------- |
| page                 | number | 否   | 页码（默认 1）                                          |
| pageSize             | number | 否   | 每页数量（默认 20）                                     |
| status               | string | 否   | 用户状态（normal/frozen/banned）                        |
| memberType           | string | 否   | 会员类型（normal/plus/crowdfunding）                    |
| realNameStatus       | string | 否   | 实名认证状态（not_submitted/pending/approved/rejected） |
| drivingLicenseStatus | string | 否   | 驾照认证状态（not_submitted/pending/approved/rejected） |
| startDate            | string | 否   | 注册开始日期                                            |
| endDate              | string | 否   | 注册结束日期                                            |
| keyword              | string | 否   | 搜索关键词（手机号或昵称）                              |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "uuid",
        "phone": "13800138000",
        "nickname": "测试用户",
        "avatar": null,
        "memberType": "normal",
        "realNameStatus": "approved",
        "drivingLicenseStatus": "pending",
        "status": "normal",
        "created_at": "2025-10-25T10:00:00.000Z",
        "updated_at": "2025-10-25T10:00:00.000Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  },
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

### 2. 获取用户详情

**接口**: `GET /api/admin/users/:id`

**路径参数**:

| 参数 | 类型   | 必填 | 说明    |
| ---- | ------ | ---- | ------- |
| id   | string | 是   | 用户 ID |

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
    "idCardFrontImage": "https://example.com/images/front.jpg",
    "idCardBackImage": "https://example.com/images/back.jpg",
    "drivingLicense": "110101199001011234",
    "drivingLicenseFrontImage": "https://example.com/images/license-front.jpg",
    "drivingLicenseBackImage": "https://example.com/images/license-back.jpg",
    "memberType": "plus",
    "realNameStatus": "approved",
    "drivingLicenseStatus": "pending",
    "status": "normal",
    "created_at": "2025-10-25T10:00:00.000Z",
    "updated_at": "2025-10-25T10:00:00.000Z",
    "tags": [
      {
        "id": "tag-uuid",
        "tagName": "高频租车",
        "tagType": "behavior",
        "description": "租车次数超过 10 次",
        "createdBy": "admin-uuid",
        "created_at": "2025-10-25T10:00:00.000Z"
      }
    ],
    "auditLogs": [
      {
        "id": "log-uuid",
        "auditType": "realname",
        "auditResult": "approved",
        "auditReason": null,
        "auditBy": "admin-uuid",
        "created_at": "2025-10-25T10:00:00.000Z"
      }
    ]
  },
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

### 3. 更新用户信息

**接口**: `PUT /api/admin/users/:id`

**路径参数**:

| 参数 | 类型   | 必填 | 说明    |
| ---- | ------ | ---- | ------- |
| id   | string | 是   | 用户 ID |

**请求参数**:

```json
{
  "nickname": "新昵称",
  "avatar": "https://example.com/avatar.jpg",
  "memberType": "plus"
}
```

| 字段       | 类型   | 必填 | 说明                                 |
| ---------- | ------ | ---- | ------------------------------------ |
| nickname   | string | 否   | 昵称                                 |
| avatar     | string | 否   | 头像 URL                             |
| memberType | string | 否   | 会员类型（normal/plus/crowdfunding） |

**响应示例**:

```json
{
  "code": 200,
  "message": "用户信息更新成功",
  "data": {
    "id": "uuid",
    "nickname": "新昵称",
    "avatar": "https://example.com/avatar.jpg",
    "memberType": "plus"
  },
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

### 4. 更新用户状态

**接口**: `PUT /api/admin/users/:id/status`

**路径参数**:

| 参数 | 类型   | 必填 | 说明    |
| ---- | ------ | ---- | ------- |
| id   | string | 是   | 用户 ID |

**请求参数**:

```json
{
  "status": "frozen",
  "reason": "违反社区规则"
}
```

| 字段   | 类型   | 必填            | 说明                             |
| ------ | ------ | --------------- | -------------------------------- |
| status | string | 是              | 用户状态（normal/frozen/banned） |
| reason | string | 冻结/封禁时必填 | 冻结或封禁原因                   |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "message": "用户状态更新成功",
    "status": "frozen"
  },
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

## 资料审核接口

### 5. 审核实名资料

**接口**: `POST /api/admin/users/:id/audit/realname`

**路径参数**:

| 参数 | 类型   | 必填 | 说明    |
| ---- | ------ | ---- | ------- |
| id   | string | 是   | 用户 ID |

**请求参数**:

```json
{
  "auditResult": "approved",
  "auditReason": "照片不清晰"
}
```

| 字段        | 类型   | 必填       | 说明                          |
| ----------- | ------ | ---------- | ----------------------------- |
| auditResult | string | 是         | 审核结果（approved/rejected） |
| auditReason | string | 拒绝时必填 | 拒绝原因                      |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "message": "实名资料审核通过",
    "auditResult": "approved"
  },
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

### 6. 审核驾照资料

**接口**: `POST /api/admin/users/:id/audit/driving-license`

**路径参数**:

| 参数 | 类型   | 必填 | 说明    |
| ---- | ------ | ---- | ------- |
| id   | string | 是   | 用户 ID |

**请求参数**:

```json
{
  "auditResult": "rejected",
  "auditReason": "驾照已过期"
}
```

| 字段        | 类型   | 必填       | 说明                          |
| ----------- | ------ | ---------- | ----------------------------- |
| auditResult | string | 是         | 审核结果（approved/rejected） |
| auditReason | string | 拒绝时必填 | 拒绝原因                      |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "message": "驾照资料审核拒绝",
    "auditResult": "rejected"
  },
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

## 用户标签管理接口

### 7. 获取用户标签

**接口**: `GET /api/admin/users/:id/tags`

**路径参数**:

| 参数 | 类型   | 必填 | 说明    |
| ---- | ------ | ---- | ------- |
| id   | string | 是   | 用户 ID |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "tag-uuid",
      "userId": "user-uuid",
      "tagName": "高频租车",
      "tagType": "behavior",
      "description": "租车次数超过 10 次",
      "createdBy": "admin-uuid",
      "created_at": "2025-10-25T10:00:00.000Z",
      "updated_at": "2025-10-25T10:00:00.000Z"
    }
  ],
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

### 8. 添加用户标签

**接口**: `POST /api/admin/users/:id/tags`

**路径参数**:

| 参数 | 类型   | 必填 | 说明    |
| ---- | ------ | ---- | ------- |
| id   | string | 是   | 用户 ID |

**请求参数**:

```json
{
  "tagName": "VIP 客户",
  "tagType": "custom",
  "description": "消费金额超过 10000 元"
}
```

| 字段        | 类型   | 必填 | 说明                               |
| ----------- | ------ | ---- | ---------------------------------- |
| tagName     | string | 是   | 标签名称                           |
| tagType     | string | 否   | 标签类型（system/behavior/custom） |
| description | string | 否   | 标签描述                           |

**响应示例**:

```json
{
  "code": 200,
  "message": "标签添加成功",
  "data": {
    "id": "tag-uuid",
    "userId": "user-uuid",
    "tagName": "VIP 客户",
    "tagType": "custom",
    "description": "消费金额超过 10000 元",
    "createdBy": "admin-uuid",
    "created_at": "2025-10-25T10:00:00.000Z"
  },
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

### 9. 删除用户标签

**接口**: `DELETE /api/admin/users/:id/tags/:tagId`

**路径参数**:

| 参数  | 类型   | 必填 | 说明    |
| ----- | ------ | ---- | ------- |
| id    | string | 是   | 用户 ID |
| tagId | string | 是   | 标签 ID |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "message": "标签删除成功"
  },
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

### 10. 批量添加标签

**接口**: `POST /api/admin/users/tags/batch`

**请求参数**:

```json
{
  "userIds": ["user-uuid-1", "user-uuid-2", "user-uuid-3"],
  "tagName": "活动参与者",
  "tagType": "behavior"
}
```

| 字段    | 类型   | 必填 | 说明                               |
| ------- | ------ | ---- | ---------------------------------- |
| userIds | array  | 是   | 用户 ID 列表                       |
| tagName | string | 是   | 标签名称                           |
| tagType | string | 否   | 标签类型（system/behavior/custom） |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "message": "成功为 3 个用户添加标签",
    "successCount": 3,
    "totalCount": 3
  },
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

### 11. 获取所有标签列表

**接口**: `GET /api/admin/tags`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "tag_tagName": "高频租车",
      "tag_tagType": "behavior",
      "count": "15"
    },
    {
      "tag_tagName": "VIP 客户",
      "tag_tagType": "custom",
      "count": "8"
    }
  ],
  "timestamp": "2025-10-25T10:00:00.000Z"
}
```

---

### 12. 导出用户数据

**接口**: `GET /api/admin/users/export`

**查询参数**: （与获取用户列表接口相同，支持筛选条件）

| 参数                 | 类型   | 必填 | 说明                                                    |
| -------------------- | ------ | ---- | ------------------------------------------------------- |
| status               | string | 否   | 用户状态（normal/frozen/banned）                        |
| memberType           | string | 否   | 会员类型（normal/plus/crowdfunding）                    |
| realNameStatus       | string | 否   | 实名认证状态（not_submitted/pending/approved/rejected） |
| drivingLicenseStatus | string | 否   | 驾照认证状态（not_submitted/pending/approved/rejected） |
| startDate            | string | 否   | 注册开始日期                                            |
| endDate              | string | 否   | 注册结束日期                                            |
| keyword              | string | 否   | 搜索关键词（手机号或昵称）                              |

**响应说明**:

- 返回 Excel 文件（`.xlsx` 格式）
- 文件名格式：`用户列表_2025-10-25.xlsx`
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**导出字段**:

| 字段         | 说明                                   |
| ------------ | -------------------------------------- |
| 用户 ID      | 用户唯一标识                           |
| 手机号       | 自动脱敏（138\*\*\*\*8888）            |
| 昵称         | 用户昵称                               |
| 真实姓名     | 用户真实姓名                           |
| 身份证号     | 自动脱敏（110101\*\*\*\*\*\*\*\*1234） |
| 会员类型     | 普通会员/PLUS 会员/众筹车主            |
| 实名认证状态 | 未提交/审核中/已通过/已拒绝            |
| 驾照认证状态 | 未提交/审核中/已通过/已拒绝            |
| 账户状态     | 正常/冻结/封禁                         |
| 注册时间     | 用户注册时间                           |

**使用示例**:

```bash
# 导出所有用户
curl -X GET "http://localhost:3001/api/admin/users/export" \
  -H "Authorization: Bearer <your-token>" \
  -o "用户列表.xlsx"

# 导出筛选后的用户（PLUS 会员）
curl -X GET "http://localhost:3001/api/admin/users/export?memberType=plus" \
  -H "Authorization: Bearer <your-token>" \
  -o "PLUS会员列表.xlsx"
```

**注意事项**:

1. **自动脱敏**: 手机号和身份证号自动脱敏处理
2. **筛选支持**: 支持与用户列表接口相同的筛选条件
3. **数据量限制**: 建议单次导出不超过 10000 条数据
4. **文件编码**: Excel 文件使用 UTF-8 编码

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
| 403    | 无管理员权限     |
| 404    | 资源不存在       |
| 500    | 服务器内部错误   |

---

## 枚举类型说明

### UserStatus (用户状态)

- `normal` - 正常
- `frozen` - 冻结
- `banned` - 封禁

### MemberType (会员类型)

- `normal` - 普通会员
- `plus` - PLUS 会员
- `crowdfunding` - 众筹车主

### AuthStatus (认证状态)

- `not_submitted` - 未提交
- `pending` - 审核中
- `approved` - 已通过
- `rejected` - 已拒绝

### TagType (标签类型)

- `system` - 系统标签
- `behavior` - 行为标签
- `custom` - 自定义标签

---

## 使用示例

### JavaScript/Fetch 示例

```javascript
// 获取用户列表
const response = await fetch(
  "http://localhost:3001/api/admin/users?page=1&pageSize=20&status=normal",
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const data = await response.json();
console.log(data.data);

// 审核实名资料
const auditResponse = await fetch(
  "http://localhost:3001/api/admin/users/user-uuid/audit/realname",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      auditResult: "approved",
    }),
  }
);

const auditData = await auditResponse.json();
console.log(auditData);
```

### cURL 示例

```bash
# 获取用户列表
curl -X GET "http://localhost:3001/api/admin/users?page=1&pageSize=20" \
  -H "Authorization: Bearer <your-token>"

# 更新用户状态
curl -X PUT "http://localhost:3001/api/admin/users/user-uuid/status" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"frozen","reason":"违反规则"}'

# 添加用户标签
curl -X POST "http://localhost:3001/api/admin/users/user-uuid/tags" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"tagName":"VIP客户","tagType":"custom"}'
```

---

## 注意事项

1. **权限验证**: 所有接口需要管理员权限，当前版本简化处理
2. **状态管理**: 冻结/封禁用户时必须提供原因
3. **审核流程**: 审核拒绝时必须提供拒绝原因
4. **标签管理**: 相同标签不能重复添加
5. **数据脱敏**: 导出数据时自动脱敏手机号和身份证号
6. **审核前提**: 驾照审核前必须先完成实名认证

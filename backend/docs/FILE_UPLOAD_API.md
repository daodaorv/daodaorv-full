# 文件上传 API 文档

## 概述

文件上传模块提供了完整的文件管理功能，支持图片、文档上传，自动图片处理（缩略图、WebP 转换），以及与阿里云 OSS 的集成。

### 特性

- ✅ 支持图片和文档上传
- ✅ 自动生成多尺寸缩略图（200x200, 400x400, 800x800）
- ✅ 自动 WebP 格式转换
- ✅ 文件类型和大小验证
- ✅ 头像自动裁剪为正方形
- ✅ 身份证、驾驶证专用上传接口
- ✅ 批量上传支持
- ✅ 完整的文件生命周期管理
- ✅ 管理员文件统计和清理功能

### 配置要求

在 `.env` 文件中配置阿里云 OSS：

```env
# 阿里云 OSS 配置
OSS_REGION=oss-cn-beijing
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your_bucket_name
OSS_ENDPOINT=https://oss-cn-beijing.aliyuncs.com
OSS_DOMAIN=https://your-custom-domain.com  # 可选

# 文件上传限制
MAX_IMAGE_SIZE=5242880        # 5MB
MAX_DOCUMENT_SIZE=10485760    # 10MB
```

---

## 用户端 API

### 1. 上传图片

上传普通图片，支持自动缩略图和 WebP 转换。

**请求**

```http
POST /api/upload/image
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**参数**

| 参数         | 类型   | 必填 | 说明                                                              |
| ------------ | ------ | ---- | ----------------------------------------------------------------- |
| file         | File   | 是   | 图片文件（JPEG/PNG/WebP/GIF，最大 5MB）                           |
| businessType | string | 是   | 业务类型：avatar/idcard/license/vehicle/community/campsite/travel |
| relatedId    | string | 否   | 关联业务 ID                                                       |
| relatedType  | string | 否   | 关联业务类型                                                      |

**响应**

```json
{
  "code": 0,
  "message": "上传成功",
  "data": {
    "id": "uuid",
    "originalName": "test.jpg",
    "fileSize": 102400,
    "mimeType": "image/jpeg",
    "ossUrl": "https://bucket.oss-cn-beijing.aliyuncs.com/uploads/xxx.jpg",
    "ossKey": "uploads/xxx.jpg",
    "bucketName": "daodao-rv",
    "thumbnails": [
      {
        "size": "200x200",
        "url": "https://bucket.oss-cn-beijing.aliyuncs.com/uploads/xxx_thumb_200.jpg"
      },
      {
        "size": "400x400",
        "url": "https://bucket.oss-cn-beijing.aliyuncs.com/uploads/xxx_thumb_400.jpg"
      },
      {
        "size": "800x800",
        "url": "https://bucket.oss-cn-beijing.aliyuncs.com/uploads/xxx_thumb_800.jpg"
      }
    ],
    "webpUrl": "https://bucket.oss-cn-beijing.aliyuncs.com/uploads/xxx.webp",
    "fileType": "image",
    "businessType": "vehicle",
    "userId": "user-uuid",
    "status": "completed",
    "createdAt": "2025-10-29T12:00:00.000Z"
  }
}
```

---

### 2. 上传头像

上传用户头像，自动裁剪为 200x200 正方形。

**请求**

```http
POST /api/upload/avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**参数**

| 参数 | 类型 | 必填 | 说明                                |
| ---- | ---- | ---- | ----------------------------------- |
| file | File | 是   | 头像文件（JPEG/PNG/WebP，最大 5MB） |

**响应**

```json
{
  "code": 0,
  "message": "头像上传成功",
  "data": {
    "id": "uuid",
    "originalName": "avatar.jpg",
    "ossUrl": "https://bucket.oss-cn-beijing.aliyuncs.com/avatars/xxx_200x200.jpg",
    "businessType": "avatar",
    "fileSize": 15360,
    "createdAt": "2025-10-29T12:00:00.000Z"
  }
}
```

**说明**

- 每个用户只保留一个头像，上传新头像会自动删除旧头像
- 自动裁剪为 200x200 正方形
- 自动生成 WebP 版本

---

### 3. 上传身份证照片

上传身份证正反面照片。

**请求**

```http
POST /api/upload/idcard
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**参数**

| 参数 | 类型   | 必填 | 说明                             |
| ---- | ------ | ---- | -------------------------------- |
| file | File   | 是   | 身份证照片（JPEG/PNG，最大 5MB） |
| side | string | 是   | front（正面）或 back（反面）     |

**响应**

```json
{
  "code": 0,
  "message": "身份证上传成功",
  "data": {
    "id": "uuid",
    "originalName": "idcard_front.jpg",
    "ossUrl": "https://bucket.oss-cn-beijing.aliyuncs.com/idcards/xxx.jpg",
    "businessType": "idcard",
    "relatedType": "idcard",
    "relatedId": "front",
    "thumbnails": [...],
    "webpUrl": "...",
    "createdAt": "2025-10-29T12:00:00.000Z"
  }
}
```

---

### 4. 上传驾驶证照片

上传驾驶证照片。

**请求**

```http
POST /api/upload/license
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**参数**

| 参数 | 类型   | 必填 | 说明                             |
| ---- | ------ | ---- | -------------------------------- |
| file | File   | 是   | 驾驶证照片（JPEG/PNG，最大 5MB） |
| side | string | 是   | front（正面）或 back（副页）     |

**响应**

```json
{
  "code": 0,
  "message": "驾驶证上传成功",
  "data": {
    "id": "uuid",
    "originalName": "license.jpg",
    "ossUrl": "https://bucket.oss-cn-beijing.aliyuncs.com/licenses/xxx.jpg",
    "businessType": "license",
    "thumbnails": [...],
    "createdAt": "2025-10-29T12:00:00.000Z"
  }
}
```

---

### 5. 上传文档

上传文档文件（PDF、Word、Excel 等）。

**请求**

```http
POST /api/upload/document
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**参数**

| 参数        | 类型   | 必填 | 说明                                         |
| ----------- | ------ | ---- | -------------------------------------------- |
| file        | File   | 是   | 文档文件（PDF/DOC/DOCX/XLS/XLSX，最大 10MB） |
| relatedId   | string | 否   | 关联业务 ID                                  |
| relatedType | string | 否   | 关联业务类型                                 |

**响应**

```json
{
  "code": 0,
  "message": "文档上传成功",
  "data": {
    "id": "uuid",
    "originalName": "contract.pdf",
    "fileSize": 2048000,
    "mimeType": "application/pdf",
    "ossUrl": "https://bucket.oss-cn-beijing.aliyuncs.com/documents/xxx.pdf",
    "fileType": "document",
    "businessType": "document",
    "createdAt": "2025-10-29T12:00:00.000Z"
  }
}
```

---

### 6. 获取我的文件列表

获取当前用户上传的所有文件。

**请求**

```http
GET /api/upload/my-files
Authorization: Bearer {token}
```

**查询参数**

| 参数         | 类型   | 必填 | 默认值 | 说明                             |
| ------------ | ------ | ---- | ------ | -------------------------------- |
| page         | number | 否   | 1      | 页码                             |
| pageSize     | number | 否   | 20     | 每页数量                         |
| businessType | string | 否   | -      | 按业务类型筛选                   |
| fileType     | string | 否   | -      | 按文件类型筛选（image/document） |

**响应**

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "files": [
      {
        "id": "uuid",
        "originalName": "test.jpg",
        "ossUrl": "https://...",
        "fileType": "image",
        "businessType": "vehicle",
        "fileSize": 102400,
        "createdAt": "2025-10-29T12:00:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 7. 删除文件

删除自己上传的文件。

**请求**

```http
DELETE /api/upload/:fileId
Authorization: Bearer {token}
```

**路径参数**

| 参数   | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| fileId | string | 是   | 文件 ID |

**响应**

```json
{
  "code": 0,
  "message": "文件删除成功"
}
```

**说明**

- 只能删除自己上传的文件
- 删除时会同时删除 OSS 上的文件和数据库记录

---

## 管理员 API

### 1. 批量上传

管理员批量上传文件。

**请求**

```http
POST /api/admin/upload/batch
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data
```

**参数**

| 参数         | 类型   | 必填 | 说明                   |
| ------------ | ------ | ---- | ---------------------- |
| files        | File[] | 是   | 文件数组（最多 20 个） |
| businessType | string | 是   | 业务类型               |

**响应**

```json
{
  "code": 0,
  "message": "批量上传完成",
  "data": {
    "success": [
      {
        "id": "uuid",
        "originalName": "file1.jpg",
        "ossUrl": "..."
      }
    ],
    "failed": [
      {
        "file": "file2.jpg",
        "error": "文件过大"
      }
    ]
  }
}
```

---

### 2. 获取所有文件列表

管理员查看所有用户上传的文件。

**请求**

```http
GET /api/admin/upload/files
Authorization: Bearer {admin_token}
```

**查询参数**

| 参数         | 类型   | 必填 | 默认值 | 说明           |
| ------------ | ------ | ---- | ------ | -------------- |
| page         | number | 否   | 1      | 页码           |
| pageSize     | number | 否   | 20     | 每页数量       |
| userId       | string | 否   | -      | 按用户 ID 筛选 |
| businessType | string | 否   | -      | 按业务类型筛选 |
| fileType     | string | 否   | -      | 按文件类型筛选 |
| startDate    | string | 否   | -      | 开始日期       |
| endDate      | string | 否   | -      | 结束日期       |

**响应**

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "files": [...],
    "total": 1000,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 3. 删除任意文件

管理员删除任意用户的文件。

**请求**

```http
DELETE /api/admin/upload/:fileId
Authorization: Bearer {admin_token}
```

**路径参数**

| 参数   | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| fileId | string | 是   | 文件 ID |

**响应**

```json
{
  "code": 0,
  "message": "文件删除成功"
}
```

---

### 4. 上传统计

获取文件上传统计信息。

**请求**

```http
GET /api/admin/upload/stats
Authorization: Bearer {admin_token}
```

**响应**

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "totalFiles": 10000,
    "totalSize": 5368709120,
    "imageCount": 8000,
    "documentCount": 2000,
    "byBusinessType": {
      "avatar": 1000,
      "vehicle": 3000,
      "community": 2000,
      "document": 2000,
      "other": 2000
    },
    "todayUploads": 50,
    "monthUploads": 1500
  }
}
```

---

### 5. 清理未使用文件

清理指定天数内未关联业务的文件。

**请求**

```http
POST /api/admin/upload/clean
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**请求体**

```json
{
  "days": 30
}
```

**参数**

| 参数 | 类型   | 必填 | 默认值 | 说明                    |
| ---- | ------ | ---- | ------ | ----------------------- |
| days | number | 否   | 30     | 清理 N 天前未使用的文件 |

**响应**

```json
{
  "code": 0,
  "message": "清理完成",
  "data": {
    "deleted": 50
  }
}
```

---

## 错误码

| 错误码 | 说明             |
| ------ | ---------------- |
| 40001  | 文件不能为空     |
| 40002  | 不支持的文件类型 |
| 40003  | 文件大小超过限制 |
| 40004  | 图片处理失败     |
| 40005  | OSS 上传失败     |
| 40006  | 文件不存在       |
| 40007  | 无权操作该文件   |
| 40008  | 批量上传失败     |
| 50001  | 服务器内部错误   |

---

## 数据模型

### UploadFile 实体

| 字段         | 类型     | 说明                         |
| ------------ | -------- | ---------------------------- |
| id           | UUID     | 文件 ID                      |
| originalName | string   | 原始文件名                   |
| fileSize     | number   | 文件大小（字节）             |
| mimeType     | string   | MIME 类型                    |
| ossUrl       | string   | OSS 访问 URL                 |
| ossKey       | string   | OSS 存储键                   |
| bucketName   | string   | OSS Bucket 名称              |
| thumbnails   | JSON     | 缩略图信息                   |
| webpUrl      | string   | WebP 格式 URL                |
| fileType     | enum     | 文件类型（image/document）   |
| businessType | enum     | 业务类型                     |
| userId       | UUID     | 用户 ID                      |
| relatedId    | UUID     | 关联业务 ID                  |
| relatedType  | string   | 关联业务类型                 |
| status       | enum     | 状态（uploading/completed）  |
| auditStatus  | enum     | 审核状态（pending/approved） |
| auditRemark  | string   | 审核备注                     |
| createdAt    | datetime | 创建时间                     |
| updatedAt    | datetime | 更新时间                     |

### 业务类型枚举

```typescript
enum BusinessType {
  AVATAR = 'avatar', // 用户头像
  IDCARD = 'idcard', // 身份证照片
  LICENSE = 'license', // 驾驶证照片
  VEHICLE = 'vehicle', // 车辆图片
  COMMUNITY = 'community', // 社区图片
  CAMPSITE = 'campsite', // 营地图片
  TRAVEL = 'travel', // 旅游图片
  DOCUMENT = 'document', // 文档
  OTHER = 'other', // 其他
}
```

---

## 使用示例

### JavaScript/TypeScript

```typescript
// 上传图片
async function uploadImage(file: File, businessType: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('businessType', businessType);

  const response = await fetch('/api/upload/image', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await response.json();
  return result.data;
}

// 获取我的文件列表
async function getMyFiles(page = 1) {
  const response = await fetch(`/api/upload/my-files?page=${page}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();
  return result.data;
}

// 删除文件
async function deleteFile(fileId: string) {
  const response = await fetch(`/api/upload/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
}
```

### 微信小程序（uni-app）

```typescript
// 选择并上传图片
uni.chooseImage({
  count: 1,
  success: res => {
    const tempFilePath = res.tempFilePaths[0];

    uni.uploadFile({
      url: 'https://your-domain.com/api/upload/image',
      filePath: tempFilePath,
      name: 'file',
      formData: {
        businessType: 'vehicle',
      },
      header: {
        Authorization: `Bearer ${token}`,
      },
      success: uploadRes => {
        const data = JSON.parse(uploadRes.data);
        console.log('上传成功', data.data);
      },
    });
  },
});
```

---

## 注意事项

1. **文件大小限制**
   - 图片：最大 5MB
   - 文档：最大 10MB
   - 可通过环境变量调整

2. **支持的文件类型**
   - 图片：JPEG, PNG, WebP, GIF
   - 文档：PDF, DOC, DOCX, XLS, XLSX

3. **自动处理**
   - 图片自动生成 3 个尺寸缩略图
   - 图片自动转换为 WebP 格式
   - 头像自动裁剪为正方形

4. **安全性**
   - 所有接口需要 JWT 认证
   - 管理员接口需要管理员权限
   - 文件类型和大小验证
   - OSS 访问权限控制

5. **性能优化**
   - 使用 OSS CDN 加速访问
   - WebP 格式减少带宽占用
   - 缩略图减少加载时间

6. **清理策略**
   - 定期清理未使用文件
   - 删除用户时自动清理关联文件
   - OSS 生命周期管理

---

## 相关文档

- [阿里云 OSS 文档](https://help.aliyun.com/product/31815.html)
- [用户认证 API](./USER_AUTH_API.md)
- [数据字典](../../docs/数据字典.md)

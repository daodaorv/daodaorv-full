# 社区管理 API 文档

## 概述

社区管理 API 提供了完整的社区功能，包括帖子发布、评论互动、话题管理、举报处理等功能。

## 数据模型

### 1. 社区帖子 (CommunityPost)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 帖子ID |
| userId | UUID | 发布用户ID |
| type | PostType | 帖子类型（guide/experience/activity） |
| title | string | 标题（5-100字符） |
| content | string | 内容（10-10000字符） |
| coverImage | string | 封面图片 |
| images | string[] | 图片列表（最多9张） |
| videoUrl | string | 视频URL |
| cityId | UUID | 城市ID |
| tags | string[] | 标签列表 |
| topicId | UUID | 话题ID |
| status | PostStatus | 帖子状态 |
| auditStatus | AuditStatus | 审核状态 |
| auditRemark | string | 审核备注 |
| auditTime | Date | 审核时间 |
| auditorId | UUID | 审核员ID |
| viewCount | number | 浏览量 |
| likeCount | number | 点赞数 |
| commentCount | number | 评论数 |
| shareCount | number | 分享数 |
| collectCount | number | 收藏数 |
| isTop | boolean | 是否置顶 |
| isHot | boolean | 是否热门 |
| publishTime | Date | 发布时间 |

**帖子类型 (PostType)**:
- `guide` - 攻略
- `experience` - 体验
- `activity` - 活动招募

**帖子状态 (PostStatus)**:
- `pending` - 待审核
- `approved` - 已通过
- `rejected` - 已拒绝
- `deleted` - 已删除

**审核状态 (AuditStatus)**:
- `pending` - 待审核
- `approved` - 已通过
- `rejected` - 已拒绝

### 2. 社区评论 (CommunityComment)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 评论ID |
| postId | UUID | 帖子ID |
| userId | UUID | 评论用户ID |
| content | string | 评论内容（1-500字符） |
| parentId | UUID | 父评论ID（回复评论时） |
| replyToUserId | UUID | 被回复用户ID |
| status | CommentStatus | 评论状态 |
| auditStatus | AuditStatus | 审核状态 |
| auditRemark | string | 审核备注 |
| likeCount | number | 点赞数 |

**评论状态 (CommentStatus)**:
- `pending` - 待审核
- `approved` - 已通过
- `rejected` - 已拒绝
- `deleted` - 已删除

### 3. 社区话题 (CommunityTopic)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 话题ID |
| name | string | 话题名称 |
| description | string | 话题描述 |
| coverImage | string | 封面图片 |
| postCount | number | 帖子数量 |
| followCount | number | 关注数 |
| isHot | boolean | 是否热门 |
| sortOrder | number | 排序权重 |
| isActive | boolean | 是否启用 |

### 4. 用户互动记录 (CommunityInteraction)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 记录ID |
| userId | UUID | 用户ID |
| targetType | TargetType | 目标类型（post/comment） |
| targetId | UUID | 目标ID |
| interactionType | InteractionType | 互动类型（like/collect/share） |

**目标类型 (TargetType)**:
- `POST` - 帖子
- `COMMENT` - 评论

**互动类型 (InteractionType)**:
- `LIKE` - 点赞
- `COLLECT` - 收藏
- `SHARE` - 分享

### 5. 举报记录 (CommunityReport)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 举报ID |
| reporterId | UUID | 举报人ID |
| targetType | TargetType | 举报目标类型 |
| targetId | UUID | 举报目标ID |
| reportType | ReportType | 举报类型 |
| reason | string | 举报原因（5-500字符） |
| status | ReportStatus | 处理状态 |
| handleResult | string | 处理结果 |
| handleTime | Date | 处理时间 |
| handlerId | UUID | 处理人ID |

**举报类型 (ReportType)**:
- `BAD_CONTENT` - 不良内容
- `AD` - 广告
- `FRAUD` - 欺诈
- `INFRINGEMENT` - 侵权

**举报状态 (ReportStatus)**:
- `PENDING` - 待处理
- `PROCESSING` - 处理中
- `RESOLVED` - 已解决
- `REJECTED` - 已拒绝

## 业务规则

### 帖子发布规则

1. **用户权限**：用户必须登录才能发布帖子
2. **内容限制**：
   - 标题长度：5-100 字符
   - 内容长度：10-10000 字符
   - 图片数量：0-9 张
   - 视频数量：0-1 个
3. **审核机制**：
   - 所有新帖子进入待审核状态
   - 审核通过后才能展示
   - 审核拒绝后不展示，通知用户
4. **编辑限制**：只能编辑待审核或已拒绝的帖子

### 内容审核规则

1. **审核标准**：
   - 无违法违规内容
   - 无不良信息
   - 无攻击性语言
   - 图片/视频合规
   - 与平台主题相关
2. **审核时限**：24小时内完成审核
3. **审核结果**：
   - 通过：状态变为已通过，可展示
   - 拒绝：状态变为已拒绝，不展示，通知用户

### 互动规则

1. **点赞**：
   - 用户可对帖子和评论点赞
   - 再次点击取消点赞
2. **收藏**：
   - 用户可收藏帖子
   - 再次点击取消收藏
   - 只有帖子可以被收藏
3. **分享**：
   - 用户可分享帖子
   - 记录分享次数
4. **评论**：
   - 用户可对帖子发表评论
   - 可回复其他评论
   - 评论需要审核

### 举报处理规则

1. **举报提交**：
   - 用户可举报不良帖子和评论
   - 举报原因：5-500 字符
   - 举报类型：不良内容、广告、欺诈、侵权
2. **举报处理**：
   - 举报提交后进入待处理状态
   - 管理员审核并决定处理方式
   - 处理方式：删除内容、警告用户、封禁用户、拒绝举报
3. **结果通知**：
   - 处理完成后通知举报人和被举报人

## API 端点

### 用户端 API

#### 1. 发布帖子

```
POST /api/community/posts
```

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "type": "guide",
  "title": "房车自驾游攻略",
  "content": "详细的攻略内容...",
  "coverImage": "https://...",
  "images": ["https://...", "https://..."],
  "videoUrl": "https://...",
  "cityId": "uuid",
  "tags": ["自驾游", "房车"],
  "topicId": "uuid"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "发布成功，等待审核",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "type": "guide",
    "title": "房车自驾游攻略",
    "status": "pending",
    "auditStatus": "pending",
    "createdAt": "2025-10-28T10:00:00Z"
  }
}
```

#### 2. 获取帖子列表

```
GET /api/community/posts?type=guide&cityId=uuid&topicId=uuid&keyword=关键词&page=1&pageSize=20
```

**响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

#### 3. 获取帖子详情

```
GET /api/community/posts/:id
```

**响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": "uuid",
    "title": "房车自驾游攻略",
    "content": "...",
    "viewCount": 100,
    "likeCount": 50,
    "commentCount": 20
  }
}
```

#### 4. 删除帖子

```
DELETE /api/community/posts/:id
```

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 200,
  "message": "删除成功"
}
```

#### 5. 发表评论

```
POST /api/community/posts/:id/comments
```

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "content": "很棒的攻略！",
  "parentId": "uuid",
  "replyToUserId": "uuid"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "评论成功，等待审核",
  "data": {
    "id": "uuid",
    "postId": "uuid",
    "content": "很棒的攻略！",
    "status": "pending"
  }
}
```

#### 6. 获取评论列表

```
GET /api/community/posts/:id/comments?page=1&pageSize=20
```

**响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [...],
    "total": 50,
    "page": 1,
    "pageSize": 20
  }
}
```

#### 7. 删除评论

```
DELETE /api/community/comments/:id
```

**请求头**:
```
Authorization: Bearer <token>
```

#### 8. 点赞/取消点赞帖子

```
POST /api/community/posts/:id/like
```

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 200,
  "message": "点赞成功",
  "data": {
    "liked": true
  }
}
```

#### 9. 收藏/取消收藏帖子

```
POST /api/community/posts/:id/collect
```

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 200,
  "message": "收藏成功",
  "data": {
    "collected": true
  }
}
```

#### 10. 分享帖子

```
POST /api/community/posts/:id/share
```

**请求头**:
```
Authorization: Bearer <token>
```

#### 11. 获取话题列表

```
GET /api/community/topics?keyword=关键词&isHot=true&page=1&pageSize=20
```

#### 12. 获取话题下的帖子

```
GET /api/community/topics/:id/posts?page=1&pageSize=20
```

#### 13. 提交举报

```
POST /api/community/reports
```

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "targetType": "POST",
  "targetId": "uuid",
  "reportType": "BAD_CONTENT",
  "reason": "包含不良内容"
}
```

### 管理端 API

#### 1. 获取帖子列表（含待审核）

```
GET /api/admin/community/posts?type=guide&status=pending&auditStatus=pending&page=1&pageSize=20
```

**请求头**:
```
Authorization: Bearer <admin_token>
```

#### 2. 审核帖子

```
PUT /api/admin/community/posts/:id/audit
```

**请求头**:
```
Authorization: Bearer <admin_token>
```

**请求体**:
```json
{
  "auditStatus": "approved",
  "auditRemark": "内容合规"
}
```

#### 3. 删除帖子

```
DELETE /api/admin/community/posts/:id
```

**请求头**:
```
Authorization: Bearer <admin_token>
```

#### 4. 置顶/取消置顶帖子

```
PUT /api/admin/community/posts/:id/top
```

**请求头**:
```
Authorization: Bearer <admin_token>
```

#### 5. 获取评论列表（含待审核）

```
GET /api/admin/community/comments?postId=uuid&status=pending&page=1&pageSize=20
```

**请求头**:
```
Authorization: Bearer <admin_token>
```

#### 6. 审核评论

```
PUT /api/admin/community/comments/:id/audit
```

**请求头**:
```
Authorization: Bearer <admin_token>
```

**请求体**:
```json
{
  "auditStatus": "approved",
  "auditRemark": "评论合规"
}
```

#### 7. 创建话题

```
POST /api/admin/community/topics
```

**请求头**:
```
Authorization: Bearer <admin_token>
```

**请求体**:
```json
{
  "name": "房车自驾",
  "description": "房车自驾相关话题",
  "coverImage": "https://...",
  "sortOrder": 100
}
```

#### 8. 更新话题

```
PUT /api/admin/community/topics/:id
```

**请求头**:
```
Authorization: Bearer <admin_token>
```

#### 9. 删除话题

```
DELETE /api/admin/community/topics/:id
```

**请求头**:
```
Authorization: Bearer <admin_token>
```

#### 10. 获取举报列表

```
GET /api/admin/community/reports?targetType=POST&status=pending&page=1&pageSize=20
```

**请求头**:
```
Authorization: Bearer <admin_token>
```

#### 11. 处理举报

```
PUT /api/admin/community/reports/:id/handle
```

**请求头**:
```
Authorization: Bearer <admin_token>
```

**请求体**:
```json
{
  "status": "resolved",
  "handleResult": "已删除违规内容并警告用户"
}
```

#### 12. 获取社区统计数据

```
GET /api/admin/community/statistics
```

**请求头**:
```
Authorization: Bearer <admin_token>
```

**响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "totalPosts": 1000,
    "totalComments": 5000,
    "totalUsers": 500,
    "pendingAuditPosts": 10,
    "pendingAuditComments": 20,
    "pendingReports": 5,
    "todayPosts": 50,
    "todayComments": 200,
    "todayReports": 2
  }
}
```

## 错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未登录或 Token 无效 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 注意事项

1. 所有需要认证的接口都需要在请求头中携带 `Authorization: Bearer <token>`
2. 管理端接口需要管理员权限
3. 帖子和评论发布后需要审核才能展示
4. 图片和视频需要先通过文件上传 API 上传，获取 URL 后再提交
5. 分页参数默认值：page=1, pageSize=20
6. 所有时间字段使用 ISO 8601 格式


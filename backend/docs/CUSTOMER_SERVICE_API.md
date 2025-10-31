# 客服系统 API 文档

## 概述

客服系统 API 提供在线客服会话、工单管理、快捷回复等功能，支持用户端、客服端和管理端三种角色。

## 数据模型

### 1. 客服会话 (CustomerServiceSession)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 会话ID |
| sessionNo | string | 会话编号（CSS前缀） |
| userId | UUID | 用户ID |
| staffId | UUID | 客服人员ID |
| storeId | UUID | 门店ID |
| source | enum | 来源渠道（WECHAT/ALIPAY/DOUYIN/H5） |
| status | enum | 会话状态（WAITING/SERVING/CLOSED） |
| priority | enum | 优先级（LOW/NORMAL/HIGH/URGENT） |
| relatedOrderId | UUID | 关联订单ID |
| relatedOrderType | string | 关联订单类型 |
| firstResponseTime | Date | 首次响应时间 |
| lastMessageTime | Date | 最后消息时间 |
| closedAt | Date | 关闭时间 |
| satisfaction | number | 满意度评分（1-5） |
| comment | string | 评价内容 |
| tags | string[] | 会话标签 |

### 2. 客服消息 (CustomerServiceMessage)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 消息ID |
| sessionId | UUID | 会话ID |
| senderType | enum | 发送者类型（USER/STAFF/SYSTEM） |
| senderId | UUID | 发送者ID |
| messageType | enum | 消息类型（TEXT/IMAGE/VOICE/VIDEO/ORDER_CARD/QUICK_REPLY） |
| content | string | 消息内容 |
| mediaUrl | string | 媒体文件URL |
| orderCardData | JSON | 订单卡片数据 |
| isRead | boolean | 是否已读 |
| readAt | Date | 已读时间 |

### 3. 客服工单 (CustomerServiceTicket)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 工单ID |
| ticketNo | string | 工单编号（CST前缀） |
| sessionId | UUID | 关联会话ID |
| userId | UUID | 用户ID |
| assignedStaffId | UUID | 分配客服ID |
| category | enum | 工单类别（ORDER/PAYMENT/VEHICLE/COMPLAINT/OTHER） |
| priority | enum | 优先级（LOW/NORMAL/HIGH/URGENT） |
| title | string | 工单标题 |
| description | string | 问题描述 |
| attachments | string[] | 附件URL列表 |
| status | enum | 工单状态（PENDING/PROCESSING/RESOLVED/CLOSED） |
| resolution | string | 解决方案 |
| resolvedAt | Date | 解决时间 |
| closedAt | Date | 关闭时间 |

### 4. 快捷回复 (QuickReply)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 快捷回复ID |
| category | string | 分类 |
| title | string | 标题 |
| content | string | 回复内容 |
| keywords | string[] | 关键词列表 |
| usageCount | number | 使用次数 |
| isActive | boolean | 是否启用 |

## 业务规则

### 会话创建规则
- 用户首次咨询时自动创建会话
- 自动识别用户所属门店（订单门店 > 定位门店 > 总部）
- 根据门店配置自动分配客服
- 如门店客服离线，转接至总部客服
- 会话优先级根据用户标签和订单状态自动判定

### 消息路由规则
- 用户消息自动路由到分配的客服
- 客服离线时消息进入待处理队列
- 支持客服主动转接会话
- 转接次数限制（最多3次）
- 转接必须填写转接原因

### SLA 规则
- 首次响应时间目标：< 90秒
- 工作时间响应：< 5分钟
- 非工作时间自动回复
- 超时会话自动提升优先级
- 响应时间纳入客服绩效考核

### 工单管理规则
- 复杂问题可转为工单
- 工单必须分配给具体客服
- 工单状态流转：待处理 → 处理中 → 已解决 → 已关闭
- 工单解决期限：普通24小时，紧急4小时
- 逾期工单自动提醒

## API 端点

### 用户端 API

#### 1. 创建会话
```
POST /api/customer-service/sessions
```

**请求参数**：
```json
{
  "source": "WECHAT",
  "relatedOrderId": "uuid",
  "relatedOrderType": "rental"
}
```

#### 2. 获取我的会话列表
```
GET /api/customer-service/sessions?page=1&pageSize=10&status=SERVING
```

#### 3. 获取会话详情
```
GET /api/customer-service/sessions/:id
```

#### 4. 发送消息
```
POST /api/customer-service/sessions/:id/messages
```

**请求参数**：
```json
{
  "messageType": "TEXT",
  "content": "您好，我想咨询一下...",
  "mediaUrl": "https://..."
}
```

#### 5. 获取消息列表
```
GET /api/customer-service/sessions/:id/messages?page=1&pageSize=20
```

#### 6. 关闭会话
```
PUT /api/customer-service/sessions/:id/close
```

#### 7. 评价客服
```
POST /api/customer-service/sessions/:id/rate
```

**请求参数**：
```json
{
  "satisfaction": 5,
  "comment": "服务很好"
}
```

#### 8. 创建工单
```
POST /api/customer-service/tickets
```

**请求参数**：
```json
{
  "category": "ORDER",
  "title": "订单问题",
  "description": "订单无法取消",
  "attachments": ["https://..."]
}
```

#### 9. 获取我的工单列表
```
GET /api/customer-service/tickets?page=1&pageSize=10&status=PENDING
```

#### 10. 获取工单详情
```
GET /api/customer-service/tickets/:id
```

### 客服端 API

#### 1. 获取会话列表
```
GET /api/staff/customer-service/sessions?page=1&pageSize=10&status=WAITING
```

#### 2. 接受会话
```
POST /api/staff/customer-service/sessions/:id/accept
```

#### 3. 转接会话
```
POST /api/staff/customer-service/sessions/:id/transfer
```

**请求参数**：
```json
{
  "targetStaffId": "uuid",
  "reason": "专业问题需要转接"
}
```

#### 4. 获取快捷回复列表
```
GET /api/staff/customer-service/quick-replies?category=常见问题&keyword=退款
```

### 管理端 API

#### 1. 获取所有会话列表
```
GET /api/admin/customer-service/sessions?page=1&pageSize=10&status=SERVING&storeId=uuid
```

#### 2. 获取所有工单列表
```
GET /api/admin/customer-service/tickets?page=1&pageSize=10&status=PENDING&category=ORDER
```

#### 3. 分配工单
```
PUT /api/admin/customer-service/tickets/:id/assign
```

**请求参数**：
```json
{
  "staffId": "uuid"
}
```

#### 4. 获取统计数据
```
GET /api/admin/customer-service/statistics
```

**响应示例**：
```json
{
  "totalSessions": 1000,
  "waitingSessions": 5,
  "servingSessions": 20,
  "closedSessions": 975,
  "averageResponseTime": 45,
  "averageSatisfaction": 4.8,
  "totalTickets": 100,
  "pendingTickets": 10
}
```

#### 5. 创建快捷回复
```
POST /api/admin/customer-service/quick-replies
```

**请求参数**：
```json
{
  "category": "常见问题",
  "title": "退款流程",
  "content": "退款流程如下：...",
  "keywords": ["退款", "退钱"]
}
```

#### 6. 更新快捷回复
```
PUT /api/admin/customer-service/quick-replies/:id
```

#### 7. 删除快捷回复
```
DELETE /api/admin/customer-service/quick-replies/:id
```

#### 8. 获取快捷回复列表
```
GET /api/admin/customer-service/quick-replies?page=1&pageSize=10&category=常见问题&keyword=退款
```

## 错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 参数错误 |
| 401 | 未登录 |
| 403 | 无权访问 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

## 注意事项

1. 所有需要认证的接口都需要在请求头中携带 JWT Token
2. 管理端接口需要管理员权限
3. 客服端接口需要客服人员权限
4. 会话和工单编号自动生成，不可修改
5. 消息发送后会自动更新会话的最后消息时间
6. 会话关闭后不可再发送消息
7. 工单解决后可以重新打开
8. 快捷回复使用次数会自动累加

## 开发状态

- ✅ 数据模型层（5个实体）
- ✅ 服务层（4个服务）
- ✅ 控制器层（2个控制器）
- ✅ 路由配置
- ✅ TypeScript 编译验证
- ✅ 测试通过（166/166）
- ✅ API 文档

## 后续优化

1. 实现 WebSocket 实时消息推送
2. 实现客服工作台界面
3. 实现智能客服机器人
4. 实现客服绩效统计
5. 实现会话质检功能
6. 实现客服排班管理
7. 实现多媒体消息处理
8. 实现会话记录导出


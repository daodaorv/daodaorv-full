# Spec: 用户登录与注册功能

**Capability**: `login`
**Status**: ADDED
**Version**: 1.0.0
**Last Updated**: 2025-10-29

---

## Overview

用户登录与注册功能是平台的核心基础功能,支持多平台一键登录(微信/支付宝/抖音)和手机号验证码登录,为所有需要用户身份认证的功能提供前置支持。

---

## ADDED Requirements

### Requirement: 多平台一键登录

系统 MUST 支持多平台一键登录,包括微信小程序、支付宝小程序、抖音小程序的一键登录,以及 H5 平台的提示。

#### Scenario: 微信小程序一键登录

**Given** 用户在微信小程序中打开登录页面
**And** 用户已勾选用户协议
**When** 用户点击"微信一键登录"按钮
**Then** 系统调用 `uni.login()` 获取 code
**And** 系统调用 `uni.getUserProfile()` 获取用户信息(可选)
**And** 系统调用后端 `POST /api/auth/wechat-login` 接口
**And** 后端返回 token 和用户信息
**And** 系统保存 token 到 localStorage 和 Pinia store
**And** 系统获取重定向路径并跳转到原目标页面或首页

#### Scenario: H5 平台一键登录提示

**Given** 用户在 H5 平台打开登录页面
**When** 页面加载完成
**Then** 系统检测到当前平台为 H5
**And** 系统隐藏一键登录按钮
**And** 系统显示提示"当前平台不支持一键登录,请使用手机号登录"
**And** 系统显示手机号验证码登录表单

---

### Requirement: 手机号验证码登录

系统 MUST 支持手机号验证码登录,包括验证码发送、验证码验证和登录流程。

#### Scenario: 发送验证码

**Given** 用户在登录页面选择"手机号登录"
**When** 用户输入手机号并点击"获取验证码"按钮
**Then** 系统验证手机号格式(11 位数字)
**And** 如果格式错误,显示提示"请输入正确的手机号"
**And** 如果格式正确,调用后端 `POST /api/auth/send-code` 接口
**And** 后端发送验证码短信
**And** 前端显示提示"验证码已发送"
**And** 开始 60 秒倒计时
**And** 倒计时期间按钮禁用并显示剩余秒数
**And** 倒计时结束后按钮恢复可用

#### Scenario: 验证码登录成功

**Given** 用户已获取验证码
**And** 用户已勾选用户协议
**When** 用户输入验证码并点击"登录"按钮
**Then** 系统验证手机号格式(11 位数字)
**And** 系统验证验证码格式(6 位数字)
**And** 系统显示加载提示"登录中..."
**And** 系统调用后端 `POST /api/auth/sms-login` 接口
**And** 后端验证验证码并返回 token 和用户信息
**And** 系统保存 token 到 localStorage 和 Pinia store
**And** 系统隐藏加载提示
**And** 系统获取重定向路径并跳转

#### Scenario: 登录失败处理

**Given** 用户尝试登录
**When** 后端返回错误(验证码错误、网络错误等)
**Then** 系统隐藏加载提示
**And** 系统显示错误提示(根据错误类型显示不同提示)
**And** 用户可以重新尝试登录

---

### Requirement: 用户协议验证

系统 MUST 要求用户勾选用户协议才能登录,未勾选时阻止登录并提示。

#### Scenario: 用户协议未勾选

**Given** 用户在登录页面
**When** 用户未勾选用户协议并点击登录按钮
**Then** 系统检测到用户协议未勾选
**And** 系统显示提示"请先阅读并同意用户协议"
**And** 系统阻止登录操作

---

### Requirement: Token 管理

系统 MUST 管理用户 Token,包括保存、持久化和自动携带。

#### Scenario: Token 保存和持久化

**Given** 用户登录成功
**When** 后端返回 token
**Then** 系统保存 token 到 localStorage
**And** 系统保存 token 到 Pinia store
**And** 系统保存用户信息到 Pinia store
**And** 后续所有需要认证的接口请求头自动携带 token

---

### Requirement: 智能重定向

系统 MUST 支持智能重定向,登录成功后自动返回原目标页面。

#### Scenario: 路由拦截器集成

**Given** 用户未登录
**When** 用户访问需要登录的页面(如"我的订单")
**Then** 路由拦截器检测到用户未登录
**And** 系统保存原目标路径到 router
**And** 系统跳转到登录页面
**And** 用户完成登录
**And** 系统自动跳转回"我的订单"页面

---

## Non-Functional Requirements

### NFR-1: 性能

- 登录响应时间 < 2s
- 页面加载时间 < 1s
- 验证码发送响应时间 < 3s

### NFR-2: 安全性

- 使用 HTTPS 传输
- Token 使用 JWT 加密
- 验证码 60 秒有效期
- 手机号和验证码格式验证

### NFR-3: 可用性

- 支持微信小程序、H5、支付宝小程序、抖音小程序
- 错误提示清晰友好
- 倒计时显示准确

---

## API Contracts

### POST /api/auth/wechat-login

**Request**:

```json
{
  "code": "string",
  "nickname": "string (optional)",
  "avatar": "string (optional)"
}
```

**Response**:

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "string",
    "user": {
      "id": "string",
      "phone": "string",
      "nickname": "string",
      "avatar": "string",
      "platform": "WECHAT"
    }
  }
}
```

### POST /api/auth/sms-login

**Request**:

```json
{
  "phone": "string",
  "code": "string"
}
```

**Response**:

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "string",
    "user": {
      "id": "string",
      "phone": "string",
      "nickname": "string",
      "avatar": "string",
      "platform": "PHONE"
    }
  }
}
```

### POST /api/auth/send-code

**Request**:

```json
{
  "phone": "string"
}
```

**Response**:

```json
{
  "code": 200,
  "message": "验证码已发送",
  "data": null
}
```

---

## Data Models

### User

```typescript
interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar: string;
  platform: "WECHAT" | "ALIPAY" | "DOUYIN" | "PHONE";
  wechatOpenid?: string;
  alipayUserId?: string;
  douyinOpenid?: string;
  createdAt: string;
  updatedAt: string;
}
```

### LoginState

```typescript
interface LoginState {
  loginMode: "quick" | "phone";
  platform: "wechat" | "alipay" | "douyin" | "h5";
  phone: string;
  code: string;
  countdown: number;
  agreedToTerms: boolean;
}
```

---

## Dependencies

### Frontend Dependencies

- `miniprogram/api/modules/user.ts` - API 模块(已完成)
- `miniprogram/store/modules/user.ts` - Pinia Store(已完成)
- `miniprogram/utils/router.ts` - 路由工具(已完成)
- `miniprogram/utils/auth.ts` - Token 管理(已完成)

### Backend Dependencies

- `POST /api/auth/wechat-login` - 微信一键登录(已完成)
- `POST /api/auth/alipay-login` - 支付宝一键登录(已完成,预留)
- `POST /api/auth/douyin-login` - 抖音一键登录(已完成,预留)
- `POST /api/auth/sms-login` - 手机号验证码登录(已完成)
- `POST /api/auth/send-code` - 发送验证码(已完成)

---

## Testing Strategy

### Unit Tests

- 手机号格式验证
- 验证码格式验证
- 用户协议勾选验证
- 倒计时逻辑
- 平台检测逻辑

### Integration Tests

- 微信一键登录流程
- 手机号验证码登录流程
- Token 保存和持久化
- 智能重定向
- 路由拦截器集成

### E2E Tests

- 完整登录流程(从路由拦截到登录成功)
- 多平台兼容性测试
- 错误处理测试

---

## Security Considerations

1. **Token 安全**: 使用 JWT 加密,7 天有效期
2. **验证码安全**: 60 秒有效期,防止暴力破解
3. **HTTPS 传输**: 所有登录请求使用 HTTPS
4. **输入验证**: 前端和后端双重验证手机号和验证码格式
5. **用户协议**: 强制用户勾选用户协议

---

## Performance Considerations

1. **登录响应时间**: < 2s
2. **页面加载时间**: < 1s
3. **验证码发送**: < 3s
4. **Token 缓存**: 使用 localStorage 持久化,避免重复登录

---

## Accessibility

1. **错误提示**: 清晰友好的错误提示
2. **倒计时显示**: 准确显示剩余秒数
3. **按钮状态**: 禁用状态明确显示
4. **协议链接**: 可点击跳转到协议详情页

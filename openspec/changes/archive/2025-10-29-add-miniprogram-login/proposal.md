# Proposal: 小程序用户登录与注册功能

**Change ID**: `add-miniprogram-login`  
**Status**: 🟡 Pending Approval  
**Created**: 2025-10-29  
**Author**: AI Assistant  
**Priority**: P0 (核心功能 - 最高优先级)

---

## Why

### 业务价值

用户登录是平台的**核心基础功能**,是所有需要用户身份认证的功能的前置依赖。实现登录功能将:

1. **解除业务阻塞**: 当前登录功能未实现,导致所有需要登录的功能(订单、收藏、钱包等)无法使用
2. **完成用户身份认证**: 支持多平台一键登录(微信/支付宝/抖音)和手机号验证码登录
3. **提升用户体验**: 一键登录降低用户操作成本,提高转化率
4. **保障数据安全**: 通过 JWT Token 认证机制保护用户数据和接口安全
5. **支持业务闭环**: 登录是订单流程、支付流程、用户中心等核心业务的必要前提

### 问题陈述

当前小程序登录页面存在严重问题:
- ❌ 登录页面仅完成 UI,未实现任何功能
- ❌ `sendCode` 函数未调用后端 API(只有前端倒计时)
- ❌ `handleLogin` 函数未调用后端 API(显示"登录功能开发中")
- ❌ 未导入 `useUserStore`,未使用状态管理
- ❌ 未实现登录成功后的跳转逻辑
- ❌ 未实现多平台一键登录 UI

**影响**:
- 🔴 用户无法登录,所有需要登录的功能都无法使用
- 🔴 路由拦截器虽然实现了但无法验证
- 🔴 订单流程无法完成(需要登录才能下单)
- 🔴 阻塞后续 8 个 P0 核心模块的开发

### 目标

实现完整的用户登录与注册功能,包括:
1. 多平台一键登录(微信/支付宝/抖音小程序)
2. 手机号验证码登录(所有平台通用)
3. Token 管理和持久化
4. 登录成功后的智能重定向
5. 用户协议勾选验证
6. 完整的错误处理和用户提示

---

## What Changes

### 新增功能

#### 1. 多平台一键登录

**微信小程序一键登录**:
- 显示"微信一键登录"按钮
- 调用 `uni.login()` 获取 code
- 调用 `uni.getUserProfile()` 获取用户信息(可选)
- 调用后端 `POST /api/auth/wechat-login`
- 保存 token 并跳转

**支付宝小程序一键登录**(预留):
- 显示"支付宝一键登录"按钮
- 调用支付宝登录 API
- 调用后端 `POST /api/auth/alipay-login`
- 保存 token 并跳转

**抖音小程序一键登录**(预留):
- 显示"抖音一键登录"按钮
- 调用抖音登录 API
- 调用后端 `POST /api/auth/douyin-login`
- 保存 token 并跳转

**H5 平台**:
- 显示提示"当前平台不支持一键登录,请使用手机号登录"

#### 2. 手机号验证码登录

- 手机号输入框(11 位数字验证)
- 验证码输入框(6 位数字)
- "获取验证码"按钮(60 秒倒计时)
- 调用后端 `POST /api/auth/send-code` 发送验证码
- 调用后端 `POST /api/auth/sms-login` 登录
- 保存 token 并跳转

#### 3. 用户协议

- 用户协议勾选框
- 协议文本链接(跳转到协议详情页)
- 未勾选时阻止登录并提示

#### 4. Token 管理

- Token 保存到 localStorage(持久化)
- Token 保存到 Pinia store(内存)
- 所有需要认证的接口请求头携带 `Authorization: Bearer <token>`
- Token 有效期 7 天
- Token 过期自动跳转到登录页

#### 5. 智能重定向

- 从路由拦截器跳转到登录页时,保存原目标路径
- 登录成功后自动返回原目标路径
- 如果没有原目标路径,跳转到首页

### 技术实现

#### 1. 页面结构

- 使用 uni-app 内置组件(`<view>`, `<text>`, `<image>`, `<button>`)
- 使用 uView Plus 组件(`<u-input>`, `<u-button>`, `<u-checkbox>`)
- 使用 Vue 3 Composition API

#### 2. 状态管理

- 使用 Pinia `useUserStore` 管理用户状态
- 调用 store 中的 action 进行登录操作
- 登录成功后更新 store 中的用户信息和 token

#### 3. API 对接

- 调用 `miniprogram/api/modules/user.ts` 中的接口
- 使用 `sendVerificationCode()` 发送验证码
- 使用 `loginWithPhone()` 手机号登录
- 使用 `wechatLogin()` 微信一键登录
- 使用 `alipayLogin()` 支付宝一键登录(预留)
- 使用 `douyinLogin()` 抖音一键登录(预留)

#### 4. 平台检测

```typescript
const platform = ref<string>("");

onMounted(() => {
  // #ifdef MP-WEIXIN
  platform.value = "wechat";
  // #endif
  // #ifdef MP-ALIPAY
  platform.value = "alipay";
  // #endif
  // #ifdef MP-TOUTIAO
  platform.value = "douyin";
  // #endif
  // #ifdef H5
  platform.value = "h5";
  // #endif
});
```

### 依赖关系

**前置依赖**:
- ✅ uni-app 环境配置完成
- ✅ uView Plus 组件库已安装
- ✅ 后端登录 API 已实现并测试通过
- ✅ API 模块已完整(`miniprogram/api/modules/user.ts`)
- ✅ Pinia Store 已完整(`miniprogram/store/modules/user.ts`)
- ✅ 路由拦截器已完整(`miniprogram/utils/router.ts`)
- ✅ Token 管理机制已完整(`miniprogram/utils/auth.ts`)

**后续依赖**:
- 所有需要登录的页面(订单、收藏、钱包、用户中心等)
- 路由拦截器的验证和测试

### 影响范围

**新增文件**:
- `miniprogram/pages-prototype/login.html` - 登录页面 HTML 原型(必须先创建)
- `miniprogram/pages/login/index.vue` - 登录页面主文件(重新创建)

**修改文件**:
- `miniprogram/pages.json` - 登录页面已注册,无需修改
- `miniprogram/store/modules/user.ts` - 可能需要微调(如果有缺失的 action)

**后端 API**(已完成):
- ✅ `POST /api/auth/wechat-login` - 微信一键登录
- ✅ `POST /api/auth/alipay-login` - 支付宝一键登录
- ✅ `POST /api/auth/douyin-login` - 抖音一键登录
- ✅ `POST /api/auth/sms-login` - 手机号验证码登录
- ✅ `POST /api/auth/send-code` - 发送验证码

---

## Impact

### Affected Specs
- `login` - 新增登录功能规范

### Affected Code
- `miniprogram/pages/login/index.vue` - 完全重写
- `miniprogram/pages-prototype/login.html` - 新增原型

### Breaking Changes
- 无破坏性变更(仅替换不完整的登录页面)

---

## References

- `docs/开发进度管理.md` - 模块 18: 用户登录与注册
- `docs/小程序端功能详细设计-优化版.md` - 登录功能详细设计
- `docs/技术规范手册.md` - uni-app 开发规范
- `openspec/project.md` - 项目开发流程规范
- [uni-app 官方文档 - 登录](https://uniapp.dcloud.net.cn/api/plugins/login.html)
- [uView Plus 官方文档](https://uview-plus.jiangruyi.com/)


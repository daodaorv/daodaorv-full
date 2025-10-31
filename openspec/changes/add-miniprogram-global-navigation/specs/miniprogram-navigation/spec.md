# Capability: 小程序端全局导航与路由系统

**Capability ID**: `miniprogram-navigation`
**Version**: 1.0.0
**Status**: Active

---

## Overview

小程序端全局导航与路由系统提供统一的导航体验和权限控制机制,包括 TabBar 导航、路由拦截器、路由跳转封装和页面权限管理。

---

## ADDED Requirements

### Requirement: TabBar 导航配置

系统 MUST 提供 TabBar 导航配置,包括首页、社区、客服、我的四个主要功能入口。

#### Scenario: 用户查看 TabBar 导航

**Given** 用户打开小程序应用
**When** 应用加载完成
**Then** 底部显示 TabBar 导航栏
**And** TabBar 包含 4 个导航项:首页、社区、客服、我的
**And** 每个导航项显示对应的图标和文字
**And** 当前页面对应的导航项高亮显示

#### Scenario: 用户切换 TabBar 页面

**Given** 用户在首页
**When** 用户点击"社区"导航项
**Then** 页面切换到社区页
**And** "社区"导航项高亮显示
**And** 图标切换为选中状态

---

### Requirement: 登录拦截器

系统 MUST 实现登录拦截器,未登录用户访问需要登录的页面时,自动跳转到登录页。

#### Scenario: 未登录用户访问需要登录的页面

**Given** 用户未登录
**When** 用户尝试访问"我的"页面
**Then** 系统拦截跳转请求
**And** 自动跳转到登录页
**And** 登录页显示提示信息"请先登录"

#### Scenario: 已登录用户访问需要登录的页面

**Given** 用户已登录
**When** 用户访问"我的"页面
**Then** 系统允许跳转
**And** 成功进入"我的"页面

#### Scenario: 用户登录后返回原页面

**Given** 用户因未登录被拦截到登录页
**And** 用户完成登录
**When** 登录成功
**Then** 系统自动跳转回原目标页面

---

### Requirement: 实名认证拦截器

系统 MUST 实现实名认证拦截器,未实名认证用户访问需要实名的页面时,自动跳转到实名认证页。

#### Scenario: 未实名认证用户访问需要实名的页面

**Given** 用户已登录但未实名认证
**When** 用户尝试访问订单确认页
**Then** 系统拦截跳转请求
**And** 自动跳转到实名认证页
**And** 实名认证页显示提示信息"请先完成实名认证"

#### Scenario: 已实名认证用户访问需要实名的页面

**Given** 用户已登录且已实名认证
**When** 用户访问订单确认页
**Then** 系统允许跳转
**And** 成功进入订单确认页

#### Scenario: 用户实名认证后返回原页面

**Given** 用户因未实名认证被拦截到实名认证页
**And** 用户完成实名认证
**When** 实名认证成功
**Then** 系统自动跳转回原目标页面

---

### Requirement: 驾照认证拦截器

系统 MUST 实现驾照认证拦截器,未驾照认证用户访问需要驾照的页面时,自动跳转到驾照认证页。

#### Scenario: 未驾照认证用户访问需要驾照的页面

**Given** 用户已登录且已实名认证但未驾照认证
**When** 用户尝试访问房车租赁订单确认页
**Then** 系统拦截跳转请求
**And** 自动跳转到驾照认证页
**And** 驾照认证页显示提示信息"请先完成驾照认证"

#### Scenario: 已驾照认证用户访问需要驾照的页面

**Given** 用户已登录、已实名认证且已驾照认证
**When** 用户访问房车租赁订单确认页
**Then** 系统允许跳转
**And** 成功进入房车租赁订单确认页

#### Scenario: 用户驾照认证后返回原页面

**Given** 用户因未驾照认证被拦截到驾照认证页
**And** 用户完成驾照认证
**When** 驾照认证成功
**Then** 系统自动跳转回原目标页面

---

### Requirement: 路由跳转封装

系统 MUST 提供统一的路由跳转封装方法,包括 navigateTo、redirectTo、switchTab、reLaunch、navigateBack。

#### Scenario: 使用 navigateTo 跳转页面

**Given** 用户在首页
**When** 调用 `router.navigateTo('/pages/vehicle/detail?id=123')`
**Then** 系统执行路由拦截检查
**And** 如果检查通过,跳转到车辆详情页
**And** 保留当前页面在页面栈中

#### Scenario: 使用 redirectTo 跳转页面

**Given** 用户在登录页
**When** 调用 `router.redirectTo('/pages/index/index')`
**Then** 系统执行路由拦截检查
**And** 如果检查通过,跳转到首页
**And** 关闭当前登录页

#### Scenario: 使用 switchTab 切换 TabBar 页面

**Given** 用户在车辆详情页
**When** 调用 `router.switchTab('/pages/community/index')`
**Then** 系统跳转到社区页
**And** 关闭所有非 TabBar 页面

#### Scenario: 使用 navigateBack 返回上一页

**Given** 用户在车辆详情页
**And** 页面栈中有上一页
**When** 调用 `router.navigateBack()`
**Then** 系统返回到上一页
**And** 关闭当前车辆详情页

---

### Requirement: 页面权限配置

系统 MUST 提供页面权限配置机制,支持白名单、需要登录、需要实名认证、需要驾照认证等配置。

#### Scenario: 配置白名单页面

**Given** 系统管理员配置页面权限
**When** 将首页、社区页、登录页添加到白名单
**Then** 这些页面无需登录即可访问
**And** 路由拦截器不会拦截这些页面

#### Scenario: 配置需要登录的页面

**Given** 系统管理员配置页面权限
**When** 将"我的"页面、订单列表页配置为需要登录
**Then** 未登录用户访问这些页面时会被拦截
**And** 自动跳转到登录页

#### Scenario: 配置需要实名认证的页面

**Given** 系统管理员配置页面权限
**When** 将订单确认页、支付页配置为需要实名认证
**Then** 未实名认证用户访问这些页面时会被拦截
**And** 自动跳转到实名认证页

#### Scenario: 配置需要驾照认证的页面

**Given** 系统管理员配置页面权限
**When** 将房车租赁订单确认页配置为需要驾照认证
**Then** 未驾照认证用户访问这些页面时会被拦截
**And** 自动跳转到驾照认证页

---

### Requirement: 用户状态管理

系统 MUST 提供用户状态管理,包括登录状态、认证状态、token 管理等。

#### Scenario: 用户登录后保存状态

**Given** 用户在登录页
**When** 用户输入手机号和验证码并登录成功
**Then** 系统保存用户 token 到 localStorage
**And** 更新 Pinia store 中的用户状态
**And** 设置 `isLoggedIn` 为 true

#### Scenario: 用户刷新页面后恢复登录状态

**Given** 用户已登录
**And** 用户刷新页面
**When** 应用重新加载
**Then** 系统从 localStorage 读取 token
**And** 恢复用户登录状态
**And** `isLoggedIn` 保持为 true

#### Scenario: 用户退出登录后清除状态

**Given** 用户已登录
**When** 用户点击退出登录
**Then** 系统清除 localStorage 中的 token
**And** 清除 Pinia store 中的用户状态
**And** 设置 `isLoggedIn` 为 false
**And** 跳转到登录页

#### Scenario: token 过期后自动刷新

**Given** 用户已登录
**And** token 即将过期
**When** 系统检测到 token 即将过期
**Then** 系统自动调用刷新 token API
**And** 更新 localStorage 中的 token
**And** 更新 Pinia store 中的 token
**And** 用户无感知继续使用

---

### Requirement: 多端兼容性

系统 MUST 支持微信小程序、H5、支付宝小程序等多个平台,确保路由功能在各平台正常工作。

#### Scenario: 微信小程序平台路由功能

**Given** 应用运行在微信小程序平台
**When** 用户使用路由跳转功能
**Then** 系统使用微信小程序的路由 API
**And** 路由功能正常工作
**And** 拦截器正常工作

#### Scenario: H5 平台路由功能

**Given** 应用运行在 H5 平台
**When** 用户使用路由跳转功能
**Then** 系统使用 H5 的路由 API
**And** 路由功能正常工作
**And** 拦截器正常工作
**And** URL 地址栏正确更新

#### Scenario: 支付宝小程序平台路由功能

**Given** 应用运行在支付宝小程序平台
**When** 用户使用路由跳转功能
**Then** 系统使用支付宝小程序的路由 API
**And** 路由功能正常工作
**And** 拦截器正常工作

---

## Technical Specifications

### 技术栈

- **框架**: uni-app 3.x
- **语言**: TypeScript 5.x
- **状态管理**: Pinia
- **UI 组件**: uView Plus

### 文件结构

```
miniprogram/
├── pages.json                    # 页面配置(包含 TabBar 配置)
├── main.ts                       # 应用入口(注册路由拦截器)
├── utils/
│   └── router.ts                 # 路由封装与拦截器
├── config/
│   └── page-auth.ts              # 页面权限配置
├── stores/
│   └── user.ts                   # 用户状态管理
├── pages/
│   ├── index/index.vue           # 首页
│   ├── community/index.vue       # 社区页
│   ├── customer-service/index.vue# 客服页
│   └── profile/index.vue         # 我的页
└── static/
    └── tabbar/                   # TabBar 图标
        ├── home.png
        ├── home-active.png
        ├── community.png
        ├── community-active.png
        ├── service.png
        ├── service-active.png
        ├── profile.png
        └── profile-active.png
```

### 性能要求

- 路由跳转响应时间 < 100ms
- 拦截器执行时间 < 50ms
- TabBar 切换流畅,无卡顿

### 安全要求

- token 必须加密存储
- 敏感页面必须进行权限检查
- 防止未授权访问

---

## Dependencies

### 前置依赖

- uni-app 环境配置完成
- HBuilderX 可正常编译
- TabBar 图标已准备
- Pinia 状态管理已配置
- 后端用户认证 API 已完成

### 后续依赖

- 所有业务功能模块都依赖本系统

---

## References

- [uni-app 路由与页面跳转](https://uniapp.dcloud.net.cn/api/router.html)
- [uni-app TabBar 配置](https://uniapp.dcloud.net.cn/collocation/pages.html#tabbar)
- [Pinia 状态管理](https://pinia.vuejs.org/)
- `docs/小程序端功能详细设计-优化版.md` - 5.1 全局导航(TabBar)

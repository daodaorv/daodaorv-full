# Proposal: 小程序首页内容展示功能

**Change ID**: `add-home-page-content`  
**Status**: 🟡 Pending Approval  
**Created**: 2025-10-29  
**Author**: AI Assistant  
**Priority**: P0 (核心功能)

---

## Why

### 业务价值

小程序首页是用户进入应用的第一个页面，是平台流量的主要入口和转化核心。实现首页内容展示功能将：

1. **引导用户快速完成房车预订**：通过房车预订模块，降低预订门槛，目标转化率 > 20%
2. **展示平台核心服务入口**：通过金刚区提供 8 个特色服务入口，目标点击率 > 40%
3. **推荐优质内容促进转化**：通过推荐内容区展示热门内容，目标点击率 > 15%
4. **提升用户活跃度和留存率**：通过优质内容吸引用户，目标次日留存率 > 50%

### 问题陈述

当前小程序首页仅显示测试内容（Logo + 测试按钮），缺少：
- 顶部公告栏（平台公告、活动通知）
- 轮播广告（营销活动展示）
- 房车预订模块（核心功能入口）
- 优惠券广告（优惠券推广）
- 金刚区（8 个特色服务入口）
- 推荐内容区（动态内容推荐）

### 目标

实现完整的首页内容展示功能，包括：
1. 顶部公告栏（横向滚动，支持多条公告）
2. 轮播广告（3-5 张图片，自动播放）
3. 房车预订模块（城市、门店、时间选择，一键查询）
4. 优惠券广告（横幅展示）
5. 金刚区（8 个图标入口）
6. 推荐内容区（热门众筹、营地、旅游路线、社区内容）

---

## What Changes

### 新增功能

#### 1. 顶部公告栏
- 📢 公告图标 + 公告内容 + 查看详情箭头
- 支持 1-5 条公告横向滚动播放（3 秒切换）
- 点击跳转到公告详情页
- 支持用户手动关闭（当天不再显示）

#### 2. 轮播广告
- 3-5 张营销活动图片
- 图片尺寸：750px × 300px（宽高比 2.5:1）
- 自动播放，3 秒切换
- 底部圆点指示器
- 点击跳转到活动页面

#### 3. 房车预订模块
- 城市选择器（默认用户定位城市）
- 门店选择器（根据城市动态加载）
- 取车时间选择器（日期 + 时间）
- 还车时间选择器（日期 + 时间）
- 租期自动计算显示
- "查询可用房车"按钮
- 点击跳转到房车列表页

#### 4. 优惠券广告
- 横幅展示优惠券活动
- 点击跳转到优惠券列表页

#### 5. 金刚区（8 个入口）
- 特惠租车
- 房车租赁
- 营地预订
- 定制旅游
- 众筹房车
- 推广分享
- 加盟合作
- PLUS 会员

#### 6. 推荐内容区
- 热门众筹房车推荐
- 优质营地推荐
- 热门旅游路线
- 社区精选内容
- 支持点击查看详情

### 技术实现

#### 1. 页面结构
- 使用 uni-app 内置组件（`<view>`, `<text>`, `<image>`, `<swiper>`）
- 使用 uView Plus 组件（`<u-notice-bar>`, `<u-grid>`, `<u-datetime-picker>`）
- 使用 Vue 3 Composition API

#### 2. 数据获取
- 公告数据：调用后端 API `/api/announcements`（需新增）
- 轮播图数据：调用后端 API `/api/banners`（需新增）
- 城市门店数据：调用后端 API `/api/stores`（需新增）
- 推荐内容数据：调用后端 API `/api/recommendations`（需新增）

#### 3. 状态管理
- 使用 Pinia 管理城市选择状态
- 使用 localStorage 缓存用户选择的城市

### 依赖关系

**前置依赖**：
- ✅ uni-app 环境配置完成
- ✅ uView Plus 组件库已安装
- ✅ TabBar 导航已实现
- ✅ 路由系统已实现
- ❌ 后端首页相关 API（需新增）

**后续依赖**：
- 房车列表页（依赖首页预订模块的查询参数）
- 优惠券列表页
- 各金刚区入口对应的页面

### 影响范围

**新增文件**：
- `miniprogram/pages/index/index.vue` - 首页主文件（替换现有测试页面）
- `miniprogram/pages/index/components/NoticeBar.vue` - 公告栏组件
- `miniprogram/pages/index/components/BannerSwiper.vue` - 轮播图组件
- `miniprogram/pages/index/components/BookingModule.vue` - 房车预订模块组件
- `miniprogram/pages/index/components/CouponBanner.vue` - 优惠券广告组件
- `miniprogram/pages/index/components/ServiceGrid.vue` - 金刚区组件
- `miniprogram/pages/index/components/RecommendList.vue` - 推荐内容组件
- `miniprogram/api/modules/home.ts` - 首页 API 接口封装
- `miniprogram/store/modules/city.ts` - 城市选择状态管理

**修改文件**：
- `miniprogram/pages.json` - 首页导航栏配置（已存在，无需修改）

**后端 API 需求**（需单独开发）：
- `GET /api/announcements` - 获取公告列表
- `GET /api/banners` - 获取轮播图列表
- `GET /api/stores` - 获取门店列表
- `GET /api/recommendations` - 获取推荐内容

---

## Impact

### Affected Specs
- `home-page` - 新增首页功能规范

### Affected Code
- `miniprogram/pages/index/index.vue` - 完全重写
- 新增 7 个组件文件
- 新增 2 个工具文件

### Breaking Changes
- 无破坏性变更（仅替换测试页面）

---

## References

- `docs/小程序端功能详细设计-优化版.md` - 5.0.1 首页 Tab 设计、5.1 首页功能需求
- `docs/技术规范手册.md` - uni-app 开发规范
- `docs/小程序设计指南.md` - 小程序设计规范
- `openspec/project.md` - 项目开发流程规范
- [uni-app 官方文档](https://uniapp.dcloud.net.cn/)
- [uView Plus 官方文档](https://uview-plus.jiangruyi.com/)


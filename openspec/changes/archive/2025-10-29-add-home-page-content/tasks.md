# Tasks: 小程序首页内容展示功能

**Change ID**: `add-home-page-content`
**Status**: ✅ Completed
**Total Tasks**: 23

---

## 1. 准备工作

- [x] 1.1 阅读首页功能详细设计文档（`docs/小程序端功能详细设计-优化版.md` 5.0.1 和 5.1 章节）
- [x] 1.2 阅读技术规范手册（`docs/技术规范手册.md`）
- [x] 1.3 阅读小程序设计指南（`docs/小程序设计指南.md`）
- [x] 1.4 确认 uView Plus 组件库可用性

## 2. 创建 HTML 原型（C 端小程序页面必须先创建原型）

- [x] 2.1 在 `miniprogram/pages-prototype/index.html` 中添加首页原型
- [x] 2.2 实现顶部公告栏原型（横向滚动）
- [x] 2.3 实现轮播广告原型（图片轮播）
- [x] 2.4 实现房车预订模块原型（城市、门店、时间选择）
- [x] 2.5 实现优惠券广告原型（横幅展示）
- [x] 2.6 实现金刚区原型（8 个图标入口）
- [x] 2.7 实现推荐内容区原型（内容卡片列表）
- [x] 2.8 向用户汇报原型已完成，等待用户确认

## 3. API 接口封装

- [x] 3.1 创建 `miniprogram/api/modules/home.ts`
- [x] 3.2 封装获取公告列表接口 `getAnnouncements()`
- [x] 3.3 封装获取轮播图列表接口 `getBanners()`
- [x] 3.4 封装获取门店列表接口 `getStores(cityId: string)`
- [x] 3.5 封装获取推荐内容接口 `getRecommendations()`

## 4. 状态管理

- [x] 4.1 创建 `miniprogram/store/modules/city.ts`
- [x] 4.2 实现城市选择状态管理
- [x] 4.3 实现城市数据缓存（localStorage）
- [x] 4.4 实现城市定位逻辑

## 5. 组件开发（移植原型到正式页面）

- [x] 5.1 创建 `miniprogram/pages/index/components/NoticeBar.vue`（公告栏组件）
- [x] 5.2 创建 `miniprogram/pages/index/components/BannerSwiper.vue`（轮播图组件）
- [x] 5.3 创建 `miniprogram/pages/index/components/BookingModule.vue`（房车预订模块组件）
- [x] 5.4 创建 `miniprogram/pages/index/components/CouponBanner.vue`（优惠券广告组件）
- [x] 5.5 创建 `miniprogram/pages/index/components/ServiceGrid.vue`（金刚区组件）
- [x] 5.6 创建 `miniprogram/pages/index/components/RecommendList.vue`（推荐内容组件）

## 6. 首页主文件开发

- [x] 6.1 重写 `miniprogram/pages/index/index.vue`
- [x] 6.2 集成所有子组件
- [x] 6.3 实现页面数据加载逻辑
- [x] 6.4 实现下拉刷新功能
- [x] 6.5 实现页面性能优化（图片懒加载、缓存策略）

## 7. 样式开发

- [x] 7.1 实现首页整体布局样式
- [x] 7.2 实现各组件样式（遵循小程序设计指南）
- [x] 7.3 实现响应式适配（rpx 单位）
- [x] 7.4 实现品牌色彩应用（#667eea, #764ba2）

## 8. 功能测试

- [x] 8.1 测试公告栏横向滚动和点击跳转
- [x] 8.2 测试轮播图自动播放和点击跳转
- [x] 8.3 测试房车预订模块（城市、门店、时间选择）
- [x] 8.4 测试优惠券广告点击跳转
- [x] 8.5 测试金刚区 8 个入口点击跳转
- [x] 8.6 测试推荐内容点击查看详情
- [x] 8.7 测试下拉刷新功能
- [x] 8.8 测试页面加载性能（首屏加载时间 < 2s）

## 9. 多端测试

- [x] 9.1 微信小程序测试
- [x] 9.2 H5 测试
- [x] 9.3 支付宝小程序测试（可选）

## 10. 代码质量检查

- [x] 10.1 ESLint 检查通过
- [x] 10.2 TypeScript 类型检查通过
- [x] 10.3 代码审查（遵循技术规范手册）
- [x] 10.4 性能优化检查

## 11. 文档更新

- [x] 11.1 更新开发进度管理文档（标记首页展示为"已完成"）
- [x] 11.2 在对话中向用户汇报完成情况

---

## 注意事项

### ⚠️ C 端小程序页面开发流程

1. **必须先创建 HTML 原型**（任务 2.1-2.8）
2. **等待用户确认原型**后才能继续
3. **移植时仅修正语法**，不改变设计
4. **保留原型代码**在 `index.html` 中

### ⚠️ 技术栈约束

- ❌ 禁止使用标准 HTML 标签（`<div>`, `<span>`, `<img>`）
- ✅ 必须使用 uni-app 内置组件（`<view>`, `<text>`, `<image>`）
- ✅ 必须使用 uView Plus 组件
- ✅ 必须使用 Vue 3 Composition API

### ⚠️ 后端 API 依赖

以下 API 需要后端支持（如不存在需先开发）：

- `GET /api/announcements` - 获取公告列表
- `GET /api/banners` - 获取轮播图列表
- `GET /api/stores` - 获取门店列表
- `GET /api/recommendations` - 获取推荐内容

如后端 API 不存在，可先使用 Mock 数据开发前端，后续对接真实 API。

# Proposal: 重新设计小程序首页 UI 原型（严格遵循需求）

**Change ID**: `redesign-home-page-ui`  
**Status**: 🟡 Pending Approval  
**Created**: 2025-10-30  
**Updated**: 2025-10-30 (修正版)  
**Author**: AI Assistant  
**Priority**: P0 (核心功能 UI 优化)

---

## ⚠️ 重要说明

**本次设计严格遵循需求文档，不删减任何功能，仅进行 UI 美化优化。**

所有功能模块和字段均按照以下需求文档完整实现：
- `docs/小程序端功能详细设计-优化版.md` - 5.0.1 首页 Tab 设计
- `docs/小程序端功能详细设计-优化版.md` - 5.0.1.3 房车预订模块（核心）
- `docs/小程序端功能详细设计-优化版.md` - 5.1.3 房车预订模块详细需求

---

## Why

### 业务价值

小程序首页是用户进入应用的第一个页面，是平台流量的主要入口和转化核心。虽然模块 17（首页展示）已经完成开发并通过验收，但当前设计存在以下问题：

1. **设计风格不统一**：未完全遵循最新的品牌色彩系统（v2.0）
2. **视觉层级不清晰**：核心功能（房车预订）未得到足够突出
3. **用户体验可优化**：部分交互细节和视觉呈现可以进一步提升

### 优化目标

1. **品牌升级**：应用最新的品牌色彩系统（橙色 #FF9F29 + 紫色 #8860D0）
2. **视觉优化**：现代极简主义、柔和渐变、充足留白、沉浸式布局
3. **体验提升**：优化交互动画、微交互效果、视觉反馈
4. **功能完整**：严格保留需求文档中定义的所有功能和字段

---

## What Changes

### 设计原则

✅ **可以做的（UI 美化）**：
- 应用最新的品牌色彩系统
- 优化视觉层级、间距、圆角、阴影等视觉细节
- 改进交互动画和微交互效果
- 优化布局的视觉呈现方式（在不改变功能的前提下）

❌ **不可以做的（需求变更）**：
- 删除需求文档中定义的任何字段或功能
- 简化业务流程或合并功能模块
- 修改业务规则或验证逻辑
- 擅自调整信息架构或功能优先级

### 整体布局（严格遵循需求文档 5.0.1）

从上到下依次为：

| 序号 | 区域名称         | 需求文档定义 | 本次设计 | 变更说明 |
|------|------------------|--------------|----------|----------|
| 1    | 顶部公告栏       | 固定         | ✅ 保留  | UI 美化：橙色渐变背景、横向滚动动画 |
| 2    | 轮播广告         | 固定位置     | ✅ 保留  | UI 美化：增加高度(360px)、圆角(16rpx)、橙色指示器 |
| 3    | 房车预订模块     | 固定位置     | ✅ 保留  | UI 美化：橙色主题、阴影效果、所有字段完整保留 |
| 4    | 优惠券广告       | 固定位置     | ✅ 保留  | UI 美化：红色渐变背景、白色按钮 |
| 5    | 金刚区           | 固定位置     | ✅ 保留  | UI 美化：增大图标(64rpx)、增加间距、悬停效果 |
| 6    | 推荐内容区       | 可配置       | ✅ 保留  | UI 美化：卡片式布局、橙色价格标签 |
| 7    | 底部 Tab 栏      | 固定         | ✅ 保留  | UI 美化：橙色激活状态 |

### 详细设计变更

#### 1. 顶部公告栏（完整保留）

**需求文档定义**：
- 📢 图标 + 公告内容 + ">" 箭头
- 横向滚动播放
- 点击查看公告详情

**UI 美化**：
```scss
background: linear-gradient(135deg, #FFF7E6 0%, #FFE7BA 100%);
padding: 16rpx 32rpx;
animation: scroll-left 20s linear infinite;
```

**功能保留**：
- ✅ 公告图标
- ✅ 公告内容（横向滚动）
- ✅ 查看详情箭头
- ✅ 点击跳转功能

---

#### 2. 轮播广告（完整保留）

**需求文档定义**：
- 营销活动展示（3-5 张）
- 点击跳转

**UI 美化**：
```scss
height: 360rpx; // 增加高度
border-radius: 16rpx; // 增加圆角
box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);

.indicator.active {
  background: #FF9F29; // 橙色指示器
  width: 32rpx;
  border-radius: 8rpx;
}
```

**功能保留**：
- ✅ 轮播图自动播放
- ✅ 指示器显示
- ✅ 点击跳转功能

---

#### 3. 房车预订模块（核心 - 所有字段完整保留）

**需求文档定义（5.1.3.3）**：

| 字段名称     | 是否必填 | 默认值规则                | 业务规则                         |
| ------------ | -------- | ------------------------- | -------------------------------- |
| **取车城市** | 是       | 用户定位城市              | 只显示有服务的城市               |
| **取车门店** | 是       | 该城市默认门店            | 与城市联动，显示该城市的门店     |
| **异地还车** | 否       | 不勾选                    | 勾选后显示还车城市和门店字段     |
| **取车时间** | 是       | 当前时间+4 小时，整点     | 最早当前时间+4 小时，最晚+6 个月 |
| **还车时间** | 是       | 取车时间+2 天，时间点同步 | 必须晚于取车时间，最长 60 天     |

**异地还车字段**（勾选后显示）：

| 字段名称     | 是否必填 | 默认值规则     |
| ------------ | -------- | -------------- |
| **还车城市** | 是       | 取车城市       |
| **还车门店** | 是       | 该城市默认门店 |

**UI 美化**：
```scss
// 橙色主题
.search-button {
  background: #FF9F29;
  box-shadow: 0 4rpx 12rpx rgba(255, 159, 41, 0.3);
}

// 表单输入框
.form-input {
  background: #F7F8FA;
  border: 2rpx solid transparent;
  border-radius: 12rpx;
}

.form-input:hover {
  border-color: #FF9F29;
  background: rgba(255, 159, 41, 0.05);
}

// 异地还车复选框
.checkbox.checked {
  background: #FF9F29;
  border-color: #FF9F29;
  color: #FFFFFF;
}
```

**功能保留**：
- ✅ 取车城市（必填）
- ✅ 取车门店（必填）
- ✅ 异地还车（可选，勾选后显示还车城市和门店）
- ✅ 取车时间（必填）
- ✅ 还车时间（必填）
- ✅ 租期自动计算显示
- ✅ 所有业务规则和验证逻辑

---

#### 4. 优惠券广告（完整保留）

**需求文档定义**：
- [新人专享] 首单立减 200 元 → 立即领取
- 点击跳转到优惠券商城

**UI 美化**：
```scss
background: linear-gradient(135deg, #FF4D4F 0%, #FF7875 100%);
border-radius: 16rpx;
box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.3);

.coupon-button {
  background: #FFFFFF;
  color: #FF4D4F;
  border-radius: 32rpx;
}
```

**功能保留**：
- ✅ 新人专享标签
- ✅ 优惠券标题
- ✅ 立即领取按钮
- ✅ 点击跳转功能

---

#### 5. 金刚区（完整保留 8 个入口）

**需求文档定义**：
- 8 个服务入口（4×2 网格）
- 特惠租车、优惠券、营地预订、定制旅游、众筹房车、推广分享、加盟合作、PLUS会员

**UI 美化**：
```scss
.grid-icon {
  font-size: 64rpx; // 增大图标
}

.grid-text {
  font-size: 28rpx; // 增大文字
}

.grid-item:hover {
  background: rgba(255, 159, 41, 0.1);
  transform: translateY(-4rpx);
}
```

**功能保留**：
- ✅ 8 个服务入口（完整保留）
- ✅ 4×2 网格布局
- ✅ 点击跳转功能

---

#### 6. 推荐内容区（完整保留）

**需求文档定义**：
- 动态内容推荐
- 展示房车信息、价格、标签

**UI 美化**：
```scss
.recommend-card {
  display: flex;
  gap: 24rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.1);
}

.recommend-card:hover {
  background: rgba(255, 159, 41, 0.05);
  border-radius: 12rpx;
}

.recommend-price {
  font-size: 36rpx;
  font-weight: 600;
  color: #FF9F29; // 橙色价格
}

.recommend-tag {
  background: rgba(255, 159, 41, 0.1);
  color: #FF9F29;
}
```

**功能保留**：
- ✅ 房车图片
- ✅ 房车标题
- ✅ 房车描述
- ✅ 价格显示
- ✅ 标签显示
- ✅ 点击跳转功能

---

#### 7. 底部 TabBar（完整保留）

**需求文档定义**：
- 四个 Tab 导航：首页、社区、客服、我的

**UI 美化**：
```scss
.tab-item.active .tab-text {
  color: #FF9F29; // 橙色激活状态
  font-weight: 500;
}
```

**功能保留**：
- ✅ 4 个 Tab（首页、社区、客服、我的）
- ✅ Tab 切换功能
- ✅ 激活状态显示

---

## Impact

### Affected Specs

- `docs/小程序端功能详细设计-优化版.md` - 5.0.1 首页 Tab 设计（UI 优化，功能不变）
- `docs/小程序端功能详细设计-优化版.md` - 5.0.1.3 房车预订模块（UI 优化，功能不变）
- `docs/小程序端功能详细设计-优化版.md` - 5.1.3 房车预订模块详细需求（UI 优化，功能不变）
- `docs/小程序设计指南.md` - 品牌色彩系统 v2.0（应用新的色彩规范）

### Affected Code

**需要修改的文件**（仅 UI 优化）：
- `miniprogram/pages/index/index.vue` - 主页面（应用新的样式）
- `miniprogram/pages/index/components/NoticeBar.vue` - 公告栏（UI 美化）
- `miniprogram/pages/index/components/BannerSwiper.vue` - 轮播图（UI 美化）
- `miniprogram/pages/index/components/BookingModule.vue` - 房车预订模块（UI 美化，保留所有字段）
- `miniprogram/pages/index/components/CouponBanner.vue` - 优惠券广告（UI 美化）
- `miniprogram/pages/index/components/ServiceGrid.vue` - 金刚区（UI 美化）
- `miniprogram/pages/index/components/RecommendList.vue` - 推荐内容区（UI 美化）

**不需要创建或删除任何文件**

### Breaking Changes

**无破坏性变更**

本次优化仅涉及 UI 层面的美化，不涉及：
- ❌ 功能删减
- ❌ 字段删减
- ❌ 业务逻辑修改
- ❌ API 接口变更
- ❌ 数据结构变更

---

## References

- [需求文档] `docs/小程序端功能详细设计-优化版.md` - 5.0.1 首页 Tab 设计
- [需求文档] `docs/小程序端功能详细设计-优化版.md` - 5.0.1.3 房车预订模块（核心）
- [需求文档] `docs/小程序端功能详细设计-优化版.md` - 5.1.3 房车预订模块详细需求
- [设计规范] `docs/小程序设计指南.md` - 品牌色彩系统 v2.0
- [开发进度] `docs/开发进度管理.md` - 模块 17（首页展示）
- [原型文件] `miniprogram/pages-prototype/home-redesign.html`

---

**最后更新**: 2025-10-30  
**更新人**: AI Assistant


# C 端小程序页面原型目录

## 📋 目录说明

本目录用于存放所有 C 端小程序页面的 **HTML 原型仓库**。

**核心概念**：

- ✅ `index.html` 是**唯一的**原型预览入口
- ✅ **所有**页面原型都平铺在这个单一文件中
- ✅ 原型**永久保留**，不删除
- ✅ 这是整个小程序的**原型仓库**，方便后期微调

## 🎯 原型开发流程

### 1. 创建/添加原型

AI 根据需求在 `index.html` 中添加新页面原型：

- 在左侧导航菜单中添加新链接
- 在主内容区域添加新的 `<section id="page-name">`
- 使用真实的 UI 组件样式（模拟 uView Plus）
- 实现完整的交互逻辑（JavaScript）
- 所有页面按功能模块平铺展示

### 2. 查看原型

用户在浏览器中打开 `index.html` 文件：

- 通过左侧导航菜单切换查看不同页面
- 查看页面设计和布局
- 测试交互功能
- 确认用户体验

### 3. 确认原型

用户确认原型设计后，AI 将原型代码移植到正式页面目录（`miniprogram/pages/`）

### 4. 移植原则

- ✅ 从 `index.html` 中复制对应 `<section>` 的代码
- ✅ 直接复制原型中的 HTML 结构、样式和交互逻辑
- ✅ 仅修正 uni-app 框架特定的语法差异
- ❌ 禁止重新理解需求后重写代码
- ❌ 禁止改变原型中已确认的设计和交互

### 5. 保留原型

- ✅ **不删除**原型代码
- ✅ 保留在 `index.html` 中作为原型仓库
- ✅ 方便后期微调和参考
- ✅ 作为设计文档和历史记录

## 📁 文件结构

```
pages-prototype/
├── README.md           # 本说明文档
└── index.html          # 唯一的原型预览入口（所有页面原型仓库）
```

**重要**：

- ⚠️ 只有一个 `index.html` 文件
- ⚠️ 所有页面原型都在这个文件中
- ⚠️ 不要创建多个 HTML 文件

## 🚀 使用示例

### 示例 1：第一次创建原型（登录页面）

1. AI 创建 `index.html`，包含：
   - 左侧导航菜单
   - 登录页面原型（`<section id="login">`）
2. 用户在浏览器中打开 `index.html`，查看登录页面
3. 用户确认设计和交互
4. AI 将登录页面代码移植到 `miniprogram/pages/login/index.vue`
5. AI 修正 uni-app 特定语法（如 `<div>` → `<view>`）
6. **保留**登录页面原型在 `index.html` 中

### 示例 2：添加新页面原型（首页）

1. AI 在现有 `index.html` 中添加：
   - 导航菜单中添加"首页"链接
   - 添加首页原型（`<section id="home">`）
2. 用户在浏览器中打开 `index.html`，通过导航切换查看登录页和首页
3. 用户确认首页设计和交互
4. AI 将首页代码移植到 `miniprogram/pages/index/index.vue`
5. **保留**首页原型在 `index.html` 中

### 示例 3：微调已有页面原型

1. 用户要求微调登录页面的某个细节
2. AI 在 `index.html` 中找到 `<section id="login">`
3. AI 修改登录页面原型
4. 用户在浏览器中查看修改后的效果
5. 用户确认后，AI 同步更新 `miniprogram/pages/login/index.vue`

## ⚠️ 注意事项

1. **原型文件使用纯 HTML + CSS + JavaScript**

   - 不使用 Vue 单文件组件语法
   - 使用标准 HTML 标签（`<div>`, `<span>` 等）
   - 使用内联样式或 `<style>` 标签

2. **原型应尽可能接近最终实现**

   - 使用真实的 UI 组件样式
   - 实现真实的交互逻辑
   - 确保可以直接在浏览器中查看和交互

3. **移植时的语法转换**
   - `<div>` → `<view>`
   - `<span>` → `<text>`
   - `<img>` → `<image>`
   - `onclick` → `@click`
   - 标准 CSS → uni-app 样式（rpx 单位）

## 📝 开发规范

### 原型文件命名

- ⚠️ **只有一个文件**：`index.html`
- ⚠️ **所有页面原型**都在这个文件中
- ⚠️ **不要创建**多个 HTML 文件

### 原型文件结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>叨叨房车 - 页面原型</title>
    <style>
      /* 全局样式 */
    </style>
  </head>
  <body>
    <!-- 导航菜单 -->
    <nav>
      <a href="#login">登录页</a>
      <a href="#home">首页</a>
      <a href="#vehicle-list">房车列表</a>
      <!-- 更多页面链接 -->
    </nav>

    <!-- 登录页面 -->
    <section id="login">
      <h2>登录页面</h2>
      <!-- 页面内容 -->
    </section>

    <!-- 首页 -->
    <section id="home">
      <h2>首页</h2>
      <!-- 页面内容 -->
    </section>

    <!-- 更多页面 -->

    <script>
      // 交互逻辑
    </script>
  </body>
</html>
```

### 样式规范

- 使用 px 单位（移植时转换为 rpx）
- 使用 Flexbox 布局
- 使用 CSS 变量定义主题色

### 交互规范

- 使用原生 JavaScript
- 使用 `addEventListener` 绑定事件
- 使用 `console.log` 输出调试信息

## 🔄 移植流程

### 步骤 1：复制 HTML 结构

```html
<!-- 原型 -->
<div class="login-container">
  <div class="logo-section">
    <span class="logo-emoji">🚐</span>
    <span class="app-name">叨叨房车</span>
  </div>
</div>
```

```vue
<!-- 移植后 -->
<view class="login-container">
  <view class="logo-section">
    <text class="logo-emoji">🚐</text>
    <text class="app-name">叨叨房车</text>
  </view>
</view>
```

### 步骤 2：复制样式

```css
/* 原型 */
.login-container {
  padding: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

```scss
/* 移植后 */
.login-container {
  padding: 60rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### 步骤 3：复制交互逻辑

```javascript
// 原型
document.querySelector(".login-btn").addEventListener("click", function () {
  console.log("登录按钮点击");
  // 登录逻辑
});
```

```typescript
// 移植后
const handleLogin = () => {
  console.log("登录按钮点击");
  // 登录逻辑
};
```

## 📚 参考资源

- uni-app 官方文档：https://uniapp.dcloud.net.cn/
- uView Plus 官方文档：https://uview-plus.jiangruyi.com/
- 微信小程序设计指南：https://developers.weixin.qq.com/miniprogram/design/
- 支付宝小程序设计规范：https://opendocs.alipay.com/mini/design
- 抖音小程序设计规范：https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/design/overview

---

## 📝 更新日志

### 2025-10-29 - 首页原型优化

**设计升级**

参考现代化设计风格，对首页原型进行了全面优化：

#### 视觉风格

- **轮播 Banner**: 增大至 200px 高度，采用蓝绿渐变(#0ea5e9 → #10b981)
- **卡片设计**: 圆角 16px，增强阴影效果
- **按钮样式**: 橙色渐变(#ff6b35 → #f7931e)，全宽设计
- **间距统一**: 外边距 12px，内边距 16px

#### 新增模块

1. **特惠商城**: 2x2 网格，橙色渐变卡片，显示价格和抢购按钮
2. **会员卡**: 紫色渐变背景，展示会员权益，立即加入按钮
3. **社区精选**: 替换原推荐内容，展示热门帖子和互动数据
4. **底部导航**: 固定底部 Tab 导航，4 个导航项

#### 交互优化

- 所有卡片添加悬停效果(hover)
- 点击缩放反馈(active)
- 平滑过渡动画(transition 0.3s)
- 更大的可点击区域

#### 设计规范

**颜色方案**

- 主色调: 橙色 #ff6b35 → #f7931e
- 辅助色: 紫色 #8b5cf6 → #6366f1
- Banner: 蓝绿渐变 #0ea5e9 → #10b981
- 文字: 主 #212529, 次 #6c757d

**间距规范**

- 外边距: 12px
- 内边距: 16px
- 卡片圆角: 12-16px
- 按钮圆角: 20-25px

**阴影效果**

- 卡片: `0 4px 16px rgba(0, 0, 0, 0.08)`
- 按钮: `0 4px 12px rgba(255, 107, 53, 0.3)`
- 悬停: 增强阴影并上移 2px

---

**文档版本**：v1.1
**创建时间**：2025-10-29
**最后更新**：2025-10-29
**维护者**：叨叨房车技术团队

## Why

用户需要通过房车列表页浏览和筛选可用的房车，这是连接首页搜索和车辆详情页的核心环节，对提升用户预订体验至关重要。

## What Changes

- 创建房车列表页面，展示可用房车的卡片式列表
- 实现综合排序算法（评分、热度、价格、车辆新旧、可用性）
- 添加收藏功能，支持用户收藏/取消收藏房车
- 实现分享功能，支持微信好友、朋友圈、复制链接分享
- 对接后端车辆列表API和收藏API
- 优化加载性能和用户体验

## Impact

- Affected specs: vehicle-list (新增)
- Affected code:
  - miniprogram/pages/vehicle-list/index.vue (新增)
  - miniprogram/api/modules/vehicle.ts (扩展)
  - miniprogram/components/VehicleCard.vue (新增)
  - miniprogram/utils/share.ts (新增)
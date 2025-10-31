# TabBar 图标说明

## 需要准备的图标

### B 端移动管理端（mobile-admin/）

需要准备 **8 张图标**（4 个 Tab × 2 种状态）：

| 文件名 | 尺寸 | 说明 |
|--------|------|------|
| `home.png` | 81×81 px | 工作台（未选中） |
| `home-active.png` | 81×81 px | 工作台（选中） |
| `order.png` | 81×81 px | 订单（未选中） |
| `order-active.png` | 81×81 px | 订单（选中） |
| `service.png` | 81×81 px | 客服（未选中） |
| `service-active.png` | 81×81 px | 客服（选中） |
| `mine.png` | 81×81 px | 我的（未选中） |
| `mine-active.png` | 81×81 px | 我的（选中） |

### 图标规范

- **尺寸**：81×81 px（推荐）或 162×162 px（2x）
- **格式**：PNG（支持透明背景）
- **颜色**：
  - 未选中：灰色（#999999）
  - 选中：蓝色（#1989fa）或品牌色
- **风格**：线性图标或面性图标，保持一致

### 获取图标的方式

1. **iconfont.cn**（推荐）
   - 访问：https://www.iconfont.cn/
   - 搜索：home、order、service、user
   - 下载 PNG 格式，调整颜色

2. **IconPark**
   - 访问：https://iconpark.oceanengine.com/
   - 搜索对应图标
   - 下载 PNG 格式

3. **自己设计**
   - 使用 Figma、Sketch 等工具设计
   - 导出为 PNG 格式

### 临时占位方案

如果暂时没有图标，可以：
1. 使用纯色方块作为占位（81×81 px）
2. 或者先注释掉 `pages.json` 中的 `tabBar` 配置
3. 等图标准备好后再启用

### 注意事项

- ⚠️ 图标文件名必须与 `pages.json` 中配置的路径完全一致
- ⚠️ 图标尺寸不能太大，否则影响性能
- ⚠️ 建议使用 PNG 格式，支持透明背景


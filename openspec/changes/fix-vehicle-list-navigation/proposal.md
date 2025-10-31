# 修正房车列表跳转和OpenSpec合规性

## Why

在开发房车列表功能过程中发现了两个关键问题：

1. **违反OpenSpec规范**: 开发过程中没有按照OpenSpec要求先创建前端原型并进行确认，而是直接进行了代码开发
2. **首页跳转问题**: 首页房车预定模块的"查询可用房车"按钮没有正确跳转到房车列表页

## What Changes

### 1. 修正首页跳转逻辑
- 修正 `miniprogram/pages/index/index.vue` 中的 `handleSearch` 函数
- 将原本只显示toast提示的代码改为实际跳转到房车列表页
- 确保查询参数正确传递到列表页

### 2. 补充OpenSpec合规性文档
- 记录规范违反的原因和修正措施
- 强调后续开发必须遵循OpenSpec工作流程
- 添加原型开发步骤的要求

## Impact

- Affected specs: vehicle-list (修正跳转)
- Affected code:
  - `miniprogram/pages/index/index.vue` (修正跳转逻辑)
  - `openspec/archives/2025-10-30_add-vehicle-list-page/README.md` (补充规范说明)

## 风险评估

- **技术风险**: 低 - 仅修改跳转逻辑，不影响现有功能
- **合规风险**: 中 - 需要确保后续开发严格遵循OpenSpec规范

## 验收标准

1. ✅ 首页查询按钮能正确跳转到房车列表页
2. ✅ 查询参数能正确传递并接收
3. ✅ OpenSpec规范文档更新完成
4. ✅ 开发流程合规性说明清晰

## 学习要点

1. **OpenSpec工作流程**: 涉及小程序页面开发必须遵循"原型确认 → 开发实现"的流程
2. **开发合规性**: 任何功能开发都不能跳过规范要求的关键步骤
3. **问题修正**: 及时发现和修正偏离规范的做法
# 开发检查清单 (Development Checklist)

本文档列出了每个开发周期必须完成的步骤，确保所有开发工作符合项目规范。

---

## 📋 开发前检查清单 (Pre-Development Checklist)

### 1. 理解需求和上下文

- [ ] 阅读 `openspec/project.md` 了解项目上下文、技术栈、开发规范
- [ ] 阅读 `docs/技术规范手册.md` 了解详细技术约束 (如 Taro 多端编译约束)
- [ ] 阅读 `docs/数据字典.md` 了解数据模型和字段定义
- [ ] 阅读 `docs/开发进度管理.md` 了解功能模块优先级和依赖关系
- [ ] 运行 `openspec list` 检查是否有冲突的变更
- [ ] 运行 `openspec list --specs` 了解现有功能

### 2. 创建 OpenSpec 变更提案

- [ ] 确定变更类型 (新功能/修改/删除/重构)
- [ ] 选择唯一的 `change-id` (kebab-case, verb-led)
- [ ] 创建目录 `openspec/changes/<change-id>/`
- [ ] 编写 `proposal.md` (Why, What Changes, Impact)
- [ ] 编写 `tasks.md` (实施步骤清单)
- [ ] 如需要，编写 `design.md` (技术决策)
- [ ] 创建 `specs/<capability>/spec.md` (ADDED/MODIFIED/REMOVED Requirements)
- [ ] 确保每个 Requirement 至少有一个 `#### Scenario:`
- [ ] 运行 `openspec validate <change-id> --strict` 验证提案
- [ ] 修复所有验证错误

### 3. 确认技术方案

- [ ] 确认使用的技术栈符合 `openspec/project.md` 中的规范
- [ ] 确认数据库设计符合 `docs/数据字典.md` 中的规范
- [ ] 确认 API 设计符合 RESTful 规范
- [ ] 确认多端适配方案符合 `docs/技术规范手册.md` 中的约束
- [ ] 确认测试策略 (单元测试 + 集成测试)

---

## 🛠️ 开发中检查清单 (During Development Checklist)

### 4. 代码实现

- [ ] 按照 `tasks.md` 中的顺序逐步实施
- [ ] 遵循代码风格规范 (ESLint + Prettier)
- [ ] 遵循命名约定 (PascalCase, camelCase, kebab-case)
- [ ] 所有代码标识符使用英文命名
- [ ] 代码注释使用中文编写
- [ ] 函数保持单一职责，默认 <100 行代码
- [ ] 避免过度设计，优先使用简单方案

### 5. 数据库变更

- [ ] 如有数据库变更，更新 `docs/数据字典.md`
- [ ] 创建数据库迁移脚本 (如使用 TypeORM migrations)
- [ ] 确认字段类型、长度、必填性符合规范
- [ ] 确认索引设计合理
- [ ] 确认敏感数据加密存储

### 6. API 开发

- [ ] 实现 Controller 层 (API 处理)
- [ ] 实现 Service 层 (业务逻辑)
- [ ] 实现 Model 层 (数据模型)
- [ ] 添加认证中间件 (如需要)
- [ ] 添加权限检查 (如需要)
- [ ] 统一响应格式
- [ ] 添加错误处理
- [ ] 添加日志记录

### 7. 前端开发 (如适用)

- [ ] 遵循 Taro 多端编译约束 (见 `docs/技术规范手册.md`)
- [ ] 使用 `Taro.request` 而非 `axios` 直接调用
- [ ] 使用 `Taro.navigateTo` 等统一 API
- [ ] 使用 `Taro.setStorage` 等统一存储 API
- [ ] 处理多端差异 (微信/支付宝/抖音/H5)
- [ ] 组件化开发，组件可复用
- [ ] 使用 Pinia 进行状态管理
- [ ] 路由懒加载，按需加载

---

## ✅ 开发后检查清单 (Post-Development Checklist)

### 8. 测试编写和执行

- [ ] 为每个 API 接口编写单元测试
- [ ] 为每个 Service 方法编写单元测试
- [ ] 编写集成测试 (API + 数据库)
- [ ] 测试成功场景 (Happy Path)
- [ ] 测试失败场景 (Error Cases)
- [ ] 测试边界条件 (Boundary Conditions)
- [ ] 运行 `npm test` 确保所有测试通过
- [ ] 确认测试覆盖率达到 100% (每个 API 模块)

### 9. 代码质量检查

- [ ] 运行 `npm run lint` 检查代码风格
- [ ] 修复所有 ESLint 错误和警告
- [ ] 运行 `npm run build` 确保编译成功
- [ ] 检查 TypeScript 类型错误
- [ ] 代码审查 (自我审查或团队审查)

### 10. 文档更新

- [ ] 更新 API 文档 (如 `backend/docs/` 下的 API 文档)
- [ ] 更新数据字典 (如有数据库变更)
- [ ] 更新 `tasks.md` 中的所有任务状态为 `[x]`
- [ ] 更新 `docs/完整开发历史与交接文档.md` (如有重大变更)
- [ ] 不创建临时文档、完成报告、修复报告

### 11. OpenSpec 归档

- [ ] 确认所有 `tasks.md` 中的任务已完成
- [ ] 运行 `openspec validate <change-id> --strict` 最终验证
- [ ] 运行 `openspec archive <change-id>` 归档变更
- [ ] 确认变更已移动到 `openspec/changes/archive/`
- [ ] 确认 `openspec/specs/` 已更新 (如适用)

---

## 🚀 部署前检查清单 (Pre-Deployment Checklist)

### 12. 环境配置

- [ ] 确认 `.env` 配置正确 (生产环境)
- [ ] 确认数据库连接配置正确
- [ ] 确认 Redis 连接配置正确
- [ ] 确认阿里云 OSS 配置正确 (如使用)
- [ ] 确认支付配置正确 (微信/支付宝)

### 13. 安全检查

- [ ] 确认敏感数据已加密存储
- [ ] 确认 JWT Token 配置正确
- [ ] 确认 API 接口有限流保护
- [ ] 确认 SQL 注入、XSS、CSRF 防护已启用
- [ ] 确认 HTTPS 已启用

### 14. 性能检查

- [ ] 确认页面加载时间 <2 秒
- [ ] 确认 API 响应时间 <500ms (平均)
- [ ] 确认数据库查询优化 (索引、查询语句)
- [ ] 确认缓存策略合理 (Redis)
- [ ] 确认图片已压缩 (单张 <500KB)

### 15. 最终验证

- [ ] 在测试环境完整测试所有功能
- [ ] 在生产环境进行冒烟测试
- [ ] 确认数据库备份策略已启用
- [ ] 确认监控和日志已配置
- [ ] 准备回滚方案 (如出现问题)

---

## 📊 检查清单使用说明

### 如何使用本检查清单

1. **开发前**: 完成第 1-3 节 (理解需求、创建提案、确认方案)
2. **开发中**: 完成第 4-7 节 (代码实现、数据库、API、前端)
3. **开发后**: 完成第 8-11 节 (测试、质量检查、文档、归档)
4. **部署前**: 完成第 12-15 节 (环境、安全、性能、验证)

### 检查清单的强制性

- ✅ 所有标记为 **必须** 的项目都是强制性的
- ⚠️ 跳过任何强制性检查项可能导致：
  - 代码质量问题
  - 测试失败
  - 生产环境故障
  - 变更被回滚

### 检查清单的更新

- 本检查清单应随项目发展持续更新
- 如发现新的检查项，请通过 OpenSpec 变更提案添加
- 如发现过时的检查项，请通过 OpenSpec 变更提案删除

---

## 🔗 相关文档

- `openspec/project.md` - 项目上下文和核心规范
- `openspec/AGENTS.md` - AI 助手 OpenSpec 工作流程
- `docs/技术规范手册.md` - 详细技术规范和约束
- `docs/数据字典.md` - 数据模型和字段定义
- `docs/开发进度管理.md` - 功能模块和开发顺序
- `docs/完整开发历史与交接文档.md` - 开发历史和问题解决方案

---

**最后更新**: 2025-10-26
**维护者**: AI 开发团队


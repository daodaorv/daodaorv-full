# OpenSpec 工作流完整指南

本文档详细说明如何在 DaoDaoRV01 项目中正确使用 OpenSpec 进行规范驱动开发。

---

## 📚 核心概念

### OpenSpec 是什么?

OpenSpec 是一个轻量级的规范驱动开发框架,用于确保人类和 AI 编码助手在编写代码之前就对要构建的内容达成一致。

### 为什么需要 OpenSpec?

- ✅ **明确意图**: 在编写代码前锁定需求,避免误解
- ✅ **可审查**: 结构化的变更文件夹使范围明确且可审查
- ✅ **可追溯**: 共享对提案、活动和归档内容的可见性
- ✅ **工具无关**: 适用于您已经使用的 AI 工具

---

## 🔄 三阶段工作流

```
┌────────────────────┐
│ 1. 创建变更提案     │  ← 与 AI 分享意图
│   (Proposal)       │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ 2. 审查并对齐       │  ← 反馈循环
│   (Review & Align) │◀──────────┐
└────────┬───────────┘           │
         │ 批准的计划              │
         ▼                        │
┌────────────────────┐            │
│ 3. 实现任务         │────────────┘
│   (Implement)      │
└────────┬───────────┘
         │ 交付变更
         ▼
┌────────────────────┐
│ 4. 归档并更新规范   │
│   (Archive)        │
└────────────────────┘
```

---

## 📋 阶段 1: 创建变更提案 (Proposal)

### 何时需要创建提案?

**需要创建提案** (满足任一条件):

- ✅ 添加新功能或能力
- ✅ 进行破坏性变更 (API、数据库架构)
- ✅ 修改架构或设计模式
- ✅ 性能优化 (改变行为)
- ✅ 更新安全模式

**无需创建提案** (可直接修复):

- ❌ Bug 修复 (恢复预期行为)
- ❌ 拼写错误、格式化、注释
- ❌ 依赖更新 (非破坏性)
- ❌ 配置变更
- ❌ 为现有行为添加测试

### 创建提案的步骤

#### 步骤 1: 检查现有状态

```bash
# 查看活动的变更
openspec list

# 查看现有的规范
openspec list --specs

# 查看项目上下文
cat openspec/project.md
```

#### 步骤 2: 选择变更 ID

**命名规则**:

- 使用 kebab-case (小写,连字符分隔)
- 动词开头: `add-`, `update-`, `remove-`, `refactor-`
- 简短且描述性: `add-two-factor-auth`
- 确保唯一性: 如果已存在,追加 `-2`, `-3` 等

**示例**:

- ✅ `add-profile-filters`
- ✅ `update-payment-flow`
- ✅ `remove-legacy-api`
- ✅ `refactor-auth-service`
- ❌ `new_feature` (使用下划线)
- ❌ `AddProfileFilters` (使用大写)

#### 步骤 3: 创建提案文件

**目录结构**:

```
openspec/changes/<change-id>/
├── proposal.md          # 为什么、改什么、影响
├── tasks.md             # 实现清单
├── design.md            # 技术决策 (可选)
└── specs/
    └── <capability>/
        └── spec.md      # 规范增量
```

**proposal.md 模板**:

```markdown
## Why

[1-2 句话说明问题/机会]

## What Changes

- [变更列表]
- [用 **BREAKING** 标记破坏性变更]

## Impact

- 受影响的规范: [列出能力]
- 受影响的代码: [关键文件/系统]
```

**tasks.md 模板**:

```markdown
## 1. 数据库设置

- [ ] 1.1 创建数据库架构
- [ ] 1.2 添加迁移脚本

## 2. 后端实现

- [ ] 2.1 实现 API 端点
- [ ] 2.2 添加业务逻辑
- [ ] 2.3 编写单元测试

## 3. 前端更新

- [ ] 3.1 创建 UI 组件
- [ ] 3.2 更新路由
- [ ] 3.3 添加集成测试
```

**specs/<capability>/spec.md 模板**:

```markdown
## ADDED Requirements

### Requirement: 新功能名称

系统应该提供...

#### Scenario: 成功案例

- **WHEN** 用户执行操作
- **THEN** 预期结果

## MODIFIED Requirements

### Requirement: 现有功能名称

[完整的修改后的需求文本]

#### Scenario: 更新的场景

- **WHEN** 条件
- **THEN** 结果

## REMOVED Requirements

### Requirement: 旧功能名称

**原因**: [为什么移除]
**迁移**: [如何处理]
```

#### 步骤 4: 验证提案

```bash
# 验证提案格式
openspec validate <change-id> --strict

# 查看提案详情
openspec show <change-id>

# 查看 JSON 格式 (调试用)
openspec show <change-id> --json --deltas-only
```

---

## 📋 阶段 2: 审查并对齐 (Review & Align)

### 审查清单

- [ ] `proposal.md` 清楚地说明了为什么和改什么
- [ ] `tasks.md` 包含所有必要的实现步骤
- [ ] `specs/<capability>/spec.md` 使用正确的操作标记 (`ADDED`, `MODIFIED`, `REMOVED`)
- [ ] 每个需求至少有一个 `#### Scenario:` 场景
- [ ] 场景使用正确的格式 (4 个 `#`, 不是粗体或列表)
- [ ] 运行 `openspec validate <change-id> --strict` 无错误

### 迭代改进

如果需要修改提案:

1. 编辑相应的文件 (`proposal.md`, `tasks.md`, `specs/`)
2. 重新运行 `openspec validate <change-id> --strict`
3. 与团队/AI 助手讨论直到达成一致

---

## 📋 阶段 3: 实现任务 (Implement)

### 实现步骤

1. ✅ 阅读 `proposal.md` - 理解要构建什么
2. ✅ 阅读 `design.md` (如果存在) - 了解技术决策
3. ✅ 阅读 `tasks.md` - 获取实现清单
4. ✅ 按顺序实现任务
5. ✅ 为每个任务编写测试
6. ✅ 运行 `npm test` 确保所有测试通过
7. ✅ 更新 `tasks.md` 将完成的任务标记为 `[x]`

### 实现示例

假设我们正在实现 `add-profile-filters` 变更:

```bash
# 1. 查看任务清单
cat openspec/changes/add-profile-filters/tasks.md

# 2. 实现第一个任务
# ... 编写代码 ...

# 3. 运行测试
npm test

# 4. 标记任务完成
# 编辑 tasks.md, 将 `- [ ] 1.1 ...` 改为 `- [x] 1.1 ...`

# 5. 继续下一个任务
# ... 重复步骤 2-4 ...
```

---

## 📋 阶段 4: 归档并更新规范 (Archive)

### 归档前检查

- [ ] 所有 `tasks.md` 中的任务都标记为 `[x]`
- [ ] 所有测试通过 (100% 通过率)
- [ ] 代码已提交到版本控制
- [ ] 相关文档已更新

### 归档命令

```bash
# 归档变更 (交互式)
openspec archive <change-id>

# 归档变更 (非交互式)
openspec archive <change-id> --yes

# 归档变更 (跳过规范更新,仅用于工具变更)
openspec archive <change-id> --skip-specs --yes
```

### 归档后验证

```bash
# 验证归档后的变更
openspec validate --strict

# 查看归档的变更
ls openspec/changes/archive/

# 查看更新后的规范
openspec list --specs
```

---

## 🎯 完整示例: 添加双因素认证

### 步骤 1: 创建提案

```bash
# 1. 检查现有状态
openspec list
openspec list --specs

# 2. 创建变更目录
mkdir -p openspec/changes/add-two-factor-auth/specs/auth

# 3. 创建 proposal.md
cat > openspec/changes/add-two-factor-auth/proposal.md << 'EOF'
## Why

用户账户安全需要增强,添加双因素认证可以防止未授权访问。

## What Changes

- 添加 OTP (一次性密码) 生成和验证功能
- 修改登录流程以要求第二因素
- 添加用户设置页面以启用/禁用 2FA

## Impact

- 受影响的规范: auth
- 受影响的代码: 
  - backend/src/controllers/auth.controller.ts
  - backend/src/services/auth.service.ts
  - backend/src/entities/User.ts
EOF

# 4. 创建 tasks.md
cat > openspec/changes/add-two-factor-auth/tasks.md << 'EOF'
## 1. 数据库设置

- [ ] 1.1 在 users 表添加 otp_secret 列
- [ ] 1.2 创建 otp_verification_logs 表

## 2. 后端实现

- [ ] 2.1 添加 OTP 生成端点
- [ ] 2.2 修改登录流程以要求 OTP
- [ ] 2.3 添加 OTP 验证端点
- [ ] 2.4 编写单元测试

## 3. 前端更新

- [ ] 3.1 创建 OTP 输入组件
- [ ] 3.2 更新登录流程 UI
- [ ] 3.3 添加用户设置页面
EOF

# 5. 创建规范增量
cat > openspec/changes/add-two-factor-auth/specs/auth/spec.md << 'EOF'
## ADDED Requirements

### Requirement: Two-Factor Authentication

用户必须在登录时提供第二因素。

#### Scenario: OTP 要求

- **WHEN** 提供有效凭证
- **THEN** 要求 OTP 挑战

#### Scenario: OTP 验证成功

- **WHEN** 提供正确的 OTP
- **THEN** 返回 JWT 令牌

#### Scenario: OTP 验证失败

- **WHEN** 提供错误的 OTP
- **THEN** 返回 401 错误
EOF

# 6. 验证提案
openspec validate add-two-factor-auth --strict
```

### 步骤 2: 实现变更

```bash
# 1. 查看任务
cat openspec/changes/add-two-factor-auth/tasks.md

# 2. 实现任务 (由 AI 助手或开发者完成)
# ... 编写代码 ...

# 3. 运行测试
npm test

# 4. 更新任务状态
# 编辑 tasks.md, 将所有任务标记为 [x]
```

### 步骤 3: 归档变更

```bash
# 1. 确认所有任务完成
cat openspec/changes/add-two-factor-auth/tasks.md

# 2. 确认所有测试通过
npm test

# 3. 归档变更
openspec archive add-two-factor-auth --yes

# 4. 验证归档
openspec validate --strict
```

---

## 🚨 常见错误和解决方案

### 错误 1: "Change must have at least one delta"

**原因**: 缺少规范增量文件

**解决方案**:

```bash
# 检查是否存在 specs/ 目录
ls openspec/changes/<change-id>/specs/

# 创建规范增量
mkdir -p openspec/changes/<change-id>/specs/<capability>
# 编辑 openspec/changes/<change-id>/specs/<capability>/spec.md
```

### 错误 2: "Requirement must have at least one scenario"

**原因**: 需求缺少场景或场景格式错误

**解决方案**:

```markdown
<!-- 错误格式 -->
- **Scenario: 用户登录** ❌
**Scenario**: 用户登录 ❌
### Scenario: 用户登录 ❌

<!-- 正确格式 -->
#### Scenario: 用户登录成功 ✅

- **WHEN** 提供有效凭证
- **THEN** 返回 JWT 令牌
```

### 错误 3: "Silent scenario parsing failures"

**原因**: 场景格式不完全正确

**解决方案**:

```bash
# 调试场景解析
openspec show <change-id> --json --deltas-only

# 检查场景格式
# 必须使用: #### Scenario: 名称
```

---

## 📚 参考资源

- **OpenSpec 官方文档**: https://github.com/Fission-AI/OpenSpec
- **项目规范**: `openspec/project.md`
- **开发检查清单**: `openspec/DEVELOPMENT_CHECKLIST.md`
- **技术规范手册**: `docs/技术规范手册.md`
- **数据字典**: `docs/数据字典.md`

---

## 🎯 快速参考

### 常用命令

```bash
# 查看活动变更
openspec list

# 查看现有规范
openspec list --specs

# 查看变更详情
openspec show <change-id>

# 验证变更
openspec validate <change-id> --strict

# 归档变更
openspec archive <change-id> --yes
```

### 文件用途

- `proposal.md` - 为什么和改什么
- `tasks.md` - 实现步骤
- `design.md` - 技术决策 (可选)
- `spec.md` - 需求和行为

### 阶段指示器

- `openspec/changes/` - 提案,尚未构建
- `openspec/specs/` - 已构建和部署
- `openspec/changes/archive/` - 已完成的变更

---

**记住**: 规范是真相。变更是提案。保持它们同步。


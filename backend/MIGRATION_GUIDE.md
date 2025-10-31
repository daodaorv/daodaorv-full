# 数据库迁移指南 - 术语合规性修正

## 概述

本迁移用于修正项目中的术语合规性问题，将禁止使用的金融投资术语替换为合规术语。

## 变更内容

### 1. 表名变更

| 旧表名 | 新表名 | 说明 |
|--------|--------|------|
| `shareholder_points` | `owner_points` | 众筹车主积分表 |
| `dividends` | `profit_sharing` | 分润记录表 |

### 2. 字段名变更

**profit_sharing 表**：

| 旧字段名 | 新字段名 | 说明 |
|----------|----------|------|
| `dividendNo` | `profitSharingNo` | 分润编号 |
| `dividendAmount` | `profitSharingAmount` | 分润金额 |

### 3. 索引变更

| 旧索引名 | 新索引名 | 表名 |
|----------|----------|------|
| `idx_dividend_no` | `idx_profit_sharing_no` | profit_sharing |

## 执行迁移

### 前提条件

1. 确保已备份数据库
2. 确保应用程序已停止运行
3. 确保 TypeORM 配置正确

### 执行步骤

#### 方式一：使用 TypeORM CLI（推荐）

如果项目配置了 TypeORM CLI：

```bash
# 1. 进入 backend 目录
cd backend

# 2. 运行迁移
npm run typeorm migration:run

# 如果需要回滚
npm run typeorm migration:revert
```

#### 方式二：手动执行 SQL

如果没有配置 TypeORM CLI，可以手动执行以下 SQL：

```sql
-- 1. 重命名 shareholder_points 表为 owner_points
ALTER TABLE `shareholder_points` RENAME TO `owner_points`;

-- 2. 重命名 dividends 表为 profit_sharing
ALTER TABLE `dividends` RENAME TO `profit_sharing`;

-- 3. 删除旧索引
DROP INDEX `idx_dividend_no` ON `profit_sharing`;

-- 4. 重命名字段：dividendNo → profitSharingNo
ALTER TABLE `profit_sharing` 
CHANGE `dividendNo` `profitSharingNo` varchar(32) NOT NULL COMMENT '分润编号';

-- 5. 重命名字段：dividendAmount → profitSharingAmount
ALTER TABLE `profit_sharing` 
CHANGE `dividendAmount` `profitSharingAmount` decimal(12,2) NOT NULL COMMENT '分润金额(元)';

-- 6. 创建新索引
CREATE UNIQUE INDEX `idx_profit_sharing_no` ON `profit_sharing` (`profitSharingNo`);
```

### 回滚步骤

如果需要回滚迁移，执行以下 SQL：

```sql
-- 1. 删除新索引
DROP INDEX `idx_profit_sharing_no` ON `profit_sharing`;

-- 2. 重命名字段：profitSharingAmount → dividendAmount
ALTER TABLE `profit_sharing` 
CHANGE `profitSharingAmount` `dividendAmount` decimal(12,2) NOT NULL COMMENT '分红金额(元)';

-- 3. 重命名字段：profitSharingNo → dividendNo
ALTER TABLE `profit_sharing` 
CHANGE `profitSharingNo` `dividendNo` varchar(32) NOT NULL COMMENT '分红编号';

-- 4. 创建旧索引
CREATE UNIQUE INDEX `idx_dividend_no` ON `profit_sharing` (`dividendNo`);

-- 5. 重命名 profit_sharing 表为 dividends
ALTER TABLE `profit_sharing` RENAME TO `dividends`;

-- 6. 重命名 owner_points 表为 shareholder_points
ALTER TABLE `owner_points` RENAME TO `shareholder_points`;
```

## 验证迁移

### 1. 检查表名

```sql
SHOW TABLES LIKE '%owner_points%';
SHOW TABLES LIKE '%profit_sharing%';
```

应该看到：
- `owner_points`
- `profit_sharing`

不应该看到：
- `shareholder_points`
- `dividends`

### 2. 检查字段名

```sql
DESCRIBE profit_sharing;
```

应该看到字段：
- `profitSharingNo`
- `profitSharingAmount`

不应该看到：
- `dividendNo`
- `dividendAmount`

### 3. 检查索引

```sql
SHOW INDEX FROM profit_sharing;
```

应该看到索引：
- `idx_profit_sharing_no`

不应该看到：
- `idx_dividend_no`

## 注意事项

### 1. 数据完整性

- 迁移过程中不会丢失任何数据
- 只是重命名表名和字段名
- 所有关联关系保持不变

### 2. 应用程序兼容性

- 确保应用程序代码已更新（已完成）
- 确保所有 Entity 类已更新（已完成）
- 确保所有 Service 类已更新（已完成）
- 确保所有 Controller 类已更新（已完成）

### 3. API 兼容性

**破坏性变更**：

- API 路径已变更：`/dividends/*` → `/profit-sharings/*`
- 响应字段已变更：`dividendNo` → `profitSharingNo`
- 响应字段已变更：`dividendAmount` → `profitSharingAmount`

**影响范围**：

- 前端应用需要同步更新
- 第三方集成需要同步更新
- API 文档需要同步更新

### 4. 执行时机

建议在以下时机执行迁移：

- 系统维护窗口期
- 用户访问量最低时段
- 已通知所有相关方

### 5. 回滚准备

- 执行前务必备份数据库
- 准备好回滚脚本
- 测试回滚流程

## 测试建议

### 1. 开发环境测试

```bash
# 1. 备份开发数据库
mysqldump -u root -p daodao_rv_dev > backup_dev.sql

# 2. 执行迁移
npm run typeorm migration:run

# 3. 运行测试
npm test

# 4. 验证功能
# - 创建众筹项目
# - 购买份额
# - 计算分润
# - 发放分润
# - 查看分润记录

# 5. 如果有问题，回滚
npm run typeorm migration:revert
mysql -u root -p daodao_rv_dev < backup_dev.sql
```

### 2. 生产环境部署

```bash
# 1. 备份生产数据库（重要！）
mysqldump -u root -p daodao_rv_prod > backup_prod_$(date +%Y%m%d_%H%M%S).sql

# 2. 停止应用服务
pm2 stop daodao-rv-backend

# 3. 执行迁移
cd backend
npm run typeorm migration:run

# 4. 启动应用服务
pm2 start daodao-rv-backend

# 5. 验证功能
# - 检查日志
# - 测试关键功能
# - 监控错误率

# 6. 如果有问题，立即回滚
pm2 stop daodao-rv-backend
npm run typeorm migration:revert
pm2 start daodao-rv-backend
```

## 相关文件

- 迁移文件：`backend/src/migrations/1730000000000-RenameTerminologyForCompliance.ts`
- Entity 文件：
  - `backend/src/entities/OwnerPoints.ts`
  - `backend/src/entities/ProfitSharing.ts`
- Service 文件：
  - `backend/src/services/profit-sharing.service.ts`
  - `backend/src/services/crowdfunding-share.service.ts`
- Controller 文件：
  - `backend/src/controllers/profit-sharing.controller.ts`
- 工具文件：
  - `backend/src/utils/profit-sharing-calculator.ts`
  - `backend/src/utils/crowdfunding-number.ts`

## 支持

如有问题，请联系开发团队。


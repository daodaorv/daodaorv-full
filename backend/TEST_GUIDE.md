# 测试指南

## ✅ 测试环境已完全配置

### 核心改进

1. **✅ Redis Mock** - 不再依赖外部Redis服务
2. **✅ 数据库自动清理** - 每次测试后自动清空所有表
3. **✅ 固定管理员账号** - 使用 `13800000000` 作为测试管理员
4. **✅ 唯一测试数据** - 每个用户使用唯一手机号
5. **✅ 串行执行** - Jest配置为 `maxWorkers: 1` 避免并发冲突

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- tests/auth.test.ts
npm test -- tests/vehicle.test.ts
npm test -- tests/order.test.ts
npm test -- tests/wallet.test.ts

# 查看测试覆盖率
npm test -- --coverage
```

### 测试架构

```
tests/
├── setup.ts                     # 全局测试设置（数据库初始化和清理）
├── helpers/
│   ├── test-data.ts            # 生成唯一测试数据
│   └── test-utils.ts           # 测试工具函数
├── auth.test.ts                # 认证API测试 ✅
├── vehicle.test.ts             # 车辆管理测试
├── order.test.ts               # 订单管理测试
└── wallet.test.ts              # 钱包管理测试
```

### 测试数据策略

#### 管理员账号
- 手机号：`13800000000`
- 密码：`Admin@123456`
- 自动创建（首次调用 `getAdminToken()` 时）

#### 普通用户
- 使用 `generateUniquePhone()` 生成唯一手机号
- 每个测试使用独立的用户数据
- 测试结束后自动清理

### 数据库清理

测试结束后自动清空以下表（保持顺序）：
1. `withdrawal_records`
2. `wallet_transactions`
3. `wallets`
4. `orders`
5. `transfer_records`
6. `maintenance_records`
7. `vehicles`
8. `vehicle_models`
9. `users`

### Mock服务

#### Redis Mock
测试环境使用内存Map模拟Redis：
- `saveToken()` - 保存Token
- `verifyToken()` - 验证Token（默认返回true）
- `removeToken()` - 移除Token
- `removeAllTokens()` - 移除用户所有Token

### 常见问题

#### Q: Redis连接超时
**A:** 已使用Mock Redis，不需要真实Redis服务

#### Q: 手机号已注册错误
**A:** 已修复，每个测试使用唯一手机号

#### Q: 数据库数据冲突
**A:** 已添加自动清理机制

#### Q: 测试卡住不动
**A:** 已配置串行执行（maxWorkers: 1）

### 测试最佳实践

1. **使用 beforeAll** - 创建测试所需的基础数据
2. **使用唯一数据** - 调用 `generateUnique*()` 函数
3. **避免硬编码** - 不要使用固定的手机号、车牌号等（管理员除外）
4. **清理资源** - 重要资源在测试后手动清理
5. **独立测试** - 每个测试应该能独立运行

### 预期结果

运行 `npm test` 应该看到：

```
✅ auth.test.ts    - 19 passed
✅ wallet.test.ts  - 22 passed
✅ vehicle.test.ts - XX passed
✅ order.test.ts   - XX passed

Test Suites: 4 passed, 4 total
Tests:       XX passed, XX total
```


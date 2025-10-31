/**
 * Jest 全局测试设置
 * 在所有测试运行前后执行
 */

// 加载测试环境配置
import * as dotenv from 'dotenv';
import * as path from 'path';

// 优先加载 .env.test 文件
const testEnvPath = path.resolve(__dirname, '../.env.test');
dotenv.config({ path: testEnvPath });

import { AppDataSource } from '../src/config/database';

/**
 * 清理数据库中的所有数据
 */
async function clearDatabase() {
  if (!AppDataSource.isInitialized) {
    return;
  }

  try {
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0');

    // 动态获取所有表名
    const entities = AppDataSource.entityMetadatas;
    for (const entity of entities) {
      const tableName = entity.tableName;
      try {
        await AppDataSource.query(`TRUNCATE TABLE \`${tableName}\``);
      } catch (error: any) {
        // 如果表不存在，忽略错误
        if (!error.message.includes("doesn't exist")) {
          console.error(`清理表 ${tableName} 失败:`, error.message);
        }
      }
    }

    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1');
  } catch (error) {
    console.error('清理数据库失败:', error);
    throw error;
  }
}

/**
 * 在所有测试开始前执行一次
 */
beforeAll(async () => {
  console.log('🧪 测试环境初始化...');

  // 初始化数据库连接
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('✅ 测试数据库连接已建立');
  }

  // 初始化时清理一次数据库
  await clearDatabase();
  console.log('✅ 测试数据库已清理');
});

// 注意：不在 beforeEach 中清理数据库
// 因为 Jest 配置了 maxWorkers: 1（串行运行）
// 每个测试文件之间会清理，同一文件内的测试可以共享数据

/**
 * 在所有测试结束后执行一次
 */
afterAll(async () => {
  console.log('🔧 测试环境清理中...');

  // 最后清理所有测试数据
  await clearDatabase();
  console.log('✅ 测试数据库已清理');

  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('✅ 测试数据库连接已关闭');
  }

  console.log('✅ 测试环境清理完成');
});

// 设置测试超时时间
jest.setTimeout(30000);

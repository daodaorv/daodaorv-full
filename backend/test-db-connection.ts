/**
 * 测试数据库连接和实体加载
 */
import 'reflect-metadata';
import { AppDataSource } from './src/config/database';

async function testConnection() {
  try {
    console.log('🔍 检查实体配置...');
    console.log('实体数量:', AppDataSource.options.entities?.length);
    console.log('实体列表:', AppDataSource.options.entities);

    console.log('\n🔌 尝试连接数据库...');
    await AppDataSource.initialize();
    console.log('✅ 数据库连接成功');

    console.log('\n📊 检查实体元数据...');
    const entities = AppDataSource.entityMetadatas;
    console.log('已加载的实体数量:', entities.length);
    entities.forEach((entity) => {
      console.log(`  - ${entity.name} (表名: ${entity.tableName})`);
    });

    console.log('\n✅ 所有检查通过!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('\n❌ 错误:', error);
    process.exit(1);
  }
}

testConnection();


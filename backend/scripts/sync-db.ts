/**
 * 手动同步数据库结构
 * 确保所有实体的表都被创建
 */
import { AppDataSource } from '../src/config/database';

async function syncDatabase() {
  try {
    console.log('🔧 开始同步数据库...');
    
    // 初始化数据源
    await AppDataSource.initialize();
    console.log('✅ 数据库连接成功');
    
    // 同步所有实体表结构
    await AppDataSource.synchronize(true); // force=true 会删除并重建表
    console.log('✅ 数据库表结构同步完成');
    
    // 显示所有创建的表
    const tables = await AppDataSource.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'daodao_rv'"
    );
    console.log('\n📋 已创建的表:');
    tables.forEach((table: any) => {
      console.log(`  - ${table.TABLE_NAME}`);
    });
    
    await AppDataSource.destroy();
    console.log('\n✅ 数据库同步成功完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库同步失败:', error);
    process.exit(1);
  }
}

syncDatabase();


/**
 * 创建测试数据库
 */
const mysql = require('mysql2/promise');

async function createTestDatabase() {
  console.log('🔧 创建测试数据库...\n');
  
  try {
    // 连接到 MySQL (不指定数据库)
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: 'daodao123456',
    });
    
    console.log('✅ 已连接到 MySQL');
    
    // 删除旧的测试数据库(如果存在)
    await connection.query('DROP DATABASE IF EXISTS daodao_rv_test');
    console.log('🗑️  已删除旧的测试数据库(如果存在)');
    
    // 创建新的测试数据库
    await connection.query('CREATE DATABASE daodao_rv_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ 已创建测试数据库: daodao_rv_test');
    
    await connection.end();
    
    console.log('\n🎉 测试数据库创建成功!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建测试数据库失败:', error.message);
    process.exit(1);
  }
}

createTestDatabase();


/**
 * 测试 Docker 服务连接
 */
const mysql = require('mysql2/promise');
const Redis = require('ioredis');

async function testMySQL() {
  console.log('🔍 测试 MySQL 连接 (端口 3307)...\n');
  
  const passwords = ['123456', 'root', '', 'password', 'daodao123456'];
  
  for (const password of passwords) {
    try {
      const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3307,
        user: 'root',
        password: password,
      });
      
      console.log(`✅ MySQL 连接成功!`);
      console.log(`   密码: "${password}"`);
      console.log(`   端口: 3307\n`);
      
      // 测试查询
      const [rows] = await connection.execute('SHOW DATABASES');
      console.log('📋 数据库列表:');
      rows.forEach(row => {
        console.log(`   - ${row.Database}`);
      });
      
      // 检查 daodao_rv 数据库
      const dbExists = rows.some(row => row.Database === 'daodao_rv');
      if (dbExists) {
        console.log('\n✅ daodao_rv 数据库已存在');
      } else {
        console.log('\n⚠️  daodao_rv 数据库不存在，需要创建');
      }
      
      await connection.end();
      return true;
    } catch (error) {
      console.log(`❌ 密码 "${password}" 失败: ${error.message}`);
    }
  }
  
  console.log('\n❌ 所有密码都失败了');
  return false;
}

async function testRedis() {
  console.log('\n🔍 测试 Redis 连接 (端口 6379)...\n');
  
  try {
    const redis = new Redis({
      host: 'localhost',
      port: 6379,
      retryStrategy: () => null, // 不重试
    });
    
    // 测试连接
    await redis.ping();
    console.log('✅ Redis 连接成功!');
    console.log('   端口: 6379\n');
    
    // 测试读写
    await redis.set('test_key', 'test_value');
    const value = await redis.get('test_key');
    console.log('📝 测试读写:');
    console.log(`   写入: test_key = test_value`);
    console.log(`   读取: test_key = ${value}`);
    
    if (value === 'test_value') {
      console.log('   ✅ 读写正常\n');
    }
    
    // 清理测试数据
    await redis.del('test_key');
    
    await redis.quit();
    return true;
  } catch (error) {
    console.log(`❌ Redis 连接失败: ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log('🐳 Docker 服务连接测试\n');
  console.log('='.repeat(50) + '\n');
  
  const mysqlOk = await testMySQL();
  const redisOk = await testRedis();
  
  console.log('='.repeat(50));
  console.log('\n📊 测试结果汇总:\n');
  console.log(`   MySQL: ${mysqlOk ? '✅ 正常' : '❌ 失败'}`);
  console.log(`   Redis: ${redisOk ? '✅ 正常' : '❌ 失败'}`);
  
  if (mysqlOk && redisOk) {
    console.log('\n🎉 所有服务连接正常！可以运行测试了。\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  部分服务连接失败，请检查配置。\n');
    process.exit(1);
  }
}

main();


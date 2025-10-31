/**
 * 测试不同的 MySQL 密码
 */
const mysql = require('mysql2/promise');

const passwords = ['', '123456', 'root', 'password', 'mysql', 'daodao123456'];

async function testPassword(password) {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: password,
    });
    
    console.log(`✅ 成功! 密码是: "${password}"`);
    await connection.end();
    return true;
  } catch (error) {
    console.log(`❌ 密码 "${password}" 失败: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 测试 MySQL root 密码...\n');
  
  for (const password of passwords) {
    const success = await testPassword(password);
    if (success) {
      process.exit(0);
    }
  }
  
  console.log('\n❌ 所有密码都失败了。请手动提供正确的密码。');
  process.exit(1);
}

main();


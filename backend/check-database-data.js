/**
 * 检查数据库中的数据
 */
const mysql = require('mysql2/promise');

async function checkDatabase() {
  console.log('🔍 检查数据库数据\n');
  console.log('='.repeat(60) + '\n');

  try {
    // 连接数据库
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: 'daodao123456',
      database: 'daodao_rv',
    });

    console.log('✅ 数据库连接成功\n');

    // 获取所有表
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📋 数据库表列表 (共 ${tables.length} 个表):\n`);

    const tableStats = [];

    for (const table of tables) {
      const tableName = table[`Tables_in_daodao_rv`];

      // 获取表的行数
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM \`${tableName}\``
      );
      const count = countResult[0].count;

      tableStats.push({ tableName, count });
    }

    // 按行数排序
    tableStats.sort((a, b) => b.count - a.count);

    // 显示表统计
    console.log('表名'.padEnd(40) + '行数');
    console.log('-'.repeat(60));

    let totalRows = 0;
    for (const { tableName, count } of tableStats) {
      const emoji = count > 0 ? '✅' : '⚪';
      console.log(`${emoji} ${tableName.padEnd(38)} ${count.toString().padStart(6)}`);
      totalRows += count;
    }

    console.log('-'.repeat(60));
    console.log(`总计: ${tableStats.length} 个表，${totalRows} 行数据\n`);

    // 检查测试数据
    console.log('🔍 检查测试数据:\n');

    // 检查用户
    const [users] = await connection.execute(
      "SELECT COUNT(*) as count FROM users WHERE phone LIKE '138%'"
    );
    console.log(`   用户 (phone 以 138 开头): ${users[0].count} 个`);

    // 检查车型
    const [models] = await connection.execute(
      "SELECT COUNT(*) as count FROM vehicle_models WHERE modelName LIKE 'test_%'"
    );
    console.log(`   车型 (modelName 以 test_ 开头): ${models[0].count} 个`);

    // 检查车辆
    const [vehicles] = await connection.execute(
      "SELECT COUNT(*) as count FROM vehicles WHERE licensePlate LIKE '京A%'"
    );
    console.log(`   车辆 (licensePlate 以 京A 开头): ${vehicles[0].count} 个`);

    // 检查订单
    const [orders] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    console.log(`   订单: ${orders[0].count} 个`);

    // 检查钱包
    const [wallets] = await connection.execute('SELECT COUNT(*) as count FROM wallets');
    console.log(`   钱包: ${wallets[0].count} 个`);

    console.log('\n' + '='.repeat(60));

    // 显示一些示例数据
    if (users[0].count > 0) {
      console.log('\n📝 示例用户数据 (前 5 个):\n');
      const [sampleUsers] = await connection.execute(
        "SELECT id, phone, nickname, status FROM users WHERE phone LIKE '138%' LIMIT 5"
      );
      console.table(sampleUsers);
    }

    if (models[0].count > 0) {
      console.log('\n📝 示例车型数据 (前 5 个):\n');
      const [sampleModels] = await connection.execute(
        "SELECT id, modelName, brand, seatCount, bedCount FROM vehicle_models WHERE modelName LIKE 'test_%' LIMIT 5"
      );
      console.table(sampleModels);
    }

    await connection.end();

    // 总结
    console.log('\n📊 数据库状态总结:\n');
    if (totalRows === 0) {
      console.log('   ⚠️  数据库为空，需要导入 Mock 数据');
      console.log('   建议运行: npm run seed-mock-data\n');
    } else if (users[0].count > 0) {
      console.log('   ✅ 数据库包含测试数据');
      console.log(`   ✅ 共 ${totalRows} 行数据\n`);
    } else {
      console.log('   ℹ️  数据库包含数据，但没有测试数据');
      console.log(`   ℹ️  共 ${totalRows} 行数据\n`);
    }
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

checkDatabase();

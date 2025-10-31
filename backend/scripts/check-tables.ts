import { AppDataSource } from '../src/config/database';

async function checkTables() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();

    // 检查所有表
    console.log('\n📋 Checking tables...\n');
    
    const tables = await queryRunner.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);

    console.log('All tables in database:');
    tables.forEach((table: any) => {
      console.log(`  - ${table.TABLE_NAME}`);
    });

    // 检查旧表是否存在
    console.log('\n🔍 Checking old tables (before migration)...\n');
    
    const oldTables = ['shareholder_points', 'dividends'];
    for (const tableName of oldTables) {
      const exists = tables.some((t: any) => t.TABLE_NAME === tableName);
      console.log(`  ${exists ? '✅' : '❌'} ${tableName}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
    }

    // 检查新表是否存在
    console.log('\n🔍 Checking new tables (after migration)...\n');
    
    const newTables = ['owner_points', 'profit_sharing'];
    for (const tableName of newTables) {
      const exists = tables.some((t: any) => t.TABLE_NAME === tableName);
      console.log(`  ${exists ? '✅' : '❌'} ${tableName}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
    }

    // 检查迁移表
    console.log('\n🔍 Checking migrations table...\n');
    
    const migrationsTableExists = tables.some((t: any) => t.TABLE_NAME === 'migrations');
    console.log(`  ${migrationsTableExists ? '✅' : '❌'} migrations: ${migrationsTableExists ? 'EXISTS' : 'NOT FOUND'}`);

    if (migrationsTableExists) {
      const migrations = await queryRunner.query('SELECT * FROM migrations');
      console.log('\nExecuted migrations:');
      if (migrations.length === 0) {
        console.log('  (none)');
      } else {
        migrations.forEach((m: any) => {
          console.log(`  - ${m.name} (executed at: ${m.timestamp})`);
        });
      }
    }

    await queryRunner.release();
    await AppDataSource.destroy();
    console.log('\n✅ Check completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTables();


import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config();

// 创建 DataSource 用于迁移
const MigrationDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3307'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'daodao123456',
  database: process.env.DB_DATABASE || 'daodao_rv',
  entities: [path.join(__dirname, 'src/entities/**/*.ts')],
  migrations: [path.join(__dirname, 'src/migrations/**/*.ts')],
  charset: 'utf8mb4',
  synchronize: false, // 迁移模式下禁用自动同步
  logging: true,
});

export default MigrationDataSource;

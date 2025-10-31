import { Context } from 'koa';
import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';

/**
 * 调试控制器 - 查看数据库数据
 */
export class DebugController {
  /**
   * 获取数据库表信息和数据
   */
  static async getDatabaseInfo(ctx: Context) {
    try {
      const queryRunner = AppDataSource.createQueryRunner();

      // 获取所有表
      const tablesResult = await queryRunner.query(`
        SELECT TABLE_NAME as tableName,
               TABLE_COMMENT as tableComment,
               TABLE_ROWS as rowCount
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = 'daodao_rv'
        ORDER BY TABLE_NAME
      `);

      const tables = [];

      for (const table of tablesResult) {
        // 获取表结构
        const columnsResult = await queryRunner.query(`
          SELECT COLUMN_NAME as columnName,
                 DATA_TYPE as dataType,
                 IS_NULLABLE as isNullable,
                 COLUMN_DEFAULT as defaultValue,
                 COLUMN_COMMENT as columnComment
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = 'daodao_rv'
          AND TABLE_NAME = '${table.tableName}'
          ORDER BY ORDINAL_POSITION
        `);

        // 获取表数据样本（最多5条）
        let sampleData = [];
        try {
          const dataResult = await queryRunner.query(`SELECT * FROM ${table.tableName} LIMIT 5`);
          sampleData = dataResult;
        } catch (error) {
          sampleData = [];
        }

        tables.push({
          tableName: table.tableName,
          tableComment: table.tableComment,
          rowCount: table.rowCount || 0,
          columns: columnsResult,
          sampleData: sampleData
        });
      }

      await queryRunner.release();

      ctx.body = {
        success: true,
        data: {
          database: 'daodao_rv',
          totalTables: tables.length,
          tables: tables
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      logger.error('获取数据库信息失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: '获取数据库信息失败',
        error: error.message
      };
    }
  }

  /**
   * 获取特定表的详细数据
   */
  static async getTableData(ctx: Context) {
    try {
      const { tableName } = ctx.params;

      if (!tableName) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: '缺少表名参数'
        };
        return;
      }

      const queryRunner = AppDataSource.createQueryRunner();

      // 验证表是否存在
      const tableExists = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = 'daodao_rv'
        AND TABLE_NAME = '${tableName}'
      `);

      if (tableExists[0].count === 0) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: `表 ${tableName} 不存在`
        };
        await queryRunner.release();
        return;
      }

      // 获取表的总行数
      const countResult = await queryRunner.query(`SELECT COUNT(*) as total FROM ${tableName}`);
      const totalRows = countResult[0].total;

      // 获取分页数据
      const page = parseInt(ctx.query.page || '1');
      const pageSize = Math.min(parseInt(ctx.query.pageSize || '20'), 100);
      const offset = (page - 1) * pageSize;

      const data = await queryRunner.query(`
        SELECT * FROM ${tableName}
        ORDER BY id DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `);

      await queryRunner.release();

      ctx.body = {
        success: true,
        data: {
          tableName,
          totalRows,
          page,
          pageSize,
          totalPages: Math.ceil(totalRows / pageSize),
          data: data
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      logger.error('获取表数据失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: '获取表数据失败',
        error: error.message
      };
    }
  }
}
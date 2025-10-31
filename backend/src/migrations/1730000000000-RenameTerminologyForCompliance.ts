import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 术语合规性修正迁移
 * 
 * 修改内容：
 * 1. 表名修改：
 *    - shareholder_points → owner_points
 *    - dividends → profit_sharing
 * 
 * 2. 字段名修改（profit_sharing表）：
 *    - dividendNo → profitSharingNo
 *    - dividendAmount → profitSharingAmount
 * 
 * 3. 索引名修改：
 *    - idx_dividend_no → idx_profit_sharing_no
 */
export class RenameTerminologyForCompliance1730000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 重命名 shareholder_points 表为 owner_points
    await queryRunner.query(
      `ALTER TABLE \`shareholder_points\` RENAME TO \`owner_points\``
    );

    // 2. 重命名 dividends 表为 profit_sharing
    await queryRunner.query(
      `ALTER TABLE \`dividends\` RENAME TO \`profit_sharing\``
    );

    // 3. 删除旧索引
    await queryRunner.query(
      `DROP INDEX \`idx_dividend_no\` ON \`profit_sharing\``
    );

    // 4. 重命名字段：dividendNo → profitSharingNo
    await queryRunner.query(
      `ALTER TABLE \`profit_sharing\` CHANGE \`dividendNo\` \`profitSharingNo\` varchar(32) NOT NULL COMMENT '分润编号'`
    );

    // 5. 重命名字段：dividendAmount → profitSharingAmount
    await queryRunner.query(
      `ALTER TABLE \`profit_sharing\` CHANGE \`dividendAmount\` \`profitSharingAmount\` decimal(12,2) NOT NULL COMMENT '分润金额(元)'`
    );

    // 6. 创建新索引
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`idx_profit_sharing_no\` ON \`profit_sharing\` (\`profitSharingNo\`)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚操作（按相反顺序）

    // 1. 删除新索引
    await queryRunner.query(
      `DROP INDEX \`idx_profit_sharing_no\` ON \`profit_sharing\``
    );

    // 2. 重命名字段：profitSharingAmount → dividendAmount
    await queryRunner.query(
      `ALTER TABLE \`profit_sharing\` CHANGE \`profitSharingAmount\` \`dividendAmount\` decimal(12,2) NOT NULL COMMENT '分红金额(元)'`
    );

    // 3. 重命名字段：profitSharingNo → dividendNo
    await queryRunner.query(
      `ALTER TABLE \`profit_sharing\` CHANGE \`profitSharingNo\` \`dividendNo\` varchar(32) NOT NULL COMMENT '分红编号'`
    );

    // 4. 创建旧索引
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`idx_dividend_no\` ON \`profit_sharing\` (\`dividendNo\`)`
    );

    // 5. 重命名 profit_sharing 表为 dividends
    await queryRunner.query(
      `ALTER TABLE \`profit_sharing\` RENAME TO \`dividends\``
    );

    // 6. 重命名 owner_points 表为 shareholder_points
    await queryRunner.query(
      `ALTER TABLE \`owner_points\` RENAME TO \`shareholder_points\``
    );
  }
}


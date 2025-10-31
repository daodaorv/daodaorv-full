import { MigrationInterface, QueryRunner } from "typeorm";

export class SplitDepositFields1731234567890 implements MigrationInterface {
    name = 'SplitDepositFields1731234567890'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 为orders表添加新字段
        await queryRunner.query(`
            ALTER TABLE orders
            ADD COLUMN vehicleDeposit decimal(10,2) NOT NULL DEFAULT 0 COMMENT '车辆押金',
            ADD COLUMN violationDeposit decimal(10,2) NOT NULL DEFAULT 0 COMMENT '违章押金',
            ADD COLUMN totalDeposit decimal(10,2) NOT NULL DEFAULT 0 COMMENT '总押金'
        `);

        // 为orders表添加押金状态字段
        await queryRunner.query(`
            ALTER TABLE orders
            ADD COLUMN vehicleDepositPaidAt datetime NULL COMMENT '车辆押金支付时间',
            ADD COLUMN violationDepositPaidAt datetime NULL COMMENT '违章押金支付时间',
            ADD COLUMN vehicleDepositRefundedAt datetime NULL COMMENT '车辆押金退还时间',
            ADD COLUMN violationDepositRefundedAt datetime NULL COMMENT '违章押金退还时间',
            ADD COLUMN violationDepositExpectedRefundAt datetime NULL COMMENT '违章押金预计退还时间',
            ADD COLUMN vehicleDepositStatus enum('unpaid', 'paid', 'refunding', 'refunded', 'deducted') NOT NULL DEFAULT 'unpaid' COMMENT '车辆押金状态',
            ADD COLUMN violationDepositStatus enum('unpaid', 'paid', 'refunding', 'refunded', 'deducted') NOT NULL DEFAULT 'unpaid' COMMENT '违章押金状态',
            ADD COLUMN vehicleDepositDeduction decimal(10,2) NULL COMMENT '车辆押金扣除金额',
            ADD COLUMN violationDepositDeduction decimal(10,2) NULL COMMENT '违章押金扣除金额',
            ADD COLUMN depositDeductionReason text NULL COMMENT '押金扣除原因'
        `);

        // 为vehicle_models表添加新字段
        await queryRunner.query(`
            ALTER TABLE vehicle_models
            ADD COLUMN vehicleDeposit decimal(10,2) NOT NULL DEFAULT 0 COMMENT '车辆押金',
            ADD COLUMN violationDeposit decimal(10,2) NOT NULL DEFAULT 0 COMMENT '违章押金',
            ADD COLUMN supportDepositFree boolean NOT NULL DEFAULT false COMMENT '是否支持免押金',
            ADD COLUMN depositFreeConfig json NULL COMMENT '免押金配置（芝麻信用、支付分等）'
        `);

        // 将现有deposit值迁移到新字段
        await queryRunner.query(`
            UPDATE orders SET
                vehicleDeposit = FLOOR(deposit / 2),
                violationDeposit = FLOOR(deposit / 2),
                totalDeposit = deposit
            WHERE deposit > 0
        `);

        await queryRunner.query(`
            UPDATE vehicle_models SET
                vehicleDeposit = FLOOR(deposit / 2),
                violationDeposit = FLOOR(deposit / 2)
            WHERE deposit > 0
        `);

        // 备份原deposit字段，稍后删除
        await queryRunner.query(`
            ALTER TABLE orders CHANGE COLUMN deposit deposit_backup decimal(10,2) NULL COMMENT '原押金字段备份'
        `);

        await queryRunner.query(`
            ALTER TABLE vehicle_models CHANGE COLUMN deposit deposit_backup decimal(10,2) NULL COMMENT '原押金字段备份'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 恢复原deposit字段
        await queryRunner.query(`
            ALTER TABLE orders CHANGE COLUMN deposit_backup deposit decimal(10,2) NOT NULL DEFAULT 0 COMMENT '押金'
        `);

        await queryRunner.query(`
            ALTER TABLE vehicle_models CHANGE COLUMN deposit_backup deposit decimal(10,2) NOT NULL DEFAULT 0 COMMENT '押金'
        `);

        // 删除新增的字段
        await queryRunner.query(`ALTER TABLE orders DROP COLUMN vehicleDeposit`);
        await queryRunner.query(`ALTER TABLE orders DROP COLUMN violationDeposit`);
        await queryRunner.query(`ALTER TABLE orders DROP COLUMN totalDeposit`);
        await queryRunner.query(`ALTER TABLE orders DROP COLUMN vehicleDepositPaidAt`);
        await queryRunner.query(`ALTER TABLE orders DROP COLUMN violationDepositPaidAt`);
        await queryRunner.query(`ALTER TABLE orders DROP COLUMN vehicleDepositRefundedAt`);
        await queryRunner.query(`ALTER TABLE orders DROP COLUMN violationDepositRefundedAt`);
        await queryRunner.query(`ALTER TABLE orders DROP COLUMN violationDepositExpectedRefundAt`);
        await queryRunner.query(`ALTER TABLE orders DROP COLUMN vehicleDepositStatus`);
        await queryRunner.query(`ALTER TABLE orders DROP COLUMN violationDepositStatus`);
        await queryRunner.query(`ALTER TABLE orders DROP COLUMN vehicleDepositDeduction`);
        await queryRunner.query(`ALTER TABLE orders DROP COLUMN violationDepositDeduction`);
        await queryRunner.query(`ALTER TABLE orders DROP COLUMN depositDeductionReason`);

        await queryRunner.query(`ALTER TABLE vehicle_models DROP COLUMN vehicleDeposit`);
        await queryRunner.query(`ALTER TABLE vehicle_models DROP COLUMN violationDeposit`);
        await queryRunner.query(`ALTER TABLE vehicle_models DROP COLUMN supportDepositFree`);
        await queryRunner.query(`ALTER TABLE vehicle_models DROP COLUMN depositFreeConfig`);
    }
}
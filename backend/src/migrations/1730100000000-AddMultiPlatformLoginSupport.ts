import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMultiPlatformLoginSupport1730100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 修改 phone 字段为可空
    await queryRunner.changeColumn(
      'users',
      'phone',
      new TableColumn({
        name: 'phone',
        type: 'varchar',
        length: '11',
        isNullable: true,
        isUnique: true,
      })
    );

    // 2. 修改 password 字段为可空
    await queryRunner.changeColumn(
      'users',
      'password',
      new TableColumn({
        name: 'password',
        type: 'varchar',
        length: '255',
        isNullable: true,
      })
    );

    // 3. 添加 platform 字段
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'platform',
        type: 'enum',
        enum: ['wechat', 'alipay', 'douyin', 'phone'],
        default: "'phone'",
        comment: '注册平台来源',
      })
    );

    // 4. 添加 wechatOpenid 字段
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'wechatOpenid',
        type: 'varchar',
        length: '100',
        isNullable: true,
        isUnique: true,
        comment: '微信 openid',
      })
    );

    // 5. 添加 alipayUserId 字段
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'alipayUserId',
        type: 'varchar',
        length: '100',
        isNullable: true,
        isUnique: true,
        comment: '支付宝 userId',
      })
    );

    // 6. 添加 douyinOpenid 字段
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'douyinOpenid',
        type: 'varchar',
        length: '100',
        isNullable: true,
        isUnique: true,
        comment: '抖音 openid',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚操作：删除新增的字段
    await queryRunner.dropColumn('users', 'douyinOpenid');
    await queryRunner.dropColumn('users', 'alipayUserId');
    await queryRunner.dropColumn('users', 'wechatOpenid');
    await queryRunner.dropColumn('users', 'platform');

    // 恢复 phone 和 password 字段为非空
    await queryRunner.changeColumn(
      'users',
      'phone',
      new TableColumn({
        name: 'phone',
        type: 'varchar',
        length: '11',
        isNullable: false,
        isUnique: true,
      })
    );

    await queryRunner.changeColumn(
      'users',
      'password',
      new TableColumn({
        name: 'password',
        type: 'varchar',
        length: '255',
        isNullable: false,
      })
    );
  }
}


import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 支付平台枚举
 */
export enum PaymentPlatform {
  WECHAT = 'wechat', // 微信支付
  ALIPAY = 'alipay', // 支付宝支付
  WALLET = 'wallet', // 钱包余额
}

/**
 * 支付配置实体
 * 用于存储微信支付、支付宝支付等第三方支付平台的配置参数
 */
@Entity('payment_configs')
export class PaymentConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * 支付平台
   */
  @Column({
    type: 'enum',
    enum: PaymentPlatform,
    unique: true,
    comment: '支付平台（wechat/alipay/wallet）',
  })
  platform!: PaymentPlatform;

  /**
   * 配置参数（JSON格式，加密存储敏感信息）
   * 微信支付：{ appId, mchId, apiKey, certPath }
   * 支付宝：{ appId, privateKey, publicKey }
   */
  @Column({
    type: 'json',
    comment: '配置参数（JSON格式）',
  })
  config!: Record<string, any>;

  /**
   * 是否启用
   */
  @Column({
    type: 'boolean',
    default: false,
    comment: '是否启用',
  })
  isEnabled!: boolean;

  /**
   * 备注
   */
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '备注',
  })
  remark?: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;
}


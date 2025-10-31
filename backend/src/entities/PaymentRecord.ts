import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './Order';
import { User } from './User';
import { PaymentPlatform } from './PaymentConfig';

/**
 * 支付状态枚举
 */
export enum PaymentStatus {
  PENDING = 'pending', // 待支付
  PAYING = 'paying', // 支付中
  PAID = 'paid', // 已支付
  CANCELLED = 'cancelled', // 已取消
  REFUNDED = 'refunded', // 已退款
  FAILED = 'failed', // 支付失败
}

/**
 * 支付记录实体
 * 记录订单的支付信息，包括支付平台、支付金额、支付状态等
 */
@Entity('payment_records')
export class PaymentRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * 支付单号（系统生成）
   */
  @Column({
    type: 'varchar',
    length: 64,
    unique: true,
    comment: '支付单号',
  })
  paymentNo!: string;

  /**
   * 订单ID
   */
  @Column({
    type: 'uuid',
    comment: '订单ID',
  })
  orderId!: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order?: Order;

  /**
   * 用户ID
   */
  @Column({
    type: 'uuid',
    comment: '用户ID',
  })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  /**
   * 支付金额
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: '支付金额',
  })
  amount!: number;

  /**
   * 支付平台
   */
  @Column({
    type: 'enum',
    enum: PaymentPlatform,
    comment: '支付平台（wechat/alipay/wallet）',
  })
  platform!: PaymentPlatform;

  /**
   * 支付状态
   */
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    comment: '支付状态',
  })
  status!: PaymentStatus;

  /**
   * 第三方订单号（微信/支付宝返回的订单号）
   */
  @Column({
    type: 'varchar',
    length: 128,
    nullable: true,
    comment: '第三方订单号',
  })
  thirdPartyOrderNo?: string;

  /**
   * 第三方交易号（微信/支付宝返回的交易号）
   */
  @Column({
    type: 'varchar',
    length: 128,
    nullable: true,
    comment: '第三方交易号',
  })
  thirdPartyTransactionNo?: string;

  /**
   * 支付参数（JSON格式，用于前端调起支付）
   */
  @Column({
    type: 'json',
    nullable: true,
    comment: '支付参数',
  })
  paymentParams?: Record<string, any>;

  /**
   * 支付完成时间
   */
  @Column({
    type: 'datetime',
    nullable: true,
    comment: '支付完成时间',
  })
  paidAt?: Date;

  /**
   * 过期时间（15分钟后过期）
   */
  @Column({
    type: 'datetime',
    nullable: true,
    comment: '过期时间',
  })
  expiredAt?: Date;

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


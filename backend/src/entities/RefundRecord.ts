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
import { PaymentRecord } from './PaymentRecord';

/**
 * 退款状态枚举
 */
export enum RefundStatus {
  PENDING = 'pending', // 待退款
  PROCESSING = 'processing', // 退款中
  REFUNDED = 'refunded', // 已退款
  FAILED = 'failed', // 退款失败
}

/**
 * 退款记录实体
 */
@Entity('refund_records')
export class RefundRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  refundNo!: string; // 退款单号

  @Column()
  orderId!: string;

  @Column()
  paymentRecordId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number; // 退款金额

  @Column({ type: 'text', nullable: true })
  reason!: string; // 退款原因

  @Column({ type: 'enum', enum: RefundStatus, default: RefundStatus.PENDING })
  status!: RefundStatus;

  @Column({ nullable: true })
  thirdPartyRefundNo!: string; // 第三方退款单号（微信/支付宝）

  @Column({ type: 'json', nullable: true })
  refundParams!: Record<string, any>; // 退款参数（第三方退款）

  @Column({ type: 'timestamp', nullable: true })
  refundedAt!: Date; // 退款完成时间

  @Column({ type: 'text', nullable: true })
  failureReason!: string; // 退款失败原因

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // 关联订单
  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  // 关联支付记录
  @ManyToOne(() => PaymentRecord)
  @JoinColumn({ name: 'paymentRecordId' })
  paymentRecord!: PaymentRecord;
}

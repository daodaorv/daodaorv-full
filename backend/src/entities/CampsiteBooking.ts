import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Campsite } from './Campsite';
import { CampsiteSpot } from './CampsiteSpot';
import { User } from './User';

/**
 * 预订状态枚举
 */
export enum BookingStatus {
  PENDING = 'pending', // 待支付
  PAID = 'paid', // 已支付（待入住）
  CHECKED_IN = 'checked_in', // 已入住
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
  REFUNDED = 'refunded', // 已退款
}

/**
 * 营地预订实体
 */
@Entity('campsite_bookings')
export class CampsiteBooking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 32, unique: true, comment: '预订编号' })
  @Index('idx_booking_no')
  bookingNo!: string;

  @Column('varchar', { length: 36, comment: '用户ID' })
  @Index('idx_user_id')
  userId!: string;

  @Column('varchar', { length: 36, comment: '营地ID' })
  @Index('idx_campsite_id')
  campsiteId!: string;

  @Column('varchar', { length: 36, comment: '营位ID' })
  @Index('idx_spot_id')
  spotId!: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
    comment: '预订状态',
  })
  @Index('idx_status')
  status!: BookingStatus;

  @Column('date', { comment: '入住日期' })
  @Index('idx_check_in_date')
  checkInDate!: Date;

  @Column('date', { comment: '退房日期' })
  @Index('idx_check_out_date')
  checkOutDate!: Date;

  @Column('int', { comment: '入住天数' })
  nights!: number;

  @Column('int', { default: 1, comment: '营位数量' })
  spotQuantity!: number;

  @Column('decimal', { precision: 10, scale: 2, comment: '营位单价（元/晚）' })
  spotPrice!: number;

  @Column('decimal', { precision: 10, scale: 2, comment: '营位费用小计' })
  spotAmount!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0, comment: '优惠券抵扣金额' })
  couponAmount!: number;

  @Column('decimal', { precision: 10, scale: 2, comment: '实付金额' })
  totalAmount!: number;

  @Column('varchar', { length: 36, nullable: true, comment: '优惠券ID' })
  couponId?: string;

  @Column('varchar', { length: 50, nullable: true, comment: '支付方式' })
  paymentMethod?: string;

  @Column('varchar', { length: 100, nullable: true, comment: '支付流水号' })
  paymentTransactionId?: string;

  @Column('datetime', { nullable: true, comment: '支付时间' })
  paidAt?: Date;

  @Column('varchar', { length: 50, comment: '联系人姓名' })
  contactName!: string;

  @Column('varchar', { length: 20, comment: '联系人电话' })
  contactPhone!: string;

  @Column('varchar', { length: 200, nullable: true, comment: '备注' })
  remark?: string;

  @Column('datetime', { nullable: true, comment: '入住时间' })
  checkedInAt?: Date;

  @Column('datetime', { nullable: true, comment: '退房时间' })
  checkedOutAt?: Date;

  @Column('datetime', { nullable: true, comment: '取消时间' })
  cancelledAt?: Date;

  @Column('varchar', { length: 200, nullable: true, comment: '取消原因' })
  cancelReason?: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0, comment: '退款金额' })
  refundAmount!: number;

  @Column('datetime', { nullable: true, comment: '退款时间' })
  refundedAt?: Date;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;

  // 关联关系
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Campsite, campsite => campsite.bookings)
  @JoinColumn({ name: 'campsiteId' })
  campsite!: Campsite;

  @ManyToOne(() => CampsiteSpot)
  @JoinColumn({ name: 'spotId' })
  spot!: CampsiteSpot;
}


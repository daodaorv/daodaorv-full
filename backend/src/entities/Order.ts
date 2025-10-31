import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Vehicle } from './Vehicle';

/**
 * 订单状态枚举
 */
export enum OrderStatus {
  PENDING = 'pending', // 待支付
  PAID = 'paid', // 已支付
  PICKUP = 'pickup', // 待取车
  USING = 'using', // 使用中
  RETURN = 'return', // 待还车
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
  REFUNDED = 'refunded', // 已退款
}

/**
 * 支付状态枚举
 */
export enum PaymentStatus {
  UNPAID = 'unpaid', // 未支付
  PAID = 'paid', // 已支付
  REFUNDING = 'refunding', // 退款中
  REFUNDED = 'refunded', // 已退款
}

/**
 * 订单类型枚举
 */
export enum OrderType {
  RV_RENTAL = 'rv_rental', // 房车租赁
  SPECIAL_OFFER = 'special_offer', // 特惠租车
  CAMPSITE = 'campsite', // 营地预订
  CUSTOM_TOUR = 'custom_tour', // 定制旅游
}

/**
 * 订单实体
 */
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 32, unique: true, comment: '订单号' })
  orderNo!: string;

  @Column({ type: 'varchar', length: 36, comment: '用户ID' })
  userId!: string;

  @Column({ type: 'varchar', length: 36, comment: '车辆ID' })
  vehicleId!: string;

  @Column({
    type: 'enum',
    enum: OrderType,
    default: OrderType.RV_RENTAL,
    comment: '订单类型',
  })
  orderType!: OrderType;

  @Column({ type: 'date', comment: '开始日期' })
  startDate!: Date;

  @Column({ type: 'date', comment: '结束日期' })
  endDate!: Date;

  @Column({ type: 'int', comment: '租赁天数' })
  rentalDays!: number;

  @Column({ type: 'varchar', length: 36, nullable: true, comment: '取车门店ID' })
  pickupStoreId?: string;

  @Column({ type: 'varchar', length: 36, nullable: true, comment: '还车门店ID' })
  returnStoreId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '租赁价格' })
  rentalPrice!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: '保险价格',
  })
  insurancePrice!: number;

  @Column({ type: 'json', nullable: true, comment: '附加服务' })
  additionalServices?: any;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '总价格' })
  totalPrice!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: '车辆押金',
  })
  vehicleDeposit!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: '违章押金',
  })
  violationDeposit!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: '总押金',
  })
  totalDeposit!: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
    comment: '订单状态',
  })
  status!: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
    comment: '支付状态',
  })
  paymentStatus!: PaymentStatus;

  @Column({ type: 'datetime', nullable: true, comment: '取车时间' })
  pickupTime?: Date;

  @Column({ type: 'datetime', nullable: true, comment: '还车时间' })
  returnTime?: Date;

  @Column({ type: 'text', nullable: true, comment: '订单备注' })
  remarks?: string;

  @Column({ type: 'text', nullable: true, comment: '取消原因' })
  cancellationReason?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: '退款金额',
  })
  refundAmount?: number;

  @Column({ type: 'datetime', nullable: true, comment: '支付时间' })
  paidAt?: Date;

  @Column({ type: 'datetime', nullable: true, comment: '取消时间' })
  cancelledAt?: Date;

  @Column({ type: 'datetime', nullable: true, comment: '完成时间' })
  completedAt?: Date;

  // 押金相关字段
  @Column({ type: 'datetime', nullable: true, comment: '车辆押金支付时间' })
  vehicleDepositPaidAt?: Date;

  @Column({ type: 'datetime', nullable: true, comment: '违章押金支付时间' })
  violationDepositPaidAt?: Date;

  @Column({ type: 'datetime', nullable: true, comment: '车辆押金退还时间' })
  vehicleDepositRefundedAt?: Date;

  @Column({ type: 'datetime', nullable: true, comment: '违章押金退还时间' })
  violationDepositRefundedAt?: Date;

  @Column({ type: 'datetime', nullable: true, comment: '违章押金预计退还时间' })
  violationDepositExpectedRefundAt?: Date;

  @Column({
    type: 'enum',
    enum: ['unpaid', 'paid', 'refunding', 'refunded', 'deducted'],
    default: 'unpaid',
    comment: '车辆押金状态'
  })
  vehicleDepositStatus!: string;

  @Column({
    type: 'enum',
    enum: ['unpaid', 'paid', 'refunding', 'refunded', 'deducted'],
    default: 'unpaid',
    comment: '违章押金状态'
  })
  violationDepositStatus!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: '车辆押金扣除金额'
  })
  vehicleDepositDeduction?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: '违章押金扣除金额'
  })
  violationDepositDeduction?: number;

  @Column({ type: 'text', nullable: true, comment: '押金扣除原因' })
  depositDeductionReason?: string;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updated_at!: Date;

  // 关联用户
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  // 关联车辆
  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicleId' })
  vehicle?: Vehicle;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SpecialOffer } from './SpecialOffer';
import { User } from './User';
import { Vehicle } from './Vehicle';

/**
 * 特惠订单状态枚举
 */
export enum SpecialOfferBookingStatus {
  PENDING = 'pending',       // 待支付
  PAID = 'paid',             // 已支付
  CONFIRMED = 'confirmed',   // 已确认
  COMPLETED = 'completed',   // 已完成
  CANCELLED = 'cancelled',   // 已取消
}

/**
 * 特惠订单实体
 * 用户预订特惠套餐的订单记录
 */
@Entity('special_offer_bookings')
export class SpecialOfferBooking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 32, unique: true, comment: '订单号' })
  @Index('idx_special_offer_booking_no')
  bookingNo!: string;

  @Column('uuid', { comment: '特惠套餐ID' })
  @Index('idx_special_offer_booking_offer_id')
  offerId!: string;

  @Column('uuid', { comment: '用户ID' })
  @Index('idx_special_offer_booking_user_id')
  userId!: string;

  @Column('uuid', { nullable: true, comment: '分配的车辆ID' })
  @Index('idx_special_offer_booking_vehicle_id')
  vehicleId?: string;

  @Column('datetime', { comment: '取车时间' })
  @Index('idx_special_offer_booking_pickup_date')
  pickupDate!: Date;

  @Column('datetime', { comment: '还车时间' })
  @Index('idx_special_offer_booking_return_date')
  returnDate!: Date;

  @Column('decimal', { precision: 10, scale: 2, comment: '套餐价格（锁定）' })
  offerPrice!: number;

  @Column('json', { nullable: true, comment: '附加服务' })
  additionalServices?: {
    serviceId: string;
    serviceName: string;
    price: number;
    quantity: number;
  }[];

  @Column('decimal', { precision: 10, scale: 2, comment: '订单总金额' })
  totalAmount!: number;

  @Column({
    type: 'enum',
    enum: SpecialOfferBookingStatus,
    default: SpecialOfferBookingStatus.PENDING,
    comment: '状态',
  })
  @Index('idx_special_offer_booking_status')
  status!: SpecialOfferBookingStatus;

  @Column('uuid', { nullable: true, comment: '支付ID' })
  paymentId?: string;

  @Column('varchar', { length: 500, nullable: true, comment: '取消原因' })
  cancelReason?: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;

  // 关联关系
  @ManyToOne(() => SpecialOffer, (offer) => offer.bookings)
  @JoinColumn({ name: 'offerId' })
  offer!: SpecialOffer;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle?: Vehicle;
}


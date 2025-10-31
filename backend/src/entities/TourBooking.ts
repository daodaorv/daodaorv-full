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
import { User } from './User';
import { TourRoute } from './TourRoute';
import { TourBatch } from './TourBatch';

/**
 * 预订状态枚举
 */
export enum TourBookingStatus {
  PENDING = 'pending', // 待支付
  PAID = 'paid', // 已支付
  CONFIRMED = 'confirmed', // 已确认成团
  IN_PROGRESS = 'in_progress', // 进行中
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
  REFUNDED = 'refunded', // 已退款
}

/**
 * 旅游预订实体
 */
@Entity('tour_bookings')
export class TourBooking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 50, unique: true, comment: '预订单号' })
  @Index('idx_tour_booking_no')
  bookingNo!: string;

  @Column('uuid', { comment: '用户ID' })
  @Index('idx_tour_booking_user')
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column('uuid', { comment: '路线ID' })
  @Index('idx_tour_booking_route')
  routeId!: string;

  @ManyToOne(() => TourRoute, (route) => route.bookings)
  @JoinColumn({ name: 'routeId' })
  route!: TourRoute;

  @Column('uuid', { comment: '批次ID' })
  @Index('idx_tour_booking_batch')
  batchId!: string;

  @ManyToOne(() => TourBatch, (batch) => batch.bookings)
  @JoinColumn({ name: 'batchId' })
  batch!: TourBatch;

  @Column('int', { comment: '成人数量' })
  adultCount!: number;

  @Column('int', { default: 0, comment: '儿童数量' })
  childCount!: number;

  @Column('boolean', { default: false, comment: '是否需要管家服务' })
  needButler!: boolean;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: '总金额',
  })
  totalAmount!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: '退款金额',
  })
  refundAmount!: number;

  @Column('varchar', { length: 50, comment: '联系人姓名' })
  contactName!: string;

  @Column('varchar', { length: 20, comment: '联系人电话' })
  contactPhone!: string;

  @Column('text', { nullable: true, comment: '特殊需求' })
  specialRequests?: string;

  @Column({
    type: 'enum',
    enum: TourBookingStatus,
    default: TourBookingStatus.PENDING,
    comment: '预订状态',
  })
  @Index('idx_tour_booking_status')
  status!: TourBookingStatus;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;
}


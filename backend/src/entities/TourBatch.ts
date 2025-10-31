import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { TourRoute } from './TourRoute';
import { TourBooking } from './TourBooking';

/**
 * 批次状态枚举
 */
export enum BatchStatus {
  PENDING = 'pending', // 待成团
  CONFIRMED = 'confirmed', // 已成团
  CANCELLED = 'cancelled', // 已取消
  COMPLETED = 'completed', // 已完成
}

/**
 * 出发批次实体
 */
@Entity('tour_batches')
export class TourBatch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { comment: '路线ID' })
  @Index('idx_tour_batch_route')
  routeId!: string;

  @ManyToOne(() => TourRoute, (route) => route.batches)
  @JoinColumn({ name: 'routeId' })
  route!: TourRoute;

  @Column('date', { comment: '出发日期' })
  @Index('idx_tour_batch_departure')
  departureDate!: Date;

  @Column('date', { comment: '返回日期' })
  returnDate!: Date;

  @Column('int', { comment: '库存人数' })
  stock!: number;

  @Column('int', { default: 0, comment: '已预订人数' })
  bookedCount!: number;

  @Column({
    type: 'enum',
    enum: BatchStatus,
    default: BatchStatus.PENDING,
    comment: '批次状态',
  })
  @Index('idx_tour_batch_status')
  status!: BatchStatus;

  @Column('text', { nullable: true, comment: '备注' })
  notes?: string;

  @OneToMany(() => TourBooking, (booking) => booking.batch)
  bookings!: TourBooking[];

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;
}


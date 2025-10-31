import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { TourBatch } from './TourBatch';
import { TourBooking } from './TourBooking';

/**
 * 旅游目的地枚举
 */
export enum TourDestination {
  NORTHWEST = 'northwest', // 西北（新疆、甘肃、青海）
  SOUTHWEST = 'southwest', // 西南（西藏、四川、云南）
  NORTH = 'north', // 华北（山西、内蒙古）
  EAST = 'east', // 华东（江浙沪）
  SOUTH = 'south', // 华南（广东、广西、海南）
  NORTHEAST = 'northeast', // 东北（黑吉辽）
}

/**
 * 服务模式枚举
 */
export enum ServiceMode {
  SELF_DRIVE = 'self_drive', // 自驾模式
  WITH_BUTLER = 'with_butler', // 管家随行
}

/**
 * 旅游路线状态枚举
 */
export enum TourStatus {
  ENABLED = 'enabled', // 启用
  DISABLED = 'disabled', // 禁用
}

/**
 * 预订模式枚举
 */
export enum BookingMode {
  INQUIRY = 'inquiry', // 咨询模式
  REALTIME = 'realtime', // 实时预订
}

/**
 * 旅游路线实体
 */
@Entity('tour_routes')
export class TourRoute {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 100, comment: '路线名称' })
  @Index('idx_tour_route_name')
  name!: string;

  @Column('varchar', { length: 200, comment: '路线简介' })
  summary!: string;

  @Column({
    type: 'enum',
    enum: TourDestination,
    comment: '目的地',
  })
  @Index('idx_tour_route_destination')
  destination!: TourDestination;

  @Column('int', { comment: '行程天数' })
  days!: number;

  @Column('int', { comment: '行程夜数' })
  nights!: number;

  @Column('text', { comment: '详细行程（JSON）' })
  itinerary!: string; // JSON: [{day: 1, title: '', content: '', meals: '', accommodation: ''}]

  @Column('text', { comment: '服务包含（JSON）' })
  included!: string; // JSON: ['车辆租赁', '住宿', '早餐']

  @Column('text', { comment: '服务不含（JSON）' })
  excluded!: string; // JSON: ['午餐', '晚餐', '门票']

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: '成人价格',
  })
  adultPrice!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: '儿童价格',
  })
  childPrice!: number;

  @Column({
    type: 'enum',
    enum: ServiceMode,
    default: ServiceMode.SELF_DRIVE,
    comment: '服务模式',
  })
  serviceMode!: ServiceMode;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: '管家服务费/天',
  })
  butlerFeePerDay?: number;

  @Column('int', { default: 10, comment: '最小成团人数' })
  minParticipants!: number;

  @Column('int', { default: 30, comment: '最大成团人数' })
  maxParticipants!: number;

  @Column('text', { nullable: true, comment: '封面图片' })
  coverImage?: string;

  @Column('text', { nullable: true, comment: '详情图片（JSON）' })
  images?: string; // JSON: ['url1', 'url2']

  @Column({
    type: 'enum',
    enum: TourStatus,
    default: TourStatus.DISABLED,
    comment: '状态',
  })
  @Index('idx_tour_route_status')
  status!: TourStatus;

  @Column({
    type: 'enum',
    enum: BookingMode,
    default: BookingMode.INQUIRY,
    comment: '预订模式',
  })
  @Index('idx_tour_route_booking_mode')
  bookingMode!: BookingMode;

  @Column('varchar', {
    length: 20,
    nullable: true,
    comment: '客服电话（咨询模式必填）',
  })
  customerServicePhone?: string;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
    comment: '平均评分',
  })
  averageRating!: number;

  @Column('int', { default: 0, comment: '评价数量' })
  reviewCount!: number;

  @Column('int', { default: 0, comment: '销售数量' })
  salesCount!: number;

  @OneToMany(() => TourBatch, batch => batch.route)
  batches!: TourBatch[];

  @OneToMany(() => TourBooking, booking => booking.route)
  bookings!: TourBooking[];

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;
}

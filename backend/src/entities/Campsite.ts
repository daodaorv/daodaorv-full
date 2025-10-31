import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { CampsiteFacility } from './CampsiteFacility';
import { CampsiteSpot } from './CampsiteSpot';
import { CampsiteBooking } from './CampsiteBooking';
import { CampsiteInquiry } from './CampsiteInquiry';
import { CampsiteReview } from './CampsiteReview';

/**
 * 预订模式枚举
 */
export enum BookingMode {
  REALTIME = 'realtime', // 实时预订模式
  CONSULTATION = 'consultation', // 咨询模式
}

/**
 * 营地状态枚举
 */
export enum CampsiteStatus {
  ENABLED = 'enabled', // 启用
  DISABLED = 'disabled', // 禁用
}

/**
 * 营地实体
 */
@Entity('campsites')
export class Campsite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 100, comment: '营地名称' })
  @Index('idx_name')
  name!: string;

  @Column('varchar', { length: 50, comment: '所在城市' })
  @Index('idx_city')
  city!: string;

  @Column('varchar', { length: 200, comment: '详细地址' })
  address!: string;

  @Column('decimal', { precision: 10, scale: 6, nullable: true, comment: '纬度' })
  latitude?: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true, comment: '经度' })
  longitude?: number;

  @Column('varchar', { length: 20, nullable: true, comment: '联系电话' })
  contactPhone?: string;

  @Column('varchar', { length: 50, nullable: true, comment: '联系人' })
  contactPerson?: string;

  @Column('varchar', { length: 100, nullable: true, comment: '营业时间' })
  businessHours?: string;

  @Column({
    type: 'enum',
    enum: BookingMode,
    default: BookingMode.CONSULTATION,
    comment: '预订模式',
  })
  @Index('idx_booking_mode')
  bookingMode!: BookingMode;

  @Column({
    type: 'enum',
    enum: CampsiteStatus,
    default: CampsiteStatus.DISABLED,
    comment: '营地状态',
  })
  @Index('idx_status')
  status!: CampsiteStatus;

  @Column('varchar', { length: 20, nullable: true, comment: '客服电话（咨询模式必填）' })
  servicePhone?: string;

  @Column('varchar', { length: 50, nullable: true, comment: '客服微信' })
  serviceWechat?: string;

  @Column('varchar', { length: 200, nullable: true, comment: '咨询提示文案' })
  consultationTip?: string;

  @Column('text', { nullable: true, comment: '营地详情（富文本）' })
  description?: string;

  @Column('json', { nullable: true, comment: '营地图片列表' })
  images?: string[];

  @Column('json', { nullable: true, comment: '营地视频列表' })
  videos?: string[];

  @Column('decimal', { precision: 3, scale: 1, default: 0, comment: '平均评分' })
  averageRating!: number;

  @Column('int', { default: 0, comment: '评价数量' })
  reviewCount!: number;

  @Column('int', { default: 0, comment: '预订次数' })
  bookingCount!: number;

  @Column('int', { default: 0, comment: '总营位数量' })
  totalSpots!: number;

  @Column('int', { default: 0, comment: '排序权重（越大越靠前）' })
  sortOrder!: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;

  // 关联关系
  @OneToMany(() => CampsiteFacility, facility => facility.campsite)
  facilities!: CampsiteFacility[];

  @OneToMany(() => CampsiteSpot, spot => spot.campsite)
  spots!: CampsiteSpot[];

  @OneToMany(() => CampsiteBooking, booking => booking.campsite)
  bookings!: CampsiteBooking[];

  @OneToMany(() => CampsiteInquiry, inquiry => inquiry.campsite)
  inquiries!: CampsiteInquiry[];

  @OneToMany(() => CampsiteReview, review => review.campsite)
  reviews!: CampsiteReview[];
}

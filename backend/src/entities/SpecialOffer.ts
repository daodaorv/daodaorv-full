import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { SpecialOfferBooking } from './SpecialOfferBooking';

/**
 * 特惠套餐状态枚举
 */
export enum SpecialOfferStatus {
  DRAFT = 'draft',       // 草稿
  ACTIVE = 'active',     // 启用
  INACTIVE = 'inactive', // 禁用
  EXPIRED = 'expired',   // 已过期
}

/**
 * 特惠套餐实体
 * 提供固定路线、固定租期的套餐化租车方案
 */
@Entity('special_offers')
export class SpecialOffer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 100, comment: '套餐名称' })
  @Index('idx_special_offer_name')
  name!: string;

  @Column('varchar', { length: 50, comment: '取车城市' })
  @Index('idx_special_offer_pickup_city')
  pickupCity!: string;

  @Column('varchar', { length: 50, comment: '还车城市' })
  @Index('idx_special_offer_return_city')
  returnCity!: string;

  @Column('int', { comment: '固定租期（天数）' })
  fixedDays!: number;

  @Column('decimal', { precision: 10, scale: 2, comment: '原价' })
  originalPrice!: number;

  @Column('decimal', { precision: 10, scale: 2, comment: '特惠价' })
  offerPrice!: number;

  @Column('json', { comment: '可选车型ID列表' })
  vehicleModelIds!: string[];

  @Column('date', { comment: '活动开始日期' })
  @Index('idx_special_offer_start_date')
  startDate!: Date;

  @Column('date', { comment: '活动结束日期' })
  @Index('idx_special_offer_end_date')
  endDate!: Date;

  @Column('int', { comment: '总库存' })
  totalStock!: number;

  @Column('int', { comment: '剩余库存' })
  remainingStock!: number;

  @Column('text', { nullable: true, comment: '套餐描述' })
  description?: string;

  @Column('json', { nullable: true, comment: '亮点列表' })
  highlights?: string[];

  @Column('json', { nullable: true, comment: '包含服务' })
  includedServices?: string[];

  @Column('json', { nullable: true, comment: '不含服务' })
  excludedServices?: string[];

  @Column('varchar', { length: 500, nullable: true, comment: '封面图' })
  coverImage?: string;

  @Column('json', { nullable: true, comment: '图片列表' })
  images?: string[];

  @Column({
    type: 'enum',
    enum: SpecialOfferStatus,
    default: SpecialOfferStatus.DRAFT,
    comment: '状态',
  })
  @Index('idx_special_offer_status')
  status!: SpecialOfferStatus;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;

  // 关联关系
  @OneToMany(() => SpecialOfferBooking, (booking) => booking.offer)
  bookings!: SpecialOfferBooking[];
}


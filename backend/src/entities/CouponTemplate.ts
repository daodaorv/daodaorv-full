import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { UserCoupon } from './UserCoupon';
import { CouponDistribution } from './CouponDistribution';

/**
 * 优惠券类型
 */
export enum CouponType {
  CASH = 'cash', // 现金券
  DISCOUNT = 'discount', // 折扣券
  FULL_REDUCTION = 'full_reduction', // 满减券
  DAY_DEDUCTION = 'day_deduction', // 日租抵扣券
}

/**
 * 适用场景
 */
export enum CouponScene {
  RENTAL = 'rental', // 房车租赁
  CAMPSITE = 'campsite', // 营地预订
  TOUR = 'tour', // 定制旅游
  SPECIAL_OFFER = 'special_offer', // 特惠租车
  ALL = 'all', // 全场通用
}

/**
 * 优惠券模板实体
 */
@Entity('coupon_templates')
export class CouponTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 100, comment: '优惠券名称' })
  name!: string;

  @Column({
    type: 'enum',
    enum: CouponType,
    comment: '券类型',
  })
  @Index('idx_coupon_type')
  type!: CouponType;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    comment: '面额（现金券/满减券）',
  })
  amount?: number;

  @Column('decimal', {
    precision: 5,
    scale: 2,
    nullable: true,
    comment: '折扣率（折扣券，如 0.9 表示 9 折）',
  })
  discountRate?: number;

  @Column('int', { nullable: true, comment: '抵扣天数（日租抵扣券）' })
  dayCount?: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    comment: '最低消费金额',
  })
  minAmount?: number;

  @Column({
    type: 'enum',
    enum: CouponScene,
    comment: '适用场景',
  })
  @Index('idx_coupon_scene')
  scene!: CouponScene;

  @Column('int', { comment: '有效天数（从发放日起算）' })
  validDays!: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
    comment: '售价（0 表示免费）',
  })
  price!: number;

  @Column('int', { nullable: true, comment: '库存数量（null 表示不限量）' })
  stock?: number;

  @Column('int', {
    nullable: true,
    comment: '每人限购数量（null 表示不限）',
  })
  limitPerUser?: number;

  @Column('boolean', { default: false, comment: '是否可叠加使用' })
  canStack!: boolean;

  @Column('boolean', { default: true, comment: '是否可转赠' })
  canTransfer!: boolean;

  @Column('text', { nullable: true, comment: '使用说明' })
  description?: string;

  @Column('boolean', { default: true, comment: '是否启用' })
  @Index('idx_is_active')
  isActive!: boolean;

  @Column('datetime', { nullable: true, comment: '开始时间' })
  startTime?: Date;

  @Column('datetime', { nullable: true, comment: '结束时间' })
  endTime?: Date;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;

  // 关联关系
  @OneToMany(() => UserCoupon, (userCoupon) => userCoupon.template)
  userCoupons?: UserCoupon[];

  @OneToMany(
    () => CouponDistribution,
    (distribution) => distribution.template
  )
  distributions?: CouponDistribution[];
}


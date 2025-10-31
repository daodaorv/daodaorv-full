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
import { CouponTemplate } from './CouponTemplate';
import { User } from './User';

/**
 * 优惠券来源
 */
export enum CouponSource {
  PURCHASE = 'purchase', // 购买
  GIFT = 'gift', // 赠送
  ACTIVITY = 'activity', // 活动
  SYSTEM = 'system', // 系统发放
}

/**
 * 优惠券状态
 */
export enum CouponStatus {
  UNUSED = 'unused', // 未使用
  USED = 'used', // 已使用
  EXPIRED = 'expired', // 已过期
  TRANSFERRED = 'transferred', // 已转赠
}

/**
 * 用户优惠券实体
 */
@Entity('user_coupons')
export class UserCoupon {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 32, unique: true, comment: '优惠券编号' })
  @Index('idx_coupon_no')
  couponNo!: string;

  @Column('uuid', { comment: '优惠券模板 ID' })
  @Index('idx_template_id')
  templateId!: string;

  @Column('uuid', { comment: '持有用户 ID' })
  @Index('idx_user_id')
  userId!: string;

  @Column({
    type: 'enum',
    enum: CouponSource,
    comment: '来源',
  })
  @Index('idx_source')
  source!: CouponSource;

  @Column({
    type: 'enum',
    enum: CouponStatus,
    default: CouponStatus.UNUSED,
    comment: '状态',
  })
  @Index('idx_status')
  status!: CouponStatus;

  @Column('datetime', { comment: '领取时间' })
  receivedAt!: Date;

  @Column('datetime', { comment: '过期时间' })
  @Index('idx_expire_at')
  expireAt!: Date;

  @Column('datetime', { nullable: true, comment: '使用时间' })
  usedAt?: Date;

  @Column('uuid', { nullable: true, comment: '使用订单 ID' })
  orderId?: string;

  @Column('varchar', { length: 50, nullable: true, comment: '订单类型' })
  orderType?: string;

  @Column('uuid', { nullable: true, comment: '转赠给谁' })
  transferredTo?: string;

  @Column('datetime', { nullable: true, comment: '转赠时间' })
  transferredAt?: Date;

  @Column('uuid', { nullable: true, comment: '原始持有人（转赠链路）' })
  originalOwner?: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;

  // 关联关系
  @ManyToOne(() => CouponTemplate, (template) => template.userCoupons)
  @JoinColumn({ name: 'templateId' })
  template?: CouponTemplate;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;
}


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
import { CampsiteBooking } from './CampsiteBooking';
import { User } from './User';

/**
 * 营地评价实体
 */
@Entity('campsite_reviews')
export class CampsiteReview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 36, comment: '用户ID' })
  @Index('idx_user_id')
  userId!: string;

  @Column('varchar', { length: 36, comment: '营地ID' })
  @Index('idx_campsite_id')
  campsiteId!: string;

  @Column('varchar', { length: 36, comment: '预订ID' })
  @Index('idx_booking_id')
  bookingId!: string;

  @Column('decimal', { precision: 2, scale: 1, comment: '总体评分（1-5）' })
  overallRating!: number;

  @Column('decimal', { precision: 2, scale: 1, comment: '设施评分（1-5）' })
  facilityRating!: number;

  @Column('decimal', { precision: 2, scale: 1, comment: '服务评分（1-5）' })
  serviceRating!: number;

  @Column('decimal', { precision: 2, scale: 1, comment: '卫生评分（1-5）' })
  hygieneRating!: number;

  @Column('decimal', { precision: 2, scale: 1, comment: '位置评分（1-5）' })
  locationRating!: number;

  @Column('text', { nullable: true, comment: '评价内容' })
  content?: string;

  @Column('json', { nullable: true, comment: '评价图片列表' })
  images?: string[];

  @Column('text', { nullable: true, comment: '管理员回复' })
  adminReply?: string;

  @Column('datetime', { nullable: true, comment: '回复时间' })
  repliedAt?: Date;

  @Column('boolean', { default: true, comment: '是否显示' })
  isVisible!: boolean;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;

  // 关联关系
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Campsite, campsite => campsite.reviews)
  @JoinColumn({ name: 'campsiteId' })
  campsite!: Campsite;

  @ManyToOne(() => CampsiteBooking)
  @JoinColumn({ name: 'bookingId' })
  booking!: CampsiteBooking;
}


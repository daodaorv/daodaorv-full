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
import { User } from './User';

/**
 * 咨询状态枚举
 */
export enum InquiryStatus {
  PENDING = 'pending', // 待处理
  PROCESSING = 'processing', // 处理中
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
}

/**
 * 营地咨询实体
 */
@Entity('campsite_inquiries')
export class CampsiteInquiry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 32, unique: true, comment: '咨询编号' })
  @Index('idx_inquiry_no')
  inquiryNo!: string;

  @Column('varchar', { length: 36, comment: '用户ID' })
  @Index('idx_user_id')
  userId!: string;

  @Column('varchar', { length: 36, comment: '营地ID' })
  @Index('idx_campsite_id')
  campsiteId!: string;

  @Column({
    type: 'enum',
    enum: InquiryStatus,
    default: InquiryStatus.PENDING,
    comment: '咨询状态',
  })
  @Index('idx_status')
  status!: InquiryStatus;

  @Column('varchar', { length: 50, comment: '联系人姓名' })
  contactName!: string;

  @Column('varchar', { length: 20, comment: '联系人电话' })
  contactPhone!: string;

  @Column('date', { nullable: true, comment: '计划入住日期' })
  plannedCheckInDate?: Date;

  @Column('date', { nullable: true, comment: '计划退房日期' })
  plannedCheckOutDate?: Date;

  @Column('int', { nullable: true, comment: '计划入住天数' })
  plannedNights?: number;

  @Column('int', { default: 1, comment: '营位数量' })
  spotQuantity!: number;

  @Column('text', { comment: '咨询内容' })
  content!: string;

  @Column('text', { nullable: true, comment: '处理备注' })
  processingNote?: string;

  @Column('varchar', { length: 36, nullable: true, comment: '处理人ID' })
  processedBy?: string;

  @Column('datetime', { nullable: true, comment: '处理时间' })
  processedAt?: Date;

  @Column('varchar', { length: 36, nullable: true, comment: '转化的预订ID' })
  convertedBookingId?: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;

  // 关联关系
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Campsite, campsite => campsite.inquiries)
  @JoinColumn({ name: 'campsiteId' })
  campsite!: Campsite;
}


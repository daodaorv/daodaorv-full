import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CouponTemplate } from './CouponTemplate';

/**
 * 发放类型
 */
export enum DistributionType {
  MANUAL = 'manual', // 手动发放
  BATCH = 'batch', // 批量发放
  ACTIVITY = 'activity', // 活动发放
}

/**
 * 优惠券发放记录实体
 */
@Entity('coupon_distributions')
export class CouponDistribution {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { comment: '优惠券模板 ID' })
  @Index('idx_template_id')
  templateId!: string;

  @Column({
    type: 'enum',
    enum: DistributionType,
    comment: '发放类型',
  })
  @Index('idx_distribution_type')
  distributionType!: DistributionType;

  @Column('json', { nullable: true, comment: '目标用户列表' })
  targetUsers?: string[];

  @Column('int', { comment: '发放总数' })
  totalCount!: number;

  @Column('int', { default: 0, comment: '成功数量' })
  successCount!: number;

  @Column('int', { default: 0, comment: '失败数量' })
  failCount!: number;

  @Column('uuid', { comment: '操作人 ID' })
  @Index('idx_operator_id')
  operatorId!: string;

  @Column('text', { nullable: true, comment: '备注' })
  remark?: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  // 关联关系
  @ManyToOne(() => CouponTemplate, (template) => template.distributions)
  @JoinColumn({ name: 'templateId' })
  template?: CouponTemplate;
}


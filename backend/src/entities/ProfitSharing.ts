import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CrowdfundingProject } from './CrowdfundingProject';
import { User } from './User';
import { CrowdfundingShare } from './CrowdfundingShare';

/**
 * 分润状态枚举
 */
export enum ProfitSharingStatus {
  PENDING = 'pending', // 待发放
  PAID = 'paid',       // 已发放
  FAILED = 'failed',   // 发放失败
}

/**
 * 分润记录实体
 */
@Entity('profit_sharing')
export class ProfitSharing {
  @PrimaryColumn('varchar', { length: 36, comment: '分润ID' })
  id!: string;

  @Column('varchar', { length: 32, unique: true, comment: '分润编号' })
  @Index('idx_profit_sharing_no')
  profitSharingNo!: string;

  @Column('varchar', { length: 36, comment: '项目ID' })
  @Index('idx_project_id')
  projectId!: string;

  @Column('varchar', { length: 36, comment: '用户ID' })
  @Index('idx_user_id')
  userId!: string;

  @Column('varchar', { length: 36, comment: '份额ID' })
  @Index('idx_share_id')
  shareId!: string;

  @Column('varchar', { length: 7, comment: '分润期间(YYYY-MM)' })
  @Index('idx_period')
  period!: string;

  @Column('int', { comment: '份额数量' })
  shareCount!: number;

  @Column('decimal', { precision: 12, scale: 2, comment: '总收入(元)' })
  totalIncome!: number;

  @Column('decimal', { precision: 12, scale: 2, comment: '总成本(元)' })
  totalCost!: number;

  @Column('decimal', { precision: 12, scale: 2, comment: '净收益(元)' })
  netIncome!: number;

  @Column('decimal', { precision: 12, scale: 2, comment: '分润金额(元)' })
  profitSharingAmount!: number;

  @Column({
    type: 'enum',
    enum: ProfitSharingStatus,
    default: ProfitSharingStatus.PENDING,
    comment: '分润状态',
  })
  @Index('idx_status')
  status!: ProfitSharingStatus;

  @Column('datetime', { nullable: true, comment: '发放时间' })
  paidAt?: Date;

  @Column('text', { nullable: true, comment: '备注' })
  remark?: string;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt!: Date;

  // 关联关系

  /**
   * 多对一：关联众筹项目
   */
  @ManyToOne(() => CrowdfundingProject, (project) => project.profitSharings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project?: CrowdfundingProject;

  /**
   * 多对一：关联用户
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  /**
   * 多对一：关联份额
   */
  @ManyToOne(() => CrowdfundingShare, (share) => share.profitSharings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shareId' })
  share?: CrowdfundingShare;

  // 计算属性

  /**
   * 是否已发放
   */
  get isPaid(): boolean {
    return this.status === ProfitSharingStatus.PAID;
  }

  /**
   * 收益率（百分比）
   */
  get yieldRate(): number {
    if (this.totalIncome === 0) return 0;
    return Math.round((this.netIncome / this.totalIncome) * 10000) / 100;
  }

  /**
   * 分润比例（百分比）
   */
  get profitSharingRatio(): number {
    if (this.netIncome === 0) return 0;
    return Math.round((this.profitSharingAmount / this.netIncome) * 10000) / 100;
  }
}


import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Vehicle } from './Vehicle';
import { CrowdfundingShare } from './CrowdfundingShare';
import { ProfitSharing } from './ProfitSharing';

/**
 * 众筹项目状态枚举
 */
export enum ProjectStatus {
  DRAFT = 'draft', // 草稿（待发布）
  ACTIVE = 'active', // 进行中
  SUCCESS = 'success', // 众筹成功
  FAILED = 'failed', // 众筹失败
  CLOSED = 'closed', // 已关闭
}

/**
 * 众筹项目实体
 */
@Entity('crowdfunding_projects')
export class CrowdfundingProject {
  @PrimaryColumn('varchar', { length: 36, comment: '项目ID' })
  id!: string;

  @Column('varchar', { length: 32, unique: true, comment: '项目编号' })
  @Index('idx_project_no')
  projectNo!: string;

  @Column('varchar', { length: 100, comment: '项目名称' })
  projectName!: string;

  @Column('varchar', { length: 36, comment: '车辆ID' })
  @Index('idx_vehicle_id')
  vehicleId!: string;

  @Column('int', { default: 100, comment: '总份额' })
  totalShares!: number;

  @Column('decimal', { precision: 10, scale: 2, comment: '单份价格' })
  sharePrice!: number;

  @Column('int', { default: 80, comment: '最低成功份额' })
  minSuccessShares!: number;

  @Column('int', { default: 0, comment: '已售份额' })
  soldShares!: number;

  @Column('decimal', { precision: 12, scale: 2, comment: '目标金额' })
  targetAmount!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0, comment: '已筹金额' })
  raisedAmount!: number;

  @Column('decimal', { precision: 5, scale: 2, comment: '预计年化收益率(%)' })
  annualYield!: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, comment: '预计月收益(元)' })
  monthlyIncome?: number;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
    comment: '项目状态',
  })
  @Index('idx_status')
  status!: ProjectStatus;

  @Column('datetime', { nullable: true, comment: '众筹开始时间' })
  @Index('idx_start_date')
  startDate?: Date;

  @Column('datetime', { nullable: true, comment: '众筹结束时间' })
  @Index('idx_end_date')
  endDate?: Date;

  @Column('text', { nullable: true, comment: '项目描述' })
  description?: string;

  @Column('text', { nullable: true, comment: '风险提示' })
  riskWarning?: string;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt!: Date;

  // 关联关系

  /**
   * 多对一：关联车辆
   */
  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicleId' })
  vehicle?: Vehicle;

  /**
   * 一对多：关联众筹份额
   */
  @OneToMany(() => CrowdfundingShare, share => share.project)
  shares?: CrowdfundingShare[];

  /**
   * 一对多：关联分润记录
   */
  @OneToMany(() => ProfitSharing, profitSharing => profitSharing.project)
  profitSharings?: ProfitSharing[];

  // 计算属性

  /**
   * 剩余份额
   */
  get remainingShares(): number {
    return this.totalShares - this.soldShares;
  }

  /**
   * 众筹进度（百分比）
   */
  get progress(): number {
    if (this.totalShares === 0) return 0;
    return Math.round((this.soldShares / this.totalShares) * 100);
  }

  /**
   * 是否达到最低成功份额
   */
  get isMinSuccessReached(): boolean {
    return this.soldShares >= this.minSuccessShares;
  }

  /**
   * 是否售罄
   */
  get isSoldOut(): boolean {
    return this.soldShares >= this.totalShares;
  }

  /**
   * 是否已结束
   */
  get isEnded(): boolean {
    if (!this.endDate) return false;
    return new Date() > this.endDate;
  }

  /**
   * 剩余天数
   */
  get remainingDays(): number {
    if (!this.endDate) return 0;
    const now = new Date();
    const diff = this.endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}

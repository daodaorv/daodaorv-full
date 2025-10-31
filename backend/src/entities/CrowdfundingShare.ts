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
import { CrowdfundingProject } from './CrowdfundingProject';
import { User } from './User';
import { ProfitSharing } from './ProfitSharing';

/**
 * 份额状态枚举
 */
export enum ShareStatus {
  ACTIVE = 'active', // 活跃
  TRANSFERRED = 'transferred', // 已转让
  REDEEMED = 'redeemed', // 已赎回
}

/**
 * 众筹份额实体
 */
@Entity('crowdfunding_shares')
export class CrowdfundingShare {
  @PrimaryColumn('varchar', { length: 36, comment: '份额ID' })
  id!: string;

  @Column('varchar', { length: 32, unique: true, comment: '份额编号' })
  @Index('idx_share_no')
  shareNo!: string;

  @Column('varchar', { length: 36, comment: '项目ID' })
  @Index('idx_project_id')
  projectId!: string;

  @Column('varchar', { length: 36, comment: '用户ID' })
  @Index('idx_user_id')
  userId!: string;

  @Column('int', { comment: '份额数量' })
  shareCount!: number;

  @Column('decimal', { precision: 12, scale: 2, comment: '购买金额' })
  purchasePrice!: number;

  @Column('datetime', { comment: '购买时间' })
  @Index('idx_purchase_date')
  purchaseDate!: Date;

  @Column({
    type: 'enum',
    enum: ShareStatus,
    default: ShareStatus.ACTIVE,
    comment: '份额状态',
  })
  @Index('idx_status')
  status!: ShareStatus;

  @Column('varchar', { length: 255, nullable: true, comment: '众筹协议URL' })
  agreementUrl?: string;

  @Column('datetime', { nullable: true, comment: '协议签署时间' })
  agreementSignedAt?: Date;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt!: Date;

  // 关联关系

  /**
   * 多对一：关联众筹项目
   */
  @ManyToOne(() => CrowdfundingProject, project => project.shares, {
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
   * 一对多：关联分润记录
   */
  @OneToMany(() => ProfitSharing, profitSharing => profitSharing.share)
  profitSharings?: ProfitSharing[];

  // 计算属性

  /**
   * 是否已签署协议
   */
  get isAgreementSigned(): boolean {
    return !!this.agreementSignedAt;
  }

  /**
   * 单份价格
   */
  get pricePerShare(): number {
    if (this.shareCount === 0) return 0;
    return this.purchasePrice / this.shareCount;
  }
}

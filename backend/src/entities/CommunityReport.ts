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
import { User } from './User';
import { TargetType } from './CommunityInteraction';

/**
 * 举报类型枚举
 */
export enum ReportType {
  BAD_CONTENT = 'bad_content', // 不良信息
  AD = 'ad', // 广告信息
  FRAUD = 'fraud', // 欺诈信息
  INFRINGEMENT = 'infringement', // 侵权信息
}

/**
 * 举报处理状态枚举
 */
export enum ReportStatus {
  PENDING = 'pending', // 待处理
  PROCESSING = 'processing', // 处理中
  RESOLVED = 'resolved', // 已处理
  REJECTED = 'rejected', // 已驳回
}

/**
 * 举报记录实体
 */
@Entity('community_reports')
export class CommunityReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'uuid',
    comment: '举报人 ID',
  })
  @Index('idx_reporter_id')
  reporterId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporterId' })
  reporter?: User;

  @Column({
    type: 'enum',
    enum: TargetType,
    comment: '举报目标类型',
  })
  @Index('idx_target_type')
  targetType!: TargetType;

  @Column({
    type: 'uuid',
    comment: '举报目标 ID',
  })
  @Index('idx_target_id')
  targetId!: string;

  @Column({
    type: 'enum',
    enum: ReportType,
    comment: '举报类型',
  })
  @Index('idx_report_type')
  reportType!: ReportType;

  @Column({
    type: 'text',
    comment: '举报原因',
  })
  reason!: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
    comment: '处理状态',
  })
  @Index('idx_status')
  status!: ReportStatus;

  @Column({
    type: 'text',
    nullable: true,
    comment: '处理结果',
  })
  handleResult?: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '处理时间',
  })
  handleTime?: Date;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '处理人 ID',
  })
  handlerId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'handlerId' })
  handler?: User;

  @CreateDateColumn({
    comment: '创建时间',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    comment: '更新时间',
  })
  updatedAt!: Date;
}


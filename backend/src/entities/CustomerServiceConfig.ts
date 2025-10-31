import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 客服配置实体
 */
@Entity('customer_service_configs')
export class CustomerServiceConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { nullable: true, unique: true, comment: '门店ID（null表示总部）' })
  @Index('idx_cs_config_store')
  storeId?: string;

  @Column('json', { comment: '客服人员ID列表' })
  staffIds!: string[];

  @Column('json', { comment: '工作时间配置' })
  workingHours!: {
    monday: { start: string; end: string };
    tuesday: { start: string; end: string };
    wednesday: { start: string; end: string };
    thursday: { start: string; end: string };
    friday: { start: string; end: string };
    saturday: { start: string; end: string };
    sunday: { start: string; end: string };
  };

  @Column('boolean', { default: true, comment: '是否启用自动回复' })
  autoReplyEnabled!: boolean;

  @Column('text', { nullable: true, comment: '自动回复内容' })
  autoReplyMessage?: string;

  @Column('int', { default: 10, comment: '最大并发会话数' })
  maxConcurrentSessions!: number;

  @Column('json', { nullable: true, comment: '转接规则' })
  transferRules?: {
    maxTransferCount: number;
    requireReason: boolean;
    allowedTargets: string[];
  };

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;
}


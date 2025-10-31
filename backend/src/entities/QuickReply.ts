import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 快捷回复实体
 */
@Entity('quick_replies')
export class QuickReply {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 50, comment: '分类' })
  @Index('idx_quick_reply_category')
  category!: string;

  @Column('varchar', { length: 100, comment: '标题' })
  title!: string;

  @Column('text', { comment: '回复内容' })
  content!: string;

  @Column('json', { nullable: true, comment: '关键词列表' })
  keywords?: string[];

  @Column('int', { default: 0, comment: '使用次数' })
  usageCount!: number;

  @Column('boolean', { default: true, comment: '是否启用' })
  @Index('idx_quick_reply_active')
  isActive!: boolean;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;
}


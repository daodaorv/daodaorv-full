import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { CommunityPost } from './CommunityPost';

/**
 * 社区话题实体
 */
@Entity('community_topics')
export class CommunityTopic {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    comment: '话题名称',
  })
  name!: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '话题描述',
  })
  description?: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '话题封面',
  })
  coverImage?: string;

  @Column({
    type: 'int',
    default: 0,
    comment: '帖子数量',
  })
  postCount!: number;

  @Column({
    type: 'int',
    default: 0,
    comment: '关注数',
  })
  followCount!: number;

  @Column({
    type: 'boolean',
    default: false,
    comment: '是否热门话题',
  })
  @Index('idx_is_hot')
  isHot!: boolean;

  @Column({
    type: 'int',
    default: 0,
    comment: '排序权重',
  })
  sortOrder!: number;

  @Column({
    type: 'boolean',
    default: true,
    comment: '是否启用',
  })
  @Index('idx_is_active')
  isActive!: boolean;

  @CreateDateColumn({
    comment: '创建时间',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    comment: '更新时间',
  })
  updatedAt!: Date;

  @OneToMany(() => CommunityPost, (post) => post.topic)
  posts?: CommunityPost[];
}


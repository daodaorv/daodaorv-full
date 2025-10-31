import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './User';
import { CommunityComment } from './CommunityComment';
import { CommunityTopic } from './CommunityTopic';
import { AuditStatus } from './enums/AuditStatus';

/**
 * 帖子类型枚举
 */
export enum PostType {
  GUIDE = 'guide', // 攻略
  EXPERIENCE = 'experience', // 体验
  ACTIVITY = 'activity', // 活动招募
}

/**
 * 帖子状态枚举
 */
export enum PostStatus {
  PENDING = 'pending', // 待审核
  APPROVED = 'approved', // 已通过
  REJECTED = 'rejected', // 已拒绝
  DELETED = 'deleted', // 已删除
}

/**
 * 社区帖子实体
 */
@Entity('community_posts')
export class CommunityPost {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'uuid',
    comment: '发布用户 ID',
  })
  @Index('idx_user_id')
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({
    type: 'enum',
    enum: PostType,
    comment: '帖子类型',
  })
  @Index('idx_post_type')
  type!: PostType;

  @Column({
    type: 'varchar',
    length: 100,
    comment: '标题',
  })
  title!: string;

  @Column({
    type: 'text',
    comment: '正文内容',
  })
  content!: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '封面图片 URL',
  })
  coverImage?: string;

  @Column({
    type: 'json',
    nullable: true,
    comment: '图片列表',
  })
  images?: string[];

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '视频 URL',
  })
  videoUrl?: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '关联城市 ID',
  })
  @Index('idx_city_id')
  cityId?: string;

  @Column({
    type: 'json',
    nullable: true,
    comment: '标签列表',
  })
  tags?: string[];

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '关联话题 ID',
  })
  @Index('idx_topic_id')
  topicId?: string;

  @ManyToOne(() => CommunityTopic)
  @JoinColumn({ name: 'topicId' })
  topic?: CommunityTopic;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.PENDING,
    comment: '帖子状态',
  })
  @Index('idx_status')
  status!: PostStatus;

  @Column({
    type: 'enum',
    enum: AuditStatus,
    default: AuditStatus.PENDING,
    comment: '审核状态',
  })
  @Index('idx_audit_status')
  auditStatus!: AuditStatus;

  @Column({
    type: 'text',
    nullable: true,
    comment: '审核备注',
  })
  auditRemark?: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '审核时间',
  })
  auditTime?: Date;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '审核人 ID',
  })
  auditorId?: string;

  @Column({
    type: 'int',
    default: 0,
    comment: '浏览量',
  })
  viewCount!: number;

  @Column({
    type: 'int',
    default: 0,
    comment: '点赞数',
  })
  likeCount!: number;

  @Column({
    type: 'int',
    default: 0,
    comment: '评论数',
  })
  commentCount!: number;

  @Column({
    type: 'int',
    default: 0,
    comment: '分享数',
  })
  shareCount!: number;

  @Column({
    type: 'int',
    default: 0,
    comment: '收藏数',
  })
  collectCount!: number;

  @Column({
    type: 'boolean',
    default: false,
    comment: '是否置顶',
  })
  @Index('idx_is_top')
  isTop!: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: '是否热门',
  })
  @Index('idx_is_hot')
  isHot!: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '发布时间',
  })
  @Index('idx_publish_time')
  publishTime?: Date;

  @CreateDateColumn({
    comment: '创建时间',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    comment: '更新时间',
  })
  updatedAt!: Date;

  @OneToMany(() => CommunityComment, comment => comment.post)
  comments?: CommunityComment[];
}

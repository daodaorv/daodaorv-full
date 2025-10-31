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
import { CommunityPost } from './CommunityPost';
import { AuditStatus } from './enums/AuditStatus';

/**
 * 评论状态枚举
 */
export enum CommentStatus {
  PENDING = 'pending', // 待审核
  APPROVED = 'approved', // 已通过
  REJECTED = 'rejected', // 已拒绝
  DELETED = 'deleted', // 已删除
}

/**
 * 社区评论实体
 */
@Entity('community_comments')
export class CommunityComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'uuid',
    comment: '帖子 ID',
  })
  @Index('idx_post_id')
  postId!: string;

  @ManyToOne(() => CommunityPost, post => post.comments)
  @JoinColumn({ name: 'postId' })
  post?: CommunityPost;

  @Column({
    type: 'uuid',
    comment: '评论用户 ID',
  })
  @Index('idx_user_id')
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({
    type: 'text',
    comment: '评论内容',
  })
  content!: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '父评论 ID（回复评论）',
  })
  @Index('idx_parent_id')
  parentId?: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '回复给谁',
  })
  replyToUserId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'replyToUserId' })
  replyToUser?: User;

  @Column({
    type: 'enum',
    enum: CommentStatus,
    default: CommentStatus.PENDING,
    comment: '评论状态',
  })
  @Index('idx_status')
  status!: CommentStatus;

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
    type: 'int',
    default: 0,
    comment: '点赞数',
  })
  likeCount!: number;

  @CreateDateColumn({
    comment: '创建时间',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    comment: '更新时间',
  })
  updatedAt!: Date;
}

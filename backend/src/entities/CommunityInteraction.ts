import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './User';

/**
 * 目标类型枚举
 */
export enum TargetType {
  POST = 'post', // 帖子
  COMMENT = 'comment', // 评论
}

/**
 * 互动类型枚举
 */
export enum InteractionType {
  LIKE = 'like', // 点赞
  COLLECT = 'collect', // 收藏
  SHARE = 'share', // 分享
}

/**
 * 用户互动记录实体
 */
@Entity('community_interactions')
@Unique(['userId', 'targetType', 'targetId', 'interactionType'])
export class CommunityInteraction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'uuid',
    comment: '用户 ID',
  })
  @Index('idx_user_id')
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({
    type: 'enum',
    enum: TargetType,
    comment: '目标类型',
  })
  @Index('idx_target_type')
  targetType!: TargetType;

  @Column({
    type: 'uuid',
    comment: '目标 ID',
  })
  @Index('idx_target_id')
  targetId!: string;

  @Column({
    type: 'enum',
    enum: InteractionType,
    comment: '互动类型',
  })
  @Index('idx_interaction_type')
  interactionType!: InteractionType;

  @CreateDateColumn({
    comment: '创建时间',
  })
  createdAt!: Date;
}


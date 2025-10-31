import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './User';

/**
 * 收藏类型枚举
 */
export enum FavoriteType {
  VEHICLE = 'vehicle', // 房车
  CAMPSITE = 'campsite', // 营地
  TOUR = 'tour', // 旅游路线
  SPECIAL_OFFER = 'special_offer', // 特惠套餐
}

/**
 * 用户收藏实体
 */
@Entity('user_favorites')
@Unique(['userId', 'targetType', 'targetId'])
export class UserFavorite {
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
    enum: FavoriteType,
    comment: '收藏类型',
  })
  @Index('idx_target_type')
  targetType!: FavoriteType;

  @Column({
    type: 'uuid',
    comment: '目标 ID',
  })
  @Index('idx_target_id')
  targetId!: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '收藏时间',
  })
  @Index('idx_created_at')
  createdAt!: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    comment: '更新时间',
  })
  updatedAt!: Date;
}
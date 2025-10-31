import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { PointsTransaction } from './PointsTransaction';

/**
 * 积分状态枚举
 */
export enum PointsStatus {
  ACTIVE = 'active',     // 活跃
  EXPIRED = 'expired',   // 已过期
  CLEARED = 'cleared',   // 已清零
}

/**
 * 车主积分实体
 */
@Entity('owner_points')
export class OwnerPoints {
  @PrimaryColumn('varchar', { length: 36, comment: '积分ID' })
  id!: string;

  @Column('varchar', { length: 36, unique: true, comment: '用户ID' })
  @Index('idx_user_id')
  userId!: string;

  @Column('int', { default: 0, comment: '积分余额' })
  balance!: number;

  @Column('int', { default: 0, comment: '累计获得' })
  totalEarned!: number;

  @Column('int', { default: 0, comment: '累计使用' })
  totalUsed!: number;

  @Column('date', { nullable: true, comment: '过期日期' })
  @Index('idx_expiry_date')
  expiryDate?: Date;

  @Column({
    type: 'enum',
    enum: PointsStatus,
    default: PointsStatus.ACTIVE,
    comment: '状态',
  })
  @Index('idx_status')
  status!: PointsStatus;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt!: Date;

  // 关联关系

  /**
   * 一对一：关联用户
   */
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  /**
   * 一对多：关联积分流水
   */
  @OneToMany(() => PointsTransaction, (transaction) => transaction.userId)
  transactions?: PointsTransaction[];

  // 计算属性

  /**
   * 是否已过期
   */
  get isExpired(): boolean {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
  }

  /**
   * 是否活跃
   */
  get isActive(): boolean {
    return this.status === PointsStatus.ACTIVE && !this.isExpired;
  }

  /**
   * 剩余天数
   */
  get remainingDays(): number {
    if (!this.expiryDate) return 0;
    const now = new Date();
    const diff = this.expiryDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}


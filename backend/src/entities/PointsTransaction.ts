import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User';

/**
 * 积分交易类型枚举
 */
export enum TransactionType {
  EARN = 'earn',     // 获得
  USE = 'use',       // 使用
  EXPIRE = 'expire', // 过期
  CLEAR = 'clear',   // 清零
}

/**
 * 积分来源枚举
 */
export enum PointsSource {
  PURCHASE = 'purchase',       // 众筹购买
  ADDITIONAL = 'additional',   // 追加购买
  REFERRAL = 'referral',       // 推广订单
  ACTIVITY = 'activity',       // 平台活动
  GOVERNANCE = 'governance',   // 治理活动
}

/**
 * 积分流水实体
 */
@Entity('points_transactions')
export class PointsTransaction {
  @PrimaryColumn('varchar', { length: 36, comment: '流水ID' })
  id!: string;

  @Column('varchar', { length: 32, unique: true, comment: '流水编号' })
  @Index('idx_transaction_no')
  transactionNo!: string;

  @Column('varchar', { length: 36, comment: '用户ID' })
  @Index('idx_user_id')
  userId!: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
    comment: '交易类型',
  })
  @Index('idx_type')
  type!: TransactionType;

  @Column('int', { comment: '积分数量' })
  amount!: number;

  @Column('int', { comment: '操作后余额' })
  balance!: number;

  @Column({
    type: 'enum',
    enum: PointsSource,
    nullable: true,
    comment: '积分来源',
  })
  @Index('idx_source')
  source?: PointsSource;

  @Column('varchar', { length: 36, nullable: true, comment: '关联ID(份额ID、订单ID等)' })
  relatedId?: string;

  @Column('varchar', { length: 255, nullable: true, comment: '描述' })
  description?: string;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  @Index('idx_created_at')
  createdAt!: Date;

  // 关联关系

  /**
   * 多对一：关联用户
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  // 计算属性

  /**
   * 是否为获得积分
   */
  get isEarn(): boolean {
    return this.type === TransactionType.EARN;
  }

  /**
   * 是否为使用积分
   */
  get isUse(): boolean {
    return this.type === TransactionType.USE;
  }

  /**
   * 是否为过期
   */
  get isExpire(): boolean {
    return this.type === TransactionType.EXPIRE;
  }

  /**
   * 是否为清零
   */
  get isClear(): boolean {
    return this.type === TransactionType.CLEAR;
  }

  /**
   * 积分变化（带符号）
   */
  get change(): number {
    if (this.isEarn) return this.amount;
    return -this.amount;
  }
}


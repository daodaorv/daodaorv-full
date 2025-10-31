import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Wallet } from './Wallet';

/**
 * 交易类型枚举
 */
export enum TransactionType {
  RECHARGE = 'recharge', // 充值
  CONSUME = 'consume', // 消费
  REFUND = 'refund', // 退款
  WITHDRAWAL = 'withdrawal', // 提现
  ADJUSTMENT = 'adjustment', // 调整（管理员手动调整）
  FREEZE = 'freeze', // 冻结
  UNFREEZE = 'unfreeze', // 解冻
}

/**
 * 钱包交易记录实体
 * 记录所有钱包的资金变动
 */
@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, comment: '钱包ID' })
  walletId!: string;

  @Column({ type: 'varchar', length: 36, comment: '用户ID' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
    comment: '交易类型',
  })
  type!: TransactionType;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    comment: '交易金额（正数或负数）',
  })
  amount!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    comment: '交易后余额',
  })
  balanceAfter!: number;

  @Column({
    type: 'varchar',
    length: 36,
    nullable: true,
    comment: '关联ID（订单ID、充值ID、提现ID等）',
  })
  relatedId?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '关联类型（order/recharge/withdrawal）',
  })
  relatedType?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '交易描述',
  })
  description?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '操作人ID（管理员调整时记录）',
  })
  operatorId?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '备注（调整原因等）',
  })
  remarks?: string;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt!: Date;

  // 关联钱包
  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'walletId' })
  wallet?: Wallet;
}

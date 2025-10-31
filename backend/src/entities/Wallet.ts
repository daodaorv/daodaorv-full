import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

/**
 * 钱包状态枚举
 */
export enum WalletStatus {
  ACTIVE = 'active', // 正常
  FROZEN = 'frozen', // 冻结
  CLOSED = 'closed', // 关闭
}

/**
 * 钱包实体
 * 每个用户只能有一个钱包
 */
@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, unique: true, comment: '用户ID' })
  userId!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    comment: '钱包余额',
  })
  balance!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    comment: '冻结金额（提现中、押金等）',
  })
  frozenAmount!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    comment: '累计充值金额',
  })
  totalRecharge!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    comment: '累计消费金额',
  })
  totalConsume!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    comment: '累计提现金额',
  })
  totalWithdrawal!: number;

  @Column({
    type: 'enum',
    enum: WalletStatus,
    default: WalletStatus.ACTIVE,
    comment: '钱包状态',
  })
  status!: WalletStatus;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt!: Date;

  // 关联用户（一对一）
  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  /**
   * 计算可用余额
   */
  get availableBalance(): number {
    return Number(this.balance) - Number(this.frozenAmount);
  }
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

/**
 * 提现状态枚举
 */
export enum WithdrawalStatus {
  PENDING = 'pending', // 待审核
  PROCESSING = 'processing', // 处理中
  COMPLETED = 'completed', // 已完成
  REJECTED = 'rejected', // 已拒绝
  FAILED = 'failed', // 失败
}

/**
 * 提现方式枚举
 */
export enum WithdrawalMethod {
  WECHAT = 'wechat', // 微信
  ALIPAY = 'alipay', // 支付宝
  BANK_CARD = 'bank_card', // 银行卡
}

/**
 * 提现记录实体
 */
@Entity('withdrawal_records')
export class WithdrawalRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 32, unique: true, comment: '提现单号' })
  withdrawalNo!: string;

  @Column({ type: 'varchar', length: 36, comment: '用户ID' })
  userId!: string;

  @Column({ type: 'varchar', length: 36, comment: '钱包ID' })
  walletId!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    comment: '提现金额',
  })
  amount!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    comment: '手续费',
  })
  fee!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    comment: '实际到账金额',
  })
  actualAmount!: number;

  @Column({
    type: 'enum',
    enum: WithdrawalMethod,
    comment: '提现方式',
  })
  method!: WithdrawalMethod;

  @Column({
    type: 'varchar',
    length: 100,
    comment: '提现账户（微信/支付宝账号、银行卡号）',
  })
  account!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '账户名称',
  })
  accountName?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '开户行（银行卡提现时需要）',
  })
  bankName?: string;

  @Column({
    type: 'enum',
    enum: WithdrawalStatus,
    default: WithdrawalStatus.PENDING,
    comment: '提现状态',
  })
  status!: WithdrawalStatus;

  @Column({
    type: 'varchar',
    length: 36,
    nullable: true,
    comment: '审核人ID',
  })
  reviewerId?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '拒绝原因或失败原因',
  })
  rejectReason?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '第三方流水号',
  })
  thirdPartyTradeNo?: string;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: '审核时间',
  })
  reviewedAt?: Date;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: '完成时间',
  })
  completedAt?: Date;

  @Column({
    type: 'text',
    nullable: true,
    comment: '备注',
  })
  remarks?: string;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt!: Date;

  // 关联用户
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { AuthStatus } from './User';

export enum AuditType {
  REALNAME = 'realname', // 实名认证审核
  DRIVING_LICENSE = 'driving_license', // 驾照认证审核
}

@Entity('user_audit_logs')
export class UserAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({
    type: 'enum',
    enum: AuditType,
  })
  auditType!: AuditType;

  @Column({
    type: 'enum',
    enum: AuthStatus,
  })
  auditResult!: AuthStatus; // 审核结果：approved/rejected

  @Column({ type: 'text', nullable: true })
  auditReason?: string; // 审核原因（拒绝时必填）

  @Column({ type: 'varchar', length: 36 })
  auditBy!: string; // 审核人ID（管理员）

  @CreateDateColumn()
  created_at!: Date;
}

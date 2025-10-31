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

/**
 * 工单类别
 */
export enum TicketCategory {
  ORDER = 'order',           // 订单问题
  PAYMENT = 'payment',       // 支付问题
  VEHICLE = 'vehicle',       // 车辆问题
  COMPLAINT = 'complaint',   // 投诉建议
  OTHER = 'other',           // 其他问题
}

/**
 * 工单优先级
 */
export enum TicketPriority {
  LOW = 'low',           // 低
  NORMAL = 'normal',     // 普通
  HIGH = 'high',         // 高
  URGENT = 'urgent',     // 紧急
}

/**
 * 工单状态
 */
export enum TicketStatus {
  PENDING = 'pending',         // 待处理
  PROCESSING = 'processing',   // 处理中
  RESOLVED = 'resolved',       // 已解决
  CLOSED = 'closed',           // 已关闭
}

/**
 * 客服工单实体
 */
@Entity('customer_service_tickets')
export class CustomerServiceTicket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 32, unique: true, comment: '工单编号' })
  @Index('idx_ticket_no')
  ticketNo!: string;

  @Column('uuid', { nullable: true, comment: '关联会话ID' })
  @Index('idx_ticket_session')
  sessionId?: string;

  @Column('uuid', { comment: '用户ID' })
  @Index('idx_ticket_user')
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column('uuid', { nullable: true, comment: '分配客服ID' })
  @Index('idx_ticket_staff')
  assignedStaffId?: string;

  @Column({
    type: 'enum',
    enum: TicketCategory,
    comment: '工单类别',
  })
  @Index('idx_ticket_category')
  category!: TicketCategory;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.NORMAL,
    comment: '优先级',
  })
  @Index('idx_ticket_priority')
  priority!: TicketPriority;

  @Column('varchar', { length: 200, comment: '工单标题' })
  title!: string;

  @Column('text', { comment: '问题描述' })
  description!: string;

  @Column('json', { nullable: true, comment: '附件列表' })
  attachments?: string[];

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.PENDING,
    comment: '工单状态',
  })
  @Index('idx_ticket_status')
  status!: TicketStatus;

  @Column('text', { nullable: true, comment: '解决方案' })
  resolution?: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  @Column('datetime', { nullable: true, comment: '解决时间' })
  resolvedAt?: Date;

  @Column('datetime', { nullable: true, comment: '关闭时间' })
  closedAt?: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;
}


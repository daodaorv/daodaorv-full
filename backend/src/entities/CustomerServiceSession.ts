import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './User';
import { CustomerServiceMessage } from './CustomerServiceMessage';

/**
 * 会话来源渠道
 */
export enum SessionSource {
  WECHAT = 'wechat',     // 微信小程序
  ALIPAY = 'alipay',     // 支付宝小程序
  DOUYIN = 'douyin',     // 抖音小程序
  H5 = 'h5',             // H5页面
}

/**
 * 会话状态
 */
export enum SessionStatus {
  WAITING = 'waiting',   // 等待接入
  SERVING = 'serving',   // 服务中
  CLOSED = 'closed',     // 已关闭
}

/**
 * 优先级
 */
export enum SessionPriority {
  LOW = 'low',           // 低
  NORMAL = 'normal',     // 普通
  HIGH = 'high',         // 高
  URGENT = 'urgent',     // 紧急
}

/**
 * 客服会话实体
 */
@Entity('customer_service_sessions')
export class CustomerServiceSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 32, unique: true, comment: '会话编号' })
  @Index('idx_session_no')
  sessionNo!: string;

  @Column('uuid', { comment: '用户ID' })
  @Index('idx_session_user')
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column('uuid', { nullable: true, comment: '客服人员ID' })
  @Index('idx_session_staff')
  staffId?: string;

  @Column('uuid', { nullable: true, comment: '归属门店ID' })
  @Index('idx_session_store')
  storeId?: string;

  @Column({
    type: 'enum',
    enum: SessionSource,
    comment: '来源渠道',
  })
  @Index('idx_session_source')
  source!: SessionSource;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.WAITING,
    comment: '会话状态',
  })
  @Index('idx_session_status')
  status!: SessionStatus;

  @Column({
    type: 'enum',
    enum: SessionPriority,
    default: SessionPriority.NORMAL,
    comment: '优先级',
  })
  @Index('idx_session_priority')
  priority!: SessionPriority;

  @Column('uuid', { nullable: true, comment: '关联订单ID' })
  relatedOrderId?: string;

  @Column('varchar', { length: 50, nullable: true, comment: '订单类型' })
  relatedOrderType?: string;

  @Column('datetime', { nullable: true, comment: '首次响应时间' })
  firstResponseTime?: Date;

  @Column('datetime', { nullable: true, comment: '最后消息时间' })
  @Index('idx_session_last_message')
  lastMessageTime?: Date;

  @Column('datetime', { nullable: true, comment: '关闭时间' })
  closedAt?: Date;

  @Column('int', { nullable: true, comment: '满意度评分（1-5）' })
  satisfaction?: number;

  @Column('json', { nullable: true, comment: '会话标签' })
  tags?: string[];

  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;

  @OneToMany(() => CustomerServiceMessage, (message) => message.session)
  messages?: CustomerServiceMessage[];
}


import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CustomerServiceSession } from './CustomerServiceSession';

/**
 * 发送者类型
 */
export enum SenderType {
  USER = 'user',         // 用户
  STAFF = 'staff',       // 客服
  SYSTEM = 'system',     // 系统
}

/**
 * 消息类型
 */
export enum MessageType {
  TEXT = 'text',                 // 文本消息
  IMAGE = 'image',               // 图片消息
  VOICE = 'voice',               // 语音消息
  VIDEO = 'video',               // 视频消息
  ORDER_CARD = 'order_card',     // 订单卡片
  QUICK_REPLY = 'quick_reply',   // 快捷回复
}

/**
 * 客服消息实体
 */
@Entity('customer_service_messages')
export class CustomerServiceMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { comment: '会话ID' })
  @Index('idx_message_session')
  sessionId!: string;

  @ManyToOne(() => CustomerServiceSession, (session) => session.messages)
  @JoinColumn({ name: 'sessionId' })
  session?: CustomerServiceSession;

  @Column({
    type: 'enum',
    enum: SenderType,
    comment: '发送者类型',
  })
  @Index('idx_message_sender_type')
  senderType!: SenderType;

  @Column('uuid', { comment: '发送者ID' })
  @Index('idx_message_sender')
  senderId!: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    comment: '消息类型',
  })
  @Index('idx_message_type')
  messageType!: MessageType;

  @Column('text', { comment: '消息内容' })
  content!: string;

  @Column('varchar', { length: 500, nullable: true, comment: '媒体文件URL' })
  mediaUrl?: string;

  @Column('json', { nullable: true, comment: '订单卡片数据' })
  orderCardData?: {
    orderId: string;
    orderNo: string;
    orderType: string;
    amount: number;
    status: string;
  };

  @Column('boolean', { default: false, comment: '是否已读' })
  @Index('idx_message_read')
  isRead!: boolean;

  @Column('datetime', { nullable: true, comment: '阅读时间' })
  readAt?: Date;

  @CreateDateColumn({ comment: '创建时间' })
  @Index('idx_message_created')
  createdAt!: Date;
}


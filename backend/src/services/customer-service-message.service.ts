import { AppDataSource } from '../config/database';
import {
  CustomerServiceMessage,
  SenderType,
  MessageType,
} from '../entities/CustomerServiceMessage';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { CustomerServiceSessionService } from './customer-service-session.service';

/**
 * 发送消息 DTO
 */
export interface SendMessageDTO {
  sessionId: string;
  senderType: SenderType;
  senderId: string;
  messageType: MessageType;
  content: string;
  mediaUrl?: string;
  orderCardData?: {
    orderId: string;
    orderNo: string;
    orderType: string;
    amount: number;
    status: string;
  };
}

/**
 * 消息列表查询 DTO
 */
export interface MessageListDTO {
  sessionId: string;
  page?: number;
  pageSize?: number;
  messageType?: MessageType;
  isRead?: boolean;
}

/**
 * 客服消息服务
 */
export class CustomerServiceMessageService {
  private messageRepository: Repository<CustomerServiceMessage>;
  private sessionService: CustomerServiceSessionService;

  constructor() {
    this.messageRepository = AppDataSource.getRepository(CustomerServiceMessage);
    this.sessionService = new CustomerServiceSessionService();
  }

  /**
   * 发送消息
   */
  async sendMessage(data: SendMessageDTO): Promise<CustomerServiceMessage> {
    // 验证会话存在
    const session = await this.sessionService.getSessionById(data.sessionId);
    if (!session) throw new Error('会话不存在');

    const message = this.messageRepository.create({
      id: uuidv4(),
      sessionId: data.sessionId,
      senderType: data.senderType,
      senderId: data.senderId,
      messageType: data.messageType,
      content: data.content,
      mediaUrl: data.mediaUrl,
      orderCardData: data.orderCardData,
      isRead: false,
    });

    await this.messageRepository.save(message);

    // 更新会话的最后消息时间
    await this.sessionService.updateLastMessageTime(data.sessionId);

    logger.info(
      `消息发送成功: 会话=${data.sessionId}, 发送者=${data.senderId}, 类型=${data.messageType}`
    );
    return message;
  }

  /**
   * 获取消息列表
   */
  async getMessageList(query: MessageListDTO): Promise<{
    messages: CustomerServiceMessage[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 50;

    const queryBuilder = this.messageRepository.createQueryBuilder('message');

    // 必须指定会话ID
    queryBuilder.where('message.sessionId = :sessionId', { sessionId: query.sessionId });

    // 筛选条件
    if (query.messageType) {
      queryBuilder.andWhere('message.messageType = :messageType', {
        messageType: query.messageType,
      });
    }
    if (query.isRead !== undefined) {
      queryBuilder.andWhere('message.isRead = :isRead', { isRead: query.isRead });
    }

    // 按时间正序排列
    queryBuilder.orderBy('message.createdAt', 'ASC');

    // 分页
    const [messages, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { messages, total, page, pageSize };
  }

  /**
   * 标记消息为已读
   */
  async markAsRead(messageId: string): Promise<void> {
    const message = await this.messageRepository.findOne({ where: { id: messageId } });
    if (!message) throw new Error('消息不存在');
    if (message.isRead) return;

    message.isRead = true;
    message.readAt = new Date();

    await this.messageRepository.save(message);
    logger.info(`消息已读: ${messageId}`);
  }

  /**
   * 批量标记会话消息为已读
   */
  async markSessionMessagesAsRead(sessionId: string, readerId: string): Promise<void> {
    await this.messageRepository
      .createQueryBuilder()
      .update(CustomerServiceMessage)
      .set({ isRead: true, readAt: new Date() })
      .where('sessionId = :sessionId', { sessionId })
      .andWhere('senderId != :readerId', { readerId })
      .andWhere('isRead = :isRead', { isRead: false })
      .execute();

    logger.info(`会话消息已全部标记为已读: ${sessionId}`);
  }

  /**
   * 获取未读消息数量
   */
  async getUnreadCount(sessionId: string, _userId: string): Promise<number> {
    const count = await this.messageRepository.count({
      where: {
        sessionId,
        isRead: false,
        senderType: SenderType.STAFF, // 只统计客服发送的未读消息
      },
    });
    return count;
  }

  /**
   * 获取用户所有会话的未读消息总数
   */
  async getUserTotalUnreadCount(_userId: string): Promise<number> {
    // TODO: 需要关联会话表查询
    // 暂时返回0
    return 0;
  }
}

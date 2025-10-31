import { AppDataSource } from '../config/database';
import {
  CustomerServiceSession,
  SessionSource,
  SessionStatus,
  SessionPriority,
} from '../entities/CustomerServiceSession';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

/**
 * 创建会话 DTO
 */
export interface CreateSessionDTO {
  userId: string;
  source: SessionSource;
  relatedOrderId?: string;
  relatedOrderType?: string;
  priority?: SessionPriority;
}

/**
 * 会话列表查询 DTO
 */
export interface SessionListDTO {
  page?: number;
  pageSize?: number;
  userId?: string;
  staffId?: string;
  storeId?: string;
  status?: SessionStatus;
  priority?: SessionPriority;
  source?: SessionSource;
}

/**
 * 转接会话 DTO
 */
export interface TransferSessionDTO {
  targetStaffId: string;
  reason: string;
}

/**
 * 评价会话 DTO
 */
export interface RateSessionDTO {
  satisfaction: number; // 1-5
  comment?: string;
}

/**
 * 客服会话服务
 */
export class CustomerServiceSessionService {
  private sessionRepository: Repository<CustomerServiceSession>;

  constructor() {
    this.sessionRepository = AppDataSource.getRepository(CustomerServiceSession);
  }

  /**
   * 生成会话编号
   */
  private async generateSessionNo(): Promise<string> {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `CSS${timestamp}${random}`;
  }

  /**
   * 自动分配客服
   * 规则：订单门店 > 定位门店 > 总部
   */
  private async assignStaff(
    _userId: string,
    storeId?: string
  ): Promise<{ staffId?: string; storeId?: string }> {
    // TODO: 实现门店客服分配逻辑
    // 1. 查询用户最近订单的门店
    // 2. 查询该门店的在线客服
    // 3. 如果门店客服离线，转总部客服
    // 4. 根据客服当前会话数量负载均衡

    // 暂时返回空，表示进入待分配队列
    return { staffId: undefined, storeId: storeId };
  }

  /**
   * 创建会话
   */
  async createSession(data: CreateSessionDTO): Promise<CustomerServiceSession> {
    // 检查是否有未关闭的会话
    const existingSession = await this.sessionRepository.findOne({
      where: {
        userId: data.userId,
        status: SessionStatus.SERVING,
      },
    });

    if (existingSession) {
      logger.info(`用户已有进行中的会话: ${existingSession.sessionNo}`);
      return existingSession;
    }

    // 自动分配客服
    const assignment = await this.assignStaff(data.userId);

    const session = this.sessionRepository.create({
      id: uuidv4(),
      sessionNo: await this.generateSessionNo(),
      userId: data.userId,
      staffId: assignment.staffId,
      storeId: assignment.storeId,
      source: data.source,
      status: assignment.staffId ? SessionStatus.SERVING : SessionStatus.WAITING,
      priority: data.priority || SessionPriority.NORMAL,
      relatedOrderId: data.relatedOrderId,
      relatedOrderType: data.relatedOrderType,
      lastMessageTime: new Date(),
    });

    await this.sessionRepository.save(session);
    logger.info(`会话创建成功: ${session.sessionNo} - 用户: ${data.userId}`);
    return session;
  }

  /**
   * 接受会话（客服端）
   */
  async acceptSession(sessionId: string, staffId: string): Promise<CustomerServiceSession> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new Error('会话不存在');
    if (session.status !== SessionStatus.WAITING) throw new Error('会话状态不正确');

    session.staffId = staffId;
    session.status = SessionStatus.SERVING;
    session.firstResponseTime = new Date();

    await this.sessionRepository.save(session);
    logger.info(`会话已接受: ${session.sessionNo} - 客服: ${staffId}`);
    return session;
  }

  /**
   * 转接会话
   */
  async transferSession(
    sessionId: string,
    data: TransferSessionDTO
  ): Promise<CustomerServiceSession> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new Error('会话不存在');
    if (session.status !== SessionStatus.SERVING) throw new Error('只能转接进行中的会话');

    // TODO: 检查转接次数限制（最多3次）
    // TODO: 记录转接历史

    session.staffId = data.targetStaffId;

    await this.sessionRepository.save(session);
    logger.info(
      `会话已转接: ${session.sessionNo} - 目标客服: ${data.targetStaffId} - 原因: ${data.reason}`
    );
    return session;
  }

  /**
   * 关闭会话
   */
  async closeSession(sessionId: string): Promise<CustomerServiceSession> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new Error('会话不存在');
    if (session.status === SessionStatus.CLOSED) throw new Error('会话已关闭');

    session.status = SessionStatus.CLOSED;
    session.closedAt = new Date();

    await this.sessionRepository.save(session);
    logger.info(`会话已关闭: ${session.sessionNo}`);
    return session;
  }

  /**
   * 评价会话
   */
  async rateSession(sessionId: string, data: RateSessionDTO): Promise<CustomerServiceSession> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new Error('会话不存在');
    if (session.status !== SessionStatus.CLOSED) throw new Error('只能评价已关闭的会话');
    if (data.satisfaction < 1 || data.satisfaction > 5) {
      throw new Error('满意度评分必须在1-5之间');
    }

    session.satisfaction = data.satisfaction;

    await this.sessionRepository.save(session);
    logger.info(`会话已评价: ${session.sessionNo} - 评分: ${data.satisfaction}`);
    return session;
  }

  /**
   * 获取会话列表
   */
  async getSessionList(query: SessionListDTO): Promise<{
    sessions: CustomerServiceSession[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const queryBuilder = this.sessionRepository.createQueryBuilder('session');

    // 筛选条件
    if (query.userId) {
      queryBuilder.andWhere('session.userId = :userId', { userId: query.userId });
    }
    if (query.staffId) {
      queryBuilder.andWhere('session.staffId = :staffId', { staffId: query.staffId });
    }
    if (query.storeId) {
      queryBuilder.andWhere('session.storeId = :storeId', { storeId: query.storeId });
    }
    if (query.status) {
      queryBuilder.andWhere('session.status = :status', { status: query.status });
    }
    if (query.priority) {
      queryBuilder.andWhere('session.priority = :priority', { priority: query.priority });
    }
    if (query.source) {
      queryBuilder.andWhere('session.source = :source', { source: query.source });
    }

    // 排序：优先级高的在前，最后消息时间倒序
    queryBuilder.orderBy('session.priority', 'DESC');
    queryBuilder.addOrderBy('session.lastMessageTime', 'DESC');

    // 分页
    const [sessions, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { sessions, total, page, pageSize };
  }

  /**
   * 获取会话详情
   */
  async getSessionById(id: string): Promise<CustomerServiceSession> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ['user', 'messages'],
    });
    if (!session) throw new Error('会话不存在');
    return session;
  }

  /**
   * 更新最后消息时间
   */
  async updateLastMessageTime(sessionId: string): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      lastMessageTime: new Date(),
    });
  }
}

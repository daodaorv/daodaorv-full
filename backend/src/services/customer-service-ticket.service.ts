import { AppDataSource } from '../config/database';
import {
  CustomerServiceTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../entities/CustomerServiceTicket';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

/**
 * 创建工单 DTO
 */
export interface CreateTicketDTO {
  sessionId?: string;
  userId: string;
  category: TicketCategory;
  priority?: TicketPriority;
  title: string;
  description: string;
  attachments?: string[];
}

/**
 * 更新工单 DTO
 */
export interface UpdateTicketDTO {
  status?: TicketStatus;
  resolution?: string;
  assignedStaffId?: string;
}

/**
 * 工单列表查询 DTO
 */
export interface TicketListDTO {
  page?: number;
  pageSize?: number;
  userId?: string;
  assignedStaffId?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
}

/**
 * 客服工单服务
 */
export class CustomerServiceTicketService {
  private ticketRepository: Repository<CustomerServiceTicket>;

  constructor() {
    this.ticketRepository = AppDataSource.getRepository(CustomerServiceTicket);
  }

  /**
   * 生成工单编号
   */
  private async generateTicketNo(): Promise<string> {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `CST${timestamp}${random}`;
  }

  /**
   * 创建工单
   */
  async createTicket(data: CreateTicketDTO): Promise<CustomerServiceTicket> {
    const ticket = this.ticketRepository.create({
      id: uuidv4(),
      ticketNo: await this.generateTicketNo(),
      sessionId: data.sessionId,
      userId: data.userId,
      category: data.category,
      priority: data.priority || TicketPriority.NORMAL,
      title: data.title,
      description: data.description,
      attachments: data.attachments,
      status: TicketStatus.PENDING,
    });

    await this.ticketRepository.save(ticket);
    logger.info(`工单创建成功: ${ticket.ticketNo} - 用户: ${data.userId}`);
    return ticket;
  }

  /**
   * 更新工单
   */
  async updateTicket(ticketId: string, data: UpdateTicketDTO): Promise<CustomerServiceTicket> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) throw new Error('工单不存在');

    // 更新状态
    if (data.status) {
      ticket.status = data.status;

      // 状态变更时更新时间戳
      if (data.status === TicketStatus.RESOLVED) {
        ticket.resolvedAt = new Date();
      } else if (data.status === TicketStatus.CLOSED) {
        ticket.closedAt = new Date();
      }
    }

    // 更新解决方案
    if (data.resolution) {
      ticket.resolution = data.resolution;
    }

    // 更新分配客服
    if (data.assignedStaffId) {
      ticket.assignedStaffId = data.assignedStaffId;
    }

    await this.ticketRepository.save(ticket);
    logger.info(`工单已更新: ${ticket.ticketNo}`);
    return ticket;
  }

  /**
   * 分配工单
   */
  async assignTicket(ticketId: string, staffId: string): Promise<CustomerServiceTicket> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) throw new Error('工单不存在');
    if (ticket.status === TicketStatus.CLOSED) throw new Error('已关闭的工单不能分配');

    ticket.assignedStaffId = staffId;
    if (ticket.status === TicketStatus.PENDING) {
      ticket.status = TicketStatus.PROCESSING;
    }

    await this.ticketRepository.save(ticket);
    logger.info(`工单已分配: ${ticket.ticketNo} - 客服: ${staffId}`);
    return ticket;
  }

  /**
   * 解决工单
   */
  async resolveTicket(ticketId: string, resolution: string): Promise<CustomerServiceTicket> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) throw new Error('工单不存在');
    if (ticket.status === TicketStatus.CLOSED) throw new Error('已关闭的工单不能解决');

    ticket.status = TicketStatus.RESOLVED;
    ticket.resolution = resolution;
    ticket.resolvedAt = new Date();

    await this.ticketRepository.save(ticket);
    logger.info(`工单已解决: ${ticket.ticketNo}`);
    return ticket;
  }

  /**
   * 关闭工单
   */
  async closeTicket(ticketId: string): Promise<CustomerServiceTicket> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) throw new Error('工单不存在');
    if (ticket.status === TicketStatus.CLOSED) throw new Error('工单已关闭');

    ticket.status = TicketStatus.CLOSED;
    ticket.closedAt = new Date();

    await this.ticketRepository.save(ticket);
    logger.info(`工单已关闭: ${ticket.ticketNo}`);
    return ticket;
  }

  /**
   * 获取工单列表
   */
  async getTicketList(query: TicketListDTO): Promise<{
    tickets: CustomerServiceTicket[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const queryBuilder = this.ticketRepository.createQueryBuilder('ticket');

    // 筛选条件
    if (query.userId) {
      queryBuilder.andWhere('ticket.userId = :userId', { userId: query.userId });
    }
    if (query.assignedStaffId) {
      queryBuilder.andWhere('ticket.assignedStaffId = :assignedStaffId', {
        assignedStaffId: query.assignedStaffId,
      });
    }
    if (query.category) {
      queryBuilder.andWhere('ticket.category = :category', { category: query.category });
    }
    if (query.priority) {
      queryBuilder.andWhere('ticket.priority = :priority', { priority: query.priority });
    }
    if (query.status) {
      queryBuilder.andWhere('ticket.status = :status', { status: query.status });
    }

    // 排序：优先级高的在前，创建时间倒序
    queryBuilder.orderBy('ticket.priority', 'DESC');
    queryBuilder.addOrderBy('ticket.createdAt', 'DESC');

    // 分页
    const [tickets, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { tickets, total, page, pageSize };
  }

  /**
   * 获取工单详情
   */
  async getTicketById(id: string): Promise<CustomerServiceTicket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!ticket) throw new Error('工单不存在');
    return ticket;
  }
}

import { AppDataSource } from '../config/database';
import { QuickReply } from '../entities/QuickReply';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

/**
 * 创建快捷回复 DTO
 */
export interface CreateQuickReplyDTO {
  category: string;
  title: string;
  content: string;
  keywords?: string[];
}

/**
 * 更新快捷回复 DTO
 */
export interface UpdateQuickReplyDTO {
  category?: string;
  title?: string;
  content?: string;
  keywords?: string[];
  isActive?: boolean;
}

/**
 * 快捷回复列表查询 DTO
 */
export interface QuickReplyListDTO {
  page?: number;
  pageSize?: number;
  category?: string;
  keyword?: string;
  isActive?: boolean;
}

/**
 * 快捷回复服务
 */
export class QuickReplyService {
  private quickReplyRepository: Repository<QuickReply>;

  constructor() {
    this.quickReplyRepository = AppDataSource.getRepository(QuickReply);
  }

  /**
   * 创建快捷回复
   */
  async createQuickReply(data: CreateQuickReplyDTO): Promise<QuickReply> {
    const quickReply = this.quickReplyRepository.create({
      id: uuidv4(),
      category: data.category,
      title: data.title,
      content: data.content,
      keywords: data.keywords,
      usageCount: 0,
      isActive: true,
    });

    await this.quickReplyRepository.save(quickReply);
    logger.info(`快捷回复创建成功: ${quickReply.title}`);
    return quickReply;
  }

  /**
   * 更新快捷回复
   */
  async updateQuickReply(id: string, data: UpdateQuickReplyDTO): Promise<QuickReply> {
    const quickReply = await this.quickReplyRepository.findOne({ where: { id } });
    if (!quickReply) throw new Error('快捷回复不存在');

    if (data.category) quickReply.category = data.category;
    if (data.title) quickReply.title = data.title;
    if (data.content) quickReply.content = data.content;
    if (data.keywords) quickReply.keywords = data.keywords;
    if (data.isActive !== undefined) quickReply.isActive = data.isActive;

    await this.quickReplyRepository.save(quickReply);
    logger.info(`快捷回复已更新: ${quickReply.title}`);
    return quickReply;
  }

  /**
   * 删除快捷回复
   */
  async deleteQuickReply(id: string): Promise<void> {
    const quickReply = await this.quickReplyRepository.findOne({ where: { id } });
    if (!quickReply) throw new Error('快捷回复不存在');

    await this.quickReplyRepository.remove(quickReply);
    logger.info(`快捷回复已删除: ${quickReply.title}`);
  }

  /**
   * 获取快捷回复列表
   */
  async getQuickReplyList(query: QuickReplyListDTO): Promise<{
    quickReplies: QuickReply[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 50;

    const queryBuilder = this.quickReplyRepository.createQueryBuilder('quickReply');

    // 筛选条件
    if (query.category) {
      queryBuilder.andWhere('quickReply.category = :category', { category: query.category });
    }
    if (query.keyword) {
      queryBuilder.andWhere(
        '(quickReply.title LIKE :keyword OR quickReply.content LIKE :keyword)',
        { keyword: `%${query.keyword}%` }
      );
    }
    if (query.isActive !== undefined) {
      queryBuilder.andWhere('quickReply.isActive = :isActive', { isActive: query.isActive });
    }

    // 排序：使用次数倒序
    queryBuilder.orderBy('quickReply.usageCount', 'DESC');
    queryBuilder.addOrderBy('quickReply.createdAt', 'DESC');

    // 分页
    const [quickReplies, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { quickReplies, total, page, pageSize };
  }

  /**
   * 获取快捷回复详情
   */
  async getQuickReplyById(id: string): Promise<QuickReply> {
    const quickReply = await this.quickReplyRepository.findOne({ where: { id } });
    if (!quickReply) throw new Error('快捷回复不存在');
    return quickReply;
  }

  /**
   * 增加使用次数
   */
  async incrementUsageCount(id: string): Promise<void> {
    await this.quickReplyRepository.increment({ id }, 'usageCount', 1);
    logger.info(`快捷回复使用次数+1: ${id}`);
  }

  /**
   * 根据关键词搜索快捷回复
   */
  async searchByKeyword(keyword: string): Promise<QuickReply[]> {
    const quickReplies = await this.quickReplyRepository
      .createQueryBuilder('quickReply')
      .where('quickReply.isActive = :isActive', { isActive: true })
      .andWhere('quickReply.keywords LIKE :keyword', { keyword: `%${keyword}%` })
      .orderBy('quickReply.usageCount', 'DESC')
      .limit(10)
      .getMany();

    return quickReplies;
  }
}

import { AppDataSource } from '../config/database';
import { CommunityTopic } from '../entities/CommunityTopic';
import { logger } from '../utils/logger';
import { Repository } from 'typeorm';

/**
 * 创建话题 DTO
 */
export interface CreateTopicDTO {
  name: string;
  description?: string;
  coverImage?: string;
  sortOrder?: number;
}

/**
 * 更新话题 DTO
 */
export interface UpdateTopicDTO {
  name?: string;
  description?: string;
  coverImage?: string;
  sortOrder?: number;
  isHot?: boolean;
  isActive?: boolean;
}

/**
 * 话题列表查询 DTO
 */
export interface TopicListDTO {
  keyword?: string;
  isHot?: boolean;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * 社区话题服务
 */
export class CommunityTopicService {
  private topicRepository: Repository<CommunityTopic>;

  constructor() {
    this.topicRepository = AppDataSource.getRepository(CommunityTopic);
  }

  /**
   * 创建话题
   */
  async createTopic(data: CreateTopicDTO): Promise<CommunityTopic> {
    // 验证话题名称是否已存在
    const existing = await this.topicRepository.findOne({
      where: { name: data.name },
    });

    if (existing) {
      throw new Error('话题名称已存在');
    }

    const topic = this.topicRepository.create({
      ...data,
      postCount: 0,
      followCount: 0,
      isHot: false,
      isActive: true,
      sortOrder: data.sortOrder || 0,
    });

    await this.topicRepository.save(topic);

    logger.info(`创建话题成功: ${topic.id} - ${topic.name}`);
    return topic;
  }

  /**
   * 更新话题
   */
  async updateTopic(topicId: string, data: UpdateTopicDTO): Promise<CommunityTopic> {
    const topic = await this.getTopicById(topicId);

    // 如果修改名称，验证是否重复
    if (data.name && data.name !== topic.name) {
      const existing = await this.topicRepository.findOne({
        where: { name: data.name },
      });

      if (existing) {
        throw new Error('话题名称已存在');
      }
    }

    Object.assign(topic, data);
    await this.topicRepository.save(topic);

    logger.info(`更新话题成功: ${topicId}`);
    return topic;
  }

  /**
   * 删除话题
   */
  async deleteTopic(topicId: string): Promise<void> {
    const topic = await this.getTopicById(topicId);

    // 检查是否有帖子关联
    if (topic.postCount > 0) {
      throw new Error('该话题下有帖子，无法删除');
    }

    await this.topicRepository.remove(topic);

    logger.info(`删除话题成功: ${topicId}`);
  }

  /**
   * 增加帖子数量
   */
  async increasePostCount(topicId: string): Promise<void> {
    await this.topicRepository.increment({ id: topicId }, 'postCount', 1);
  }

  /**
   * 减少帖子数量
   */
  async decreasePostCount(topicId: string): Promise<void> {
    await this.topicRepository.decrement({ id: topicId }, 'postCount', 1);
  }

  /**
   * 增加关注数
   */
  async increaseFollowCount(topicId: string): Promise<void> {
    await this.topicRepository.increment({ id: topicId }, 'followCount', 1);
  }

  /**
   * 减少关注数
   */
  async decreaseFollowCount(topicId: string): Promise<void> {
    await this.topicRepository.decrement({ id: topicId }, 'followCount', 1);
  }

  /**
   * 获取话题列表
   */
  async getTopicList(query: TopicListDTO) {
    const { keyword, isHot, isActive, page = 1, pageSize = 20 } = query;

    const queryBuilder = this.topicRepository.createQueryBuilder('topic');

    if (keyword) {
      queryBuilder.andWhere('(topic.name LIKE :keyword OR topic.description LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    if (isHot !== undefined) {
      queryBuilder.andWhere('topic.isHot = :isHot', { isHot });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('topic.isActive = :isActive', { isActive });
    }

    // 排序：按排序权重和帖子数量
    queryBuilder.orderBy('topic.sortOrder', 'DESC');
    queryBuilder.addOrderBy('topic.postCount', 'DESC');

    const [list, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取话题详情
   */
  async getTopicById(topicId: string): Promise<CommunityTopic> {
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
    });

    if (!topic) {
      throw new Error('话题不存在');
    }

    return topic;
  }

  /**
   * 获取热门话题
   */
  async getHotTopics(limit = 10): Promise<CommunityTopic[]> {
    return await this.topicRepository.find({
      where: { isHot: true, isActive: true },
      order: { sortOrder: 'DESC', postCount: 'DESC' },
      take: limit,
    });
  }
}


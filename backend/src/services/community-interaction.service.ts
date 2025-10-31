import { AppDataSource } from '../config/database';
import {
  CommunityInteraction,
  TargetType,
  InteractionType,
} from '../entities/CommunityInteraction';
import { logger } from '../utils/logger';
import { Repository } from 'typeorm';
import { CommunityPostService } from './community-post.service';
import { CommunityCommentService } from './community-comment.service';

/**
 * 互动操作 DTO
 */
export interface InteractionDTO {
  userId: string;
  targetType: TargetType;
  targetId: string;
  interactionType: InteractionType;
}

/**
 * 社区互动服务
 */
export class CommunityInteractionService {
  private interactionRepository: Repository<CommunityInteraction>;
  private postService: CommunityPostService;
  private commentService: CommunityCommentService;

  constructor() {
    this.interactionRepository = AppDataSource.getRepository(CommunityInteraction);
    this.postService = new CommunityPostService();
    this.commentService = new CommunityCommentService();
  }

  /**
   * 点赞/取消点赞
   */
  async toggleLike(data: InteractionDTO): Promise<{ liked: boolean }> {
    const existing = await this.interactionRepository.findOne({
      where: {
        userId: data.userId,
        targetType: data.targetType,
        targetId: data.targetId,
        interactionType: InteractionType.LIKE,
      },
    });

    if (existing) {
      // 取消点赞
      await this.interactionRepository.remove(existing);

      // 减少点赞数
      if (data.targetType === TargetType.POST) {
        await this.postService.decreaseLikeCount(data.targetId);
      } else if (data.targetType === TargetType.COMMENT) {
        await this.commentService.decreaseLikeCount(data.targetId);
      }

      logger.info(`取消点赞成功: ${data.targetType} - ${data.targetId}`);
      return { liked: false };
    } else {
      // 点赞
      const interaction = this.interactionRepository.create({
        userId: data.userId,
        targetType: data.targetType,
        targetId: data.targetId,
        interactionType: InteractionType.LIKE,
      });

      await this.interactionRepository.save(interaction);

      // 增加点赞数
      if (data.targetType === TargetType.POST) {
        await this.postService.increaseLikeCount(data.targetId);
      } else if (data.targetType === TargetType.COMMENT) {
        await this.commentService.increaseLikeCount(data.targetId);
      }

      logger.info(`点赞成功: ${data.targetType} - ${data.targetId}`);
      return { liked: true };
    }
  }

  /**
   * 收藏/取消收藏
   */
  async toggleCollect(data: InteractionDTO): Promise<{ collected: boolean }> {
    if (data.targetType !== TargetType.POST) {
      throw new Error('只能收藏帖子');
    }

    const existing = await this.interactionRepository.findOne({
      where: {
        userId: data.userId,
        targetType: data.targetType,
        targetId: data.targetId,
        interactionType: InteractionType.COLLECT,
      },
    });

    if (existing) {
      // 取消收藏
      await this.interactionRepository.remove(existing);

      // 减少收藏数
      await this.postService.decreaseCollectCount(data.targetId);

      logger.info(`取消收藏成功: ${data.targetId}`);
      return { collected: false };
    } else {
      // 收藏
      const interaction = this.interactionRepository.create({
        userId: data.userId,
        targetType: data.targetType,
        targetId: data.targetId,
        interactionType: InteractionType.COLLECT,
      });

      await this.interactionRepository.save(interaction);

      // 增加收藏数
      await this.postService.increaseCollectCount(data.targetId);

      logger.info(`收藏成功: ${data.targetId}`);
      return { collected: true };
    }
  }

  /**
   * 分享
   */
  async share(data: InteractionDTO): Promise<void> {
    if (data.targetType !== TargetType.POST) {
      throw new Error('只能分享帖子');
    }

    // 记录分享
    const interaction = this.interactionRepository.create({
      userId: data.userId,
      targetType: data.targetType,
      targetId: data.targetId,
      interactionType: InteractionType.SHARE,
    });

    await this.interactionRepository.save(interaction);

    // 增加分享数
    await this.postService.increaseShareCount(data.targetId);

    logger.info(`分享成功: ${data.targetId}`);
  }

  /**
   * 检查用户是否点赞
   */
  async checkLiked(userId: string, targetType: TargetType, targetId: string): Promise<boolean> {
    const interaction = await this.interactionRepository.findOne({
      where: {
        userId,
        targetType,
        targetId,
        interactionType: InteractionType.LIKE,
      },
    });

    return !!interaction;
  }

  /**
   * 检查用户是否收藏
   */
  async checkCollected(userId: string, targetId: string): Promise<boolean> {
    const interaction = await this.interactionRepository.findOne({
      where: {
        userId,
        targetType: TargetType.POST,
        targetId,
        interactionType: InteractionType.COLLECT,
      },
    });

    return !!interaction;
  }

  /**
   * 获取用户收藏的帖子列表
   */
  async getUserCollectedPosts(userId: string, page = 1, pageSize = 20) {
    const queryBuilder = this.interactionRepository
      .createQueryBuilder('interaction')
      .where('interaction.userId = :userId', { userId })
      .andWhere('interaction.targetType = :targetType', { targetType: TargetType.POST })
      .andWhere('interaction.interactionType = :interactionType', {
        interactionType: InteractionType.COLLECT,
      })
      .orderBy('interaction.createdAt', 'DESC');

    const [list, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    // 获取帖子详情
    const postIds = list.map((item) => item.targetId);
    const posts = await Promise.all(
      postIds.map((id) => this.postService.getPostById(id).catch(() => null))
    );

    return {
      list: posts.filter((post) => post !== null),
      total,
      page,
      pageSize,
    };
  }
}


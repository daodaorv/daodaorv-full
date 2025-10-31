import { AppDataSource } from '../config/database';
import { UserFavorite, FavoriteType } from '../entities/UserFavorite';
import { logger } from '../utils/logger';

/**
 * 收藏DTO接口
 */
export interface CreateFavoriteDTO {
  userId: string;
  targetType: FavoriteType;
  targetId: string;
}

export interface FavoriteListDTO {
  userId: string;
  targetType?: FavoriteType;
  page?: number;
  pageSize?: number;
}

/**
 * 用户收藏服务
 */
export class UserFavoriteService {
  private favoriteRepository = AppDataSource.getRepository(UserFavorite);

  /**
   * 添加收藏
   */
  async addFavorite(data: CreateFavoriteDTO): Promise<UserFavorite> {
    try {
      logger.info('Adding favorite', { userId: data.userId, targetType: data.targetType, targetId: data.targetId });

      // 检查是否已收藏
      const existing = await this.favoriteRepository.findOne({
        where: {
          userId: data.userId,
          targetType: data.targetType,
          targetId: data.targetId,
        },
      });

      if (existing) {
        throw new Error('您已经收藏过此项目');
      }

      const favorite = this.favoriteRepository.create(data);
      await this.favoriteRepository.save(favorite);

      logger.info(`Favorite added successfully: ${favorite.id}`);
      return favorite;
    } catch (error) {
      logger.error('Failed to add favorite:', error);
      throw error;
    }
  }

  /**
   * 取消收藏
   */
  async removeFavorite(userId: string, targetType: FavoriteType, targetId: string): Promise<void> {
    try {
      logger.info('Removing favorite', { userId, targetType, targetId });

      const result = await this.favoriteRepository.delete({
        userId,
        targetType,
        targetId,
      });

      if (result.affected === 0) {
        throw new Error('收藏记录不存在');
      }

      logger.info(`Favorite removed successfully`);
    } catch (error) {
      logger.error('Failed to remove favorite:', error);
      throw error;
    }
  }

  /**
   * 检查是否已收藏
   */
  async isFavorited(userId: string, targetType: FavoriteType, targetId: string): Promise<boolean> {
    try {
      const favorite = await this.favoriteRepository.findOne({
        where: {
          userId,
          targetType,
          targetId,
        },
      });

      return !!favorite;
    } catch (error) {
      logger.error('Failed to check favorite status:', error);
      return false;
    }
  }

  /**
   * 获取用户收藏列表
   */
  async getFavoriteList(params: FavoriteListDTO): Promise<{
    list: UserFavorite[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const {
        userId,
        targetType,
        page = 1,
        pageSize = 20,
      } = params;

      logger.info('Getting favorite list', { params });

      const queryBuilder = this.favoriteRepository.createQueryBuilder('favorite');

      // 筛选条件
      queryBuilder.andWhere('favorite.userId = :userId', { userId });

      if (targetType) {
        queryBuilder.andWhere('favorite.targetType = :targetType', { targetType });
      }

      // 分页
      queryBuilder.skip((page - 1) * pageSize).take(pageSize);

      // 排序
      queryBuilder.orderBy('favorite.createdAt', 'DESC');

      const [list, total] = await queryBuilder.getManyAndCount();

      return {
        list,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error('Failed to get favorite list:', error);
      throw error;
    }
  }

  /**
   * 获取收藏数量
   */
  async getFavoriteCount(userId: string, targetType?: FavoriteType): Promise<number> {
    try {
      const queryBuilder = this.favoriteRepository.createQueryBuilder('favorite');

      queryBuilder.andWhere('favorite.userId = :userId', { userId });

      if (targetType) {
        queryBuilder.andWhere('favorite.targetType = :targetType', { targetType });
      }

      return await queryBuilder.getCount();
    } catch (error) {
      logger.error('Failed to get favorite count:', error);
      return 0;
    }
  }

  /**
   * 批量检查收藏状态
   */
  async batchCheckFavoriteStatus(
    userId: string,
    targetType: FavoriteType,
    targetIds: string[]
  ): Promise<string[]> {
    try {
      const favorites = await this.favoriteRepository.find({
        where: {
          userId,
          targetType,
          targetId: targetIds,
        },
        select: ['targetId'],
      });

      return favorites.map(f => f.targetId);
    } catch (error) {
      logger.error('Failed to batch check favorite status:', error);
      return [];
    }
  }
}
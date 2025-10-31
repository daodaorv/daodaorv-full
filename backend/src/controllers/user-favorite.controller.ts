import {
  UserFavoriteService,
  CreateFavoriteDTO,
  FavoriteListDTO,
} from '../services/user-favorite.service';
import { FavoriteType } from '../entities/UserFavorite';
import { logger } from '../utils/logger';

/**
 * 用户收藏控制器
 */
export class UserFavoriteController {
  private favoriteService = new UserFavoriteService();

  /**
   * 添加收藏
   */
  addFavorite = async (ctx: any) => {
    try {
      const userId = ctx.state.user?.userId;
      const { type, targetId } = ctx.request.body;

      // 参数验证
      if (!type || !targetId) {
        ctx.error(400, '收藏类型和目标ID为必填项');
        return;
      }

      if (!Object.values(FavoriteType).includes(type)) {
        ctx.error(400, '收藏类型不合法');
        return;
      }

      const data: CreateFavoriteDTO = {
        userId,
        targetType: type,
        targetId,
      };

      const favorite = await this.favoriteService.addFavorite(data);

      ctx.success(favorite, '收藏成功');
    } catch (error: any) {
      logger.error('Failed to add favorite:', error);
      ctx.error(400, error.message || '收藏失败');
    }
  };

  /**
   * 取消收藏
   */
  removeFavorite = async (ctx: any) => {
    try {
      const userId = ctx.state.user?.userId;
      const { type, targetId } = ctx.query;

      // 参数验证
      if (!type || !targetId) {
        ctx.error(400, '收藏类型和目标ID为必填项');
        return;
      }

      if (!Object.values(FavoriteType).includes(type)) {
        ctx.error(400, '收藏类型不合法');
        return;
      }

      await this.favoriteService.removeFavorite(userId, type, targetId);

      ctx.success(null, '取消收藏成功');
    } catch (error: any) {
      logger.error('Failed to remove favorite:', error);
      ctx.error(400, error.message || '取消收藏失败');
    }
  };

  /**
   * 取消收藏（通过路径参数）
   */
  removeFavoriteById = async (ctx: any) => {
    try {
      const userId = ctx.state.user?.userId;
      const { id } = ctx.params;
      const { type } = ctx.query;

      // 参数验证
      if (!type) {
        ctx.error(400, '收藏类型为必填项');
        return;
      }

      if (!Object.values(FavoriteType).includes(type)) {
        ctx.error(400, '收藏类型不合法');
        return;
      }

      await this.favoriteService.removeFavorite(userId, type, id);

      ctx.success(null, '取消收藏成功');
    } catch (error: any) {
      logger.error('Failed to remove favorite by id:', error);
      ctx.error(400, error.message || '取消收藏失败');
    }
  };

  /**
   * 获取收藏列表
   */
  getFavoriteList = async (ctx: any) => {
    try {
      const userId = ctx.state.user?.userId;
      const { type, page, pageSize } = ctx.query;

      const params: FavoriteListDTO = {
        userId,
        targetType: type ? type : undefined,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
      };

      const result = await this.favoriteService.getFavoriteList(params);

      ctx.success(result, '获取收藏列表成功');
    } catch (error: any) {
      logger.error('Failed to get favorite list:', error);
      ctx.error(500, error.message || '获取收藏列表失败');
    }
  };

  /**
   * 检查收藏状态
   */
  checkFavoriteStatus = async (ctx: any) => {
    try {
      const userId = ctx.state.user?.userId;
      const { type, targetId } = ctx.query;

      // 参数验证
      if (!type || !targetId) {
        ctx.error(400, '收藏类型和目标ID为必填项');
        return;
      }

      if (!Object.values(FavoriteType).includes(type)) {
        ctx.error(400, '收藏类型不合法');
        return;
      }

      const isFavorited = await this.favoriteService.isFavorited(userId, type, targetId);

      ctx.success({ isFavorited }, '检查收藏状态成功');
    } catch (error: any) {
      logger.error('Failed to check favorite status:', error);
      ctx.error(500, error.message || '检查收藏状态失败');
    }
  };

  /**
   * 批量检查收藏状态
   */
  batchCheckFavoriteStatus = async (ctx: any) => {
    try {
      const userId = ctx.state.user?.userId;
      const { type, targetIds } = ctx.request.body;

      // 参数验证
      if (!type || !targetIds || !Array.isArray(targetIds)) {
        ctx.error(400, '收藏类型和目标ID列表为必填项');
        return;
      }

      if (!Object.values(FavoriteType).includes(type)) {
        ctx.error(400, '收藏类型不合法');
        return;
      }

      const favoritedIds = await this.favoriteService.batchCheckFavoriteStatus(userId, type, targetIds);

      ctx.success({ favoritedIds }, '批量检查收藏状态成功');
    } catch (error: any) {
      logger.error('Failed to batch check favorite status:', error);
      ctx.error(500, error.message || '批量检查收藏状态失败');
    }
  };

  /**
   * 获取收藏数量
   */
  getFavoriteCount = async (ctx: any) => {
    try {
      const userId = ctx.state.user?.userId;
      const { type } = ctx.query;

      const count = await this.favoriteService.getFavoriteCount(userId, type);

      ctx.success({ count }, '获取收藏数量成功');
    } catch (error: any) {
      logger.error('Failed to get favorite count:', error);
      ctx.error(500, error.message || '获取收藏数量失败');
    }
  };
}
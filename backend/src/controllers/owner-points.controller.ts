import { OwnerPointsService, UsePointsDTO, EarnPointsDTO } from '../services/owner-points.service';
import { PointsStatus } from '../entities/OwnerPoints';
import { TransactionType, PointsSource } from '../entities/PointsTransaction';
import { logger } from '../utils/logger';

/**
 * 车主积分控制器
 */
export class OwnerPointsController {
  private pointsService = new OwnerPointsService();

  /**
   * 获取我的积分（用户端）
   */
  getMyPoints = async (ctx: any) => {
    try {
      const userId = ctx.state.user.id;

      const account = await this.pointsService.getMyPoints(userId);

      if (!account) {
        ctx.success(
          {
            balance: 0,
            totalEarned: 0,
            totalUsed: 0,
            status: 'inactive',
            message: '您还没有积分账户',
          },
          '查询成功'
        );
        return;
      }

      ctx.success(account, '查询成功');
    } catch (error: any) {
      logger.error('Failed to get my points:', error);
      ctx.error(500, error.message || '获取积分失败');
    }
  };

  /**
   * 获取积分流水（用户端）
   */
  getPointsTransactions = async (ctx: any) => {
    try {
      const userId = ctx.state.user.id;
      const { page = 1, pageSize = 20, type, source } = ctx.query;

      const result = await this.pointsService.getPointsTransactions(userId, {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        type: type as TransactionType,
        source: source as PointsSource,
      });

      ctx.success(result, '查询成功');
    } catch (error: any) {
      logger.error('Failed to get points transactions:', error);
      ctx.error(500, error.message || '获取积分流水失败');
    }
  };

  /**
   * 使用积分（用户端）
   */
  usePoints = async (ctx: any) => {
    try {
      const userId = ctx.state.user.id;
      const { points, relatedId, description } = ctx.request.body;

      // 参数验证
      if (!points || points <= 0) {
        ctx.error(400, '积分数量必须大于0');
        return;
      }

      const data: UsePointsDTO = {
        userId,
        points: parseInt(points),
        relatedId,
        description,
      };

      const transaction = await this.pointsService.usePoints(data);

      ctx.success(transaction, '积分使用成功');
    } catch (error: any) {
      logger.error('Failed to use points:', error);
      ctx.error(500, error.message || '使用积分失败');
    }
  };

  /**
   * 获取所有积分账户（管理端）
   */
  getAllPoints = async (ctx: any) => {
    try {
      const { page = 1, pageSize = 20, status, keyword } = ctx.query;

      const result = await this.pointsService.getAllPoints({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        status: status as PointsStatus,
        keyword,
      });

      ctx.success(result, '查询成功');
    } catch (error: any) {
      logger.error('Failed to get all points:', error);
      ctx.error(500, error.message || '获取积分账户失败');
    }
  };

  /**
   * 发放积分（管理端）
   */
  grantPoints = async (ctx: any) => {
    try {
      const { userId, amount, source, relatedId, description, ratio } = ctx.request.body;

      // 参数验证
      if (!userId) {
        ctx.error(400, '用户ID为必填项');
        return;
      }

      if (!amount || amount <= 0) {
        ctx.error(400, '金额必须大于0');
        return;
      }

      const data: EarnPointsDTO = {
        userId,
        amount: parseFloat(amount),
        source: source || PointsSource.ACTIVITY,
        relatedId,
        description: description || '管理员发放积分',
        ratio: ratio ? parseFloat(ratio) : undefined,
      };

      const transaction = await this.pointsService.grantPoints(data);

      ctx.success(transaction, '积分发放成功');
    } catch (error: any) {
      logger.error('Failed to grant points:', error);
      ctx.error(500, error.message || '发放积分失败');
    }
  };

  /**
   * 获取积分统计（管理端）
   */
  getPointsStats = async (ctx: any) => {
    try {
      const stats = await this.pointsService.getPointsStats();

      ctx.success(stats, '查询成功');
    } catch (error: any) {
      logger.error('Failed to get points stats:', error);
      ctx.error(500, error.message || '获取积分统计失败');
    }
  };

  /**
   * 获取用户积分详情（管理端）
   */
  getUserPoints = async (ctx: any) => {
    try {
      const { userId } = ctx.params;

      if (!userId) {
        ctx.error(400, '用户ID为必填项');
        return;
      }

      const account = await this.pointsService.getMyPoints(userId);

      if (!account) {
        ctx.error(404, '积分账户不存在');
        return;
      }

      ctx.success(account, '查询成功');
    } catch (error: any) {
      logger.error('Failed to get user points:', error);
      ctx.error(500, error.message || '获取用户积分失败');
    }
  };

  /**
   * 获取用户积分流水（管理端）
   */
  getUserPointsTransactions = async (ctx: any) => {
    try {
      const { userId } = ctx.params;
      const { page = 1, pageSize = 20, type, source } = ctx.query;

      if (!userId) {
        ctx.error(400, '用户ID为必填项');
        return;
      }

      const result = await this.pointsService.getPointsTransactions(userId, {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        type: type as TransactionType,
        source: source as PointsSource,
      });

      ctx.success(result, '查询成功');
    } catch (error: any) {
      logger.error('Failed to get user points transactions:', error);
      ctx.error(500, error.message || '获取用户积分流水失败');
    }
  };
}


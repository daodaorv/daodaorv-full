import {
  ProfitSharingService,
  CalculateProfitSharingDTO,
  ProfitSharingListDTO,
} from '../services/profit-sharing.service';
import { ProfitSharingStatus } from '../entities/ProfitSharing';
import { logger } from '../utils/logger';

/**
 * 分润控制器
 */
export class ProfitSharingController {
  private profitSharingService = new ProfitSharingService();

  /**
   * 获取我的分润记录（用户端）
   */
  getMyProfitSharings = async (ctx: any) => {
    try {
      const userId = ctx.state.user.id;
      const { page, pageSize, period, status } = ctx.query;

      const params: ProfitSharingListDTO = {
        userId,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 10,
        period,
        status: status as ProfitSharingStatus,
      };

      const result = await this.profitSharingService.getMyProfitSharings(params);

      ctx.success(result, '获取我的分润记录成功');
    } catch (error: any) {
      logger.error('Failed to get my profit sharings:', error);
      ctx.error(500, error.message || '获取我的分润记录失败');
    }
  };

  /**
   * 获取分润详情（用户端）
   */
  getProfitSharingById = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user.id;

      const profitSharing = await this.profitSharingService.getProfitSharingById(id);

      if (!profitSharing) {
        ctx.error(404, '分润记录不存在');
        return;
      }

      // 验证分润所有权
      if (profitSharing.userId !== userId) {
        ctx.error(403, '无权访问该分润记录');
        return;
      }

      ctx.success(profitSharing, '获取分润详情成功');
    } catch (error: any) {
      logger.error('Failed to get profit sharing details:', error);
      ctx.error(500, error.message || '获取分润详情失败');
    }
  };

  /**
   * 计算分润（管理端）
   */
  calculateProfitSharing = async (ctx: any) => {
    try {
      const { projectId, period, insuranceFee, maintenanceFee, cleaningFee } = ctx.request.body;

      // 参数验证
      if (!projectId || !period) {
        ctx.error(400, '项目ID和期间为必填项');
        return;
      }

      // 验证期间格式
      if (!/^\d{4}-\d{2}$/.test(period)) {
        ctx.error(400, '期间格式错误，应为 YYYY-MM');
        return;
      }

      const data: CalculateProfitSharingDTO = {
        projectId,
        period,
        insuranceFee: insuranceFee ? parseFloat(insuranceFee) : 0,
        maintenanceFee: maintenanceFee ? parseFloat(maintenanceFee) : 0,
        cleaningFee: cleaningFee ? parseFloat(cleaningFee) : 0,
      };

      const profitSharings = await this.profitSharingService.calculateProfitSharing(data);

      ctx.success(
        {
          count: profitSharings.length,
          profitSharings,
        },
        '分润计算成功'
      );
    } catch (error: any) {
      logger.error('Failed to calculate profit sharing:', error);
      ctx.error(500, error.message || '计算分润失败');
    }
  };

  /**
   * 发放分润（管理端）
   */
  distributeProfitSharing = async (ctx: any) => {
    try {
      const { period } = ctx.request.body;

      // 参数验证
      if (!period) {
        ctx.error(400, '期间为必填项');
        return;
      }

      // 验证期间格式
      if (!/^\d{4}-\d{2}$/.test(period)) {
        ctx.error(400, '期间格式错误，应为 YYYY-MM');
        return;
      }

      const successCount = await this.profitSharingService.distributeProfitSharing(period);

      ctx.success(
        {
          period,
          successCount,
        },
        '分润发放成功'
      );
    } catch (error: any) {
      logger.error('Failed to distribute profit sharing:', error);
      ctx.error(500, error.message || '发放分润失败');
    }
  };

  /**
   * 获取所有分润记录（管理端）
   */
  getAllProfitSharings = async (ctx: any) => {
    try {
      const { page, pageSize, period, status, projectId } = ctx.query;

      const params = {
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 10,
        period,
        status: status as ProfitSharingStatus,
        projectId,
      };

      const result = await this.profitSharingService.getAllProfitSharings(params);

      ctx.success(result, '获取所有分润记录成功');
    } catch (error: any) {
      logger.error('Failed to get all profit sharings:', error);
      ctx.error(500, error.message || '获取所有分润记录失败');
    }
  };

  /**
   * 获取分润统计（管理端）
   */
  getProfitSharingStats = async (ctx: any) => {
    try {
      const stats = await this.profitSharingService.getProfitSharingStats();

      ctx.success(stats, '获取分润统计成功');
    } catch (error: any) {
      logger.error('Failed to get profit sharing stats:', error);
      ctx.error(500, error.message || '获取分润统计失败');
    }
  };
}


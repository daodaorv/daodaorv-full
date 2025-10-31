import { TourBatchService } from '../services/tour-batch.service';
import { BatchStatus } from '../entities/TourBatch';
import { logger } from '../utils/logger';

/**
 * 出发批次控制器
 */
export class TourBatchController {
  private service = new TourBatchService();

  /**
   * 获取路线的可订批次（用户端）
   * GET /api/tours/routes/:routeId/batches
   */
  getAvailableBatches = async (ctx: any) => {
    try {
      const { routeId } = ctx.params;

      const batches = await this.service.getAvailableBatches(routeId);

      ctx.success(batches, '获取可订批次成功');
    } catch (error: any) {
      logger.error('获取可订批次失败:', error);
      ctx.error(500, error.message || '获取可订批次失败');
    }
  };

  /**
   * 创建批次（管理端）
   * POST /api/admin/tours/batches
   */
  adminCreateBatch = async (ctx: any) => {
    try {
      const data = ctx.request.body;

      // 验证必填字段
      if (!data.routeId || !data.departureDate || !data.stock) {
        ctx.error(400, '缺少必填字段');
        return;
      }

      const batch = await this.service.createBatch(data);

      ctx.success(batch, '创建出发批次成功');
    } catch (error: any) {
      logger.error('创建出发批次失败:', error);
      ctx.error(500, error.message || '创建出发批次失败');
    }
  };

  /**
   * 更新批次（管理端）
   * PUT /api/admin/tours/batches/:id
   */
  adminUpdateBatch = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const data = ctx.request.body;

      const batch = await this.service.updateBatch(id, data);

      ctx.success(batch, '更新出发批次成功');
    } catch (error: any) {
      logger.error('更新出发批次失败:', error);
      ctx.error(500, error.message || '更新出发批次失败');
    }
  };

  /**
   * 更新批次状态（管理端）
   * PUT /api/admin/tours/batches/:id/status
   */
  adminUpdateBatchStatus = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const { status } = ctx.request.body;

      if (!status || !Object.values(BatchStatus).includes(status)) {
        ctx.error(400, '无效的状态值');
        return;
      }

      const batch = await this.service.updateBatchStatus(id, status);

      ctx.success(batch, '更新批次状态成功');
    } catch (error: any) {
      logger.error('更新批次状态失败:', error);
      ctx.error(500, error.message || '更新批次状态失败');
    }
  };

  /**
   * 获取批次列表（管理端）
   * GET /api/admin/tours/batches
   */
  adminGetBatches = async (ctx: any) => {
    try {
      const { page, pageSize, routeId, status, startDate, endDate } =
        ctx.query;

      const result = await this.service.getBatchList({
        page: page ? parseInt(page) : undefined,
        pageSize: pageSize ? parseInt(pageSize) : undefined,
        routeId,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      ctx.success(result, '获取出发批次列表成功');
    } catch (error: any) {
      logger.error('获取出发批次列表失败:', error);
      ctx.error(500, error.message || '获取出发批次列表失败');
    }
  };

  /**
   * 获取批次详情（管理端）
   * GET /api/admin/tours/batches/:id
   */
  adminGetBatchById = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      const batch = await this.service.getBatchById(id);

      ctx.success(batch, '获取出发批次详情成功');
    } catch (error: any) {
      logger.error('获取出发批次详情失败:', error);
      ctx.error(500, error.message || '获取出发批次详情失败');
    }
  };

  /**
   * 删除批次（管理端）
   * DELETE /api/admin/tours/batches/:id
   */
  adminDeleteBatch = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      await this.service.deleteBatch(id);

      ctx.success(null, '删除出发批次成功');
    } catch (error: any) {
      logger.error('删除出发批次失败:', error);
      ctx.error(500, error.message || '删除出发批次失败');
    }
  };
}


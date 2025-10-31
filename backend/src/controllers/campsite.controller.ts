import {
  CampsiteService,
  CreateCampsiteDTO,
  UpdateCampsiteDTO,
  CampsiteListDTO,
} from '../services/campsite.service';
import { BookingMode, CampsiteStatus } from '../entities/Campsite';
import { logger } from '../utils/logger';

/**
 * 营地控制器
 */
export class CampsiteController {
  private campsiteService = new CampsiteService();

  /**
   * 获取营地列表（用户端）
   * GET /api/campsites
   */
  getCampsites = async (ctx: any) => {
    try {
      const { page, pageSize, city, keyword, sortBy, sortOrder } = ctx.query;

      const params: CampsiteListDTO = {
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
        city,
        status: CampsiteStatus.ENABLED, // 用户端只显示启用的营地
        keyword,
        sortBy: sortBy as 'createdAt' | 'averageRating' | 'bookingCount' | 'sortOrder',
        sortOrder: sortOrder as 'ASC' | 'DESC',
      };

      const result = await this.campsiteService.getCampsiteList(params);

      ctx.success(result, '获取营地列表成功');
    } catch (error: any) {
      logger.error('Failed to get campsites:', error);
      ctx.error(500, error.message || '获取营地列表失败');
    }
  };

  /**
   * 获取营地详情（用户端）
   * GET /api/campsites/:id
   */
  getCampsiteById = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      const campsite = await this.campsiteService.getCampsiteDetail(id);

      if (!campsite) {
        ctx.error(404, '营地不存在');
        return;
      }

      // 用户端只能查看启用的营地
      if (campsite.status !== CampsiteStatus.ENABLED) {
        ctx.error(404, '营地不存在');
        return;
      }

      ctx.success(campsite, '获取营地详情成功');
    } catch (error: any) {
      logger.error('Failed to get campsite details:', error);
      ctx.error(500, error.message || '获取营地详情失败');
    }
  };

  // ==================== 管理端 API ====================

  /**
   * 创建营地（管理端）
   * POST /api/admin/campsites
   */
  adminCreateCampsite = async (ctx: any) => {
    try {
      const data: CreateCampsiteDTO = ctx.request.body;

      // 验证必填字段
      if (!data.name || !data.city || !data.address) {
        ctx.error(400, '营地名称、城市、地址为必填项');
        return;
      }

      const campsite = await this.campsiteService.createCampsite(data);

      ctx.success(campsite, '创建营地成功');
    } catch (error: any) {
      logger.error('Failed to create campsite:', error);
      ctx.error(500, error.message || '创建营地失败');
    }
  };

  /**
   * 更新营地（管理端）
   * PUT /api/admin/campsites/:id
   */
  adminUpdateCampsite = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const data: UpdateCampsiteDTO = ctx.request.body;

      const campsite = await this.campsiteService.updateCampsite(id, data);

      ctx.success(campsite, '更新营地成功');
    } catch (error: any) {
      logger.error('Failed to update campsite:', error);
      ctx.error(500, error.message || '更新营地失败');
    }
  };

  /**
   * 切换预订模式（管理端）
   * PUT /api/admin/campsites/:id/mode
   */
  adminSwitchBookingMode = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const { mode } = ctx.request.body;

      if (!mode || !Object.values(BookingMode).includes(mode)) {
        ctx.error(400, '无效的预订模式');
        return;
      }

      const campsite = await this.campsiteService.switchBookingMode(id, mode);

      ctx.success(campsite, '切换预订模式成功');
    } catch (error: any) {
      logger.error('Failed to switch booking mode:', error);
      ctx.error(500, error.message || '切换预订模式失败');
    }
  };

  /**
   * 切换营地状态（管理端）
   * PUT /api/admin/campsites/:id/status
   */
  adminSwitchStatus = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const { status } = ctx.request.body;

      if (!status || !Object.values(CampsiteStatus).includes(status)) {
        ctx.error(400, '无效的营地状态');
        return;
      }

      const campsite = await this.campsiteService.switchStatus(id, status);

      ctx.success(campsite, '切换营地状态成功');
    } catch (error: any) {
      logger.error('Failed to switch campsite status:', error);
      ctx.error(500, error.message || '切换营地状态失败');
    }
  };

  /**
   * 获取所有营地（管理端）
   * GET /api/admin/campsites
   */
  adminGetCampsites = async (ctx: any) => {
    try {
      const { page, pageSize, city, bookingMode, status, keyword, sortBy, sortOrder } =
        ctx.query;

      const params: CampsiteListDTO = {
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
        city,
        bookingMode: bookingMode as BookingMode,
        status: status as CampsiteStatus,
        keyword,
        sortBy: sortBy as 'createdAt' | 'averageRating' | 'bookingCount' | 'sortOrder',
        sortOrder: sortOrder as 'ASC' | 'DESC',
      };

      const result = await this.campsiteService.getCampsiteList(params);

      ctx.success(result, '获取营地列表成功');
    } catch (error: any) {
      logger.error('Failed to get campsites:', error);
      ctx.error(500, error.message || '获取营地列表失败');
    }
  };

  /**
   * 获取营地详情（管理端）
   * GET /api/admin/campsites/:id
   */
  adminGetCampsiteById = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      const campsite = await this.campsiteService.getCampsiteDetail(id);

      if (!campsite) {
        ctx.error(404, '营地不存在');
        return;
      }

      ctx.success(campsite, '获取营地详情成功');
    } catch (error: any) {
      logger.error('Failed to get campsite details:', error);
      ctx.error(500, error.message || '获取营地详情失败');
    }
  };

  /**
   * 删除营地（管理端）
   * DELETE /api/admin/campsites/:id
   */
  adminDeleteCampsite = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      await this.campsiteService.deleteCampsite(id);

      ctx.success(null, '删除营地成功');
    } catch (error: any) {
      logger.error('Failed to delete campsite:', error);
      ctx.error(500, error.message || '删除营地失败');
    }
  };
}


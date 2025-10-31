import {
  CampsiteSpotService,
  CreateSpotDTO,
  UpdateSpotDTO,
  CheckAvailabilityDTO,
} from '../services/campsite-spot.service';
import { SpotType } from '../entities/CampsiteSpot';
import { logger } from '../utils/logger';

/**
 * 营位控制器
 */
export class CampsiteSpotController {
  private spotService = new CampsiteSpotService();

  /**
   * 获取营地的营位列表（用户端）
   * GET /api/campsites/:campsiteId/spots
   */
  getSpotsByCampsite = async (ctx: any) => {
    try {
      const { campsiteId } = ctx.params;

      const spots = await this.spotService.getSpotsByCampsite(campsiteId);

      // 用户端只返回可用的营位
      const availableSpots = spots.filter(spot => spot.isAvailable);

      ctx.success(availableSpots, '获取营位列表成功');
    } catch (error: any) {
      logger.error('Failed to get spots:', error);
      ctx.error(500, error.message || '获取营位列表失败');
    }
  };

  /**
   * 检查营位可用性（用户端）
   * POST /api/campsites/spots/check-availability
   */
  checkAvailability = async (ctx: any) => {
    try {
      const { campsiteId, spotType, checkInDate, checkOutDate, quantity } = ctx.request.body;

      if (!campsiteId || !spotType || !checkInDate || !checkOutDate || !quantity) {
        ctx.error(400, '缺少必填参数');
        return;
      }

      const params: CheckAvailabilityDTO = {
        campsiteId,
        spotType: spotType as SpotType,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        quantity: parseInt(quantity),
      };

      const result = await this.spotService.checkAvailability(params);

      ctx.success(result, '检查营位可用性成功');
    } catch (error: any) {
      logger.error('Failed to check availability:', error);
      ctx.error(500, error.message || '检查营位可用性失败');
    }
  };

  // ==================== 管理端 API ====================

  /**
   * 创建营位（管理端）
   * POST /api/admin/campsites/spots
   */
  adminCreateSpot = async (ctx: any) => {
    try {
      const data: CreateSpotDTO = ctx.request.body;

      // 验证必填字段
      if (!data.campsiteId || !data.spotType || !data.name || !data.quantity || !data.pricePerNight) {
        ctx.error(400, '营地ID、营位类型、名称、数量、价格为必填项');
        return;
      }

      const spot = await this.spotService.createSpot(data);

      ctx.success(spot, '创建营位成功');
    } catch (error: any) {
      logger.error('Failed to create spot:', error);
      ctx.error(500, error.message || '创建营位失败');
    }
  };

  /**
   * 更新营位（管理端）
   * PUT /api/admin/campsites/spots/:id
   */
  adminUpdateSpot = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const data: UpdateSpotDTO = ctx.request.body;

      const spot = await this.spotService.updateSpot(id, data);

      ctx.success(spot, '更新营位成功');
    } catch (error: any) {
      logger.error('Failed to update spot:', error);
      ctx.error(500, error.message || '更新营位失败');
    }
  };

  /**
   * 获取营地的所有营位（管理端）
   * GET /api/admin/campsites/:campsiteId/spots
   */
  adminGetSpotsByCampsite = async (ctx: any) => {
    try {
      const { campsiteId } = ctx.params;

      const spots = await this.spotService.getSpotsByCampsite(campsiteId);

      ctx.success(spots, '获取营位列表成功');
    } catch (error: any) {
      logger.error('Failed to get spots:', error);
      ctx.error(500, error.message || '获取营位列表失败');
    }
  };

  /**
   * 获取营位详情（管理端）
   * GET /api/admin/campsites/spots/:id
   */
  adminGetSpotById = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      const spot = await this.spotService.getSpotById(id);

      ctx.success(spot, '获取营位详情成功');
    } catch (error: any) {
      logger.error('Failed to get spot details:', error);
      ctx.error(500, error.message || '获取营位详情失败');
    }
  };

  /**
   * 删除营位（管理端）
   * DELETE /api/admin/campsites/spots/:id
   */
  adminDeleteSpot = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      await this.spotService.deleteSpot(id);

      ctx.success(null, '删除营位成功');
    } catch (error: any) {
      logger.error('Failed to delete spot:', error);
      ctx.error(500, error.message || '删除营位失败');
    }
  };
}


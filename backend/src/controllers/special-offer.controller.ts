import {
  SpecialOfferService,
  CreateSpecialOfferDTO,
  UpdateSpecialOfferDTO,
  SpecialOfferListDTO,
} from '../services/special-offer.service';
import { SpecialOfferStatus } from '../entities/SpecialOffer';
import { logger } from '../utils/logger';

/**
 * 特惠套餐控制器
 */
export class SpecialOfferController {
  private service = new SpecialOfferService();

  /**
   * 创建特惠套餐（管理端）
   * POST /api/admin/special-offers
   */
  adminCreateOffer = async (ctx: any) => {
    try {
      const data: CreateSpecialOfferDTO = ctx.request.body;

      // 验证必填字段
      if (
        !data.name ||
        !data.pickupCity ||
        !data.returnCity ||
        !data.fixedDays ||
        !data.originalPrice ||
        !data.offerPrice ||
        !data.vehicleModelIds ||
        !data.startDate ||
        !data.endDate ||
        !data.totalStock
      ) {
        ctx.error(400, '缺少必填字段');
        return;
      }

      const offer = await this.service.createOffer(data);

      ctx.success(offer, '创建特惠套餐成功');
    } catch (error: any) {
      logger.error('创建特惠套餐失败:', error);
      ctx.error(500, error.message || '创建特惠套餐失败');
    }
  };

  /**
   * 更新特惠套餐（管理端）
   * PUT /api/admin/special-offers/:id
   */
  adminUpdateOffer = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const data: UpdateSpecialOfferDTO = ctx.request.body;

      const offer = await this.service.updateOffer(id, data);

      ctx.success(offer, '更新特惠套餐成功');
    } catch (error: any) {
      logger.error('更新特惠套餐失败:', error);
      ctx.error(500, error.message || '更新特惠套餐失败');
    }
  };

  /**
   * 获取特惠套餐列表（管理端）
   * GET /api/admin/special-offers
   */
  adminGetOfferList = async (ctx: any) => {
    try {
      const params: SpecialOfferListDTO = {
        page: ctx.query.page ? parseInt(ctx.query.page) : undefined,
        pageSize: ctx.query.pageSize ? parseInt(ctx.query.pageSize) : undefined,
        pickupCity: ctx.query.pickupCity,
        returnCity: ctx.query.returnCity,
        status: ctx.query.status,
        keyword: ctx.query.keyword,
        sortBy: ctx.query.sortBy,
        sortOrder: ctx.query.sortOrder,
      };

      const result = await this.service.getOfferList(params);

      ctx.success(result, '获取特惠套餐列表成功');
    } catch (error: any) {
      logger.error('获取特惠套餐列表失败:', error);
      ctx.error(500, error.message || '获取特惠套餐列表失败');
    }
  };

  /**
   * 获取特惠套餐详情（管理端）
   * GET /api/admin/special-offers/:id
   */
  adminGetOfferDetail = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      const offer = await this.service.getOfferById(id);

      ctx.success(offer, '获取特惠套餐详情成功');
    } catch (error: any) {
      logger.error('获取特惠套餐详情失败:', error);
      ctx.error(500, error.message || '获取特惠套餐详情失败');
    }
  };

  /**
   * 切换套餐状态（管理端）
   * PUT /api/admin/special-offers/:id/status
   */
  adminSwitchStatus = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const { status } = ctx.request.body;

      if (!status || !Object.values(SpecialOfferStatus).includes(status)) {
        ctx.error(400, '无效的状态值');
        return;
      }

      const offer = await this.service.switchStatus(id, status);

      ctx.success(offer, '切换套餐状态成功');
    } catch (error: any) {
      logger.error('切换套餐状态失败:', error);
      ctx.error(500, error.message || '切换套餐状态失败');
    }
  };

  /**
   * 删除特惠套餐（管理端）
   * DELETE /api/admin/special-offers/:id
   */
  adminDeleteOffer = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      await this.service.deleteOffer(id);

      ctx.success(null, '删除特惠套餐成功');
    } catch (error: any) {
      logger.error('删除特惠套餐失败:', error);
      ctx.error(500, error.message || '删除特惠套餐失败');
    }
  };

  /**
   * 获取特惠套餐列表（用户端）
   * GET /api/special-offers
   */
  getOfferList = async (ctx: any) => {
    try {
      const params: SpecialOfferListDTO = {
        page: ctx.query.page ? parseInt(ctx.query.page) : undefined,
        pageSize: ctx.query.pageSize ? parseInt(ctx.query.pageSize) : undefined,
        pickupCity: ctx.query.pickupCity,
        returnCity: ctx.query.returnCity,
        keyword: ctx.query.keyword,
        sortBy: ctx.query.sortBy,
        sortOrder: ctx.query.sortOrder,
        // 用户端只显示启用的套餐
        status: SpecialOfferStatus.ACTIVE,
      };

      const result = await this.service.getOfferList(params);

      // 过滤掉已过期的套餐
      const now = new Date();
      const activeOffers = result.offers.filter((offer) => new Date(offer.endDate) >= now);

      ctx.success(
        {
          ...result,
          offers: activeOffers,
          total: activeOffers.length,
        },
        '获取特惠套餐列表成功'
      );
    } catch (error: any) {
      logger.error('获取特惠套餐列表失败:', error);
      ctx.error(500, error.message || '获取特惠套餐列表失败');
    }
  };

  /**
   * 获取特惠套餐详情（用户端）
   * GET /api/special-offers/:id
   */
  getOfferDetail = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      const offer = await this.service.getOfferById(id);

      // 用户端只能查看启用的套餐
      if (offer.status !== SpecialOfferStatus.ACTIVE) {
        ctx.error(404, '套餐不存在或已下架');
        return;
      }

      // 检查是否已过期
      if (new Date(offer.endDate) < new Date()) {
        ctx.error(400, '套餐活动已结束');
        return;
      }

      ctx.success(offer, '获取特惠套餐详情成功');
    } catch (error: any) {
      logger.error('获取特惠套餐详情失败:', error);
      ctx.error(500, error.message || '获取特惠套餐详情失败');
    }
  };
}


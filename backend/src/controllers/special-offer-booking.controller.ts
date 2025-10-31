import {
  SpecialOfferBookingService,
  CreateSpecialOfferBookingDTO,
  SpecialOfferBookingListDTO,
} from '../services/special-offer-booking.service';
import { logger } from '../utils/logger';

/**
 * 特惠订单控制器
 */
export class SpecialOfferBookingController {
  private service = new SpecialOfferBookingService();

  /**
   * 创建特惠订单（用户端）
   * POST /api/special-offers/bookings
   */
  createBooking = async (ctx: any) => {
    try {
      const userId = ctx.state.user.id;
      const data: CreateSpecialOfferBookingDTO = {
        ...ctx.request.body,
        userId,
      };

      // 验证必填字段
      if (!data.offerId || !data.pickupDate || !data.vehicleModelId) {
        ctx.error(400, '缺少必填字段');
        return;
      }

      const booking = await this.service.createBooking(data);

      ctx.success(booking, '创建特惠订单成功');
    } catch (error: any) {
      logger.error('创建特惠订单失败:', error);
      ctx.error(500, error.message || '创建特惠订单失败');
    }
  };

  /**
   * 获取我的特惠订单列表（用户端）
   * GET /api/special-offers/bookings
   */
  getMyBookings = async (ctx: any) => {
    try {
      const userId = ctx.state.user.id;
      const params: SpecialOfferBookingListDTO = {
        page: ctx.query.page ? parseInt(ctx.query.page) : undefined,
        pageSize: ctx.query.pageSize ? parseInt(ctx.query.pageSize) : undefined,
        status: ctx.query.status,
        userId,
      };

      const result = await this.service.getBookingList(params);

      ctx.success(result, '获取订单列表成功');
    } catch (error: any) {
      logger.error('获取订单列表失败:', error);
      ctx.error(500, error.message || '获取订单列表失败');
    }
  };

  /**
   * 获取特惠订单详情（用户端）
   * GET /api/special-offers/bookings/:id
   */
  getBookingDetail = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user.id;

      const booking = await this.service.getBookingById(id);

      // 验证订单所有权
      if (booking.userId !== userId) {
        ctx.error(403, '无权查看此订单');
        return;
      }

      ctx.success(booking, '获取订单详情成功');
    } catch (error: any) {
      logger.error('获取订单详情失败:', error);
      ctx.error(500, error.message || '获取订单详情失败');
    }
  };

  /**
   * 取消特惠订单（用户端）
   * POST /api/special-offers/bookings/:id/cancel
   */
  cancelBooking = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user.id;
      const { cancelReason } = ctx.request.body;

      const booking = await this.service.cancelBooking(id, userId, cancelReason);

      ctx.success(booking, '取消订单成功');
    } catch (error: any) {
      logger.error('取消订单失败:', error);
      ctx.error(500, error.message || '取消订单失败');
    }
  };

  /**
   * 获取特惠订单列表（管理端）
   * GET /api/admin/special-offers/bookings
   */
  adminGetBookingList = async (ctx: any) => {
    try {
      const params: SpecialOfferBookingListDTO = {
        page: ctx.query.page ? parseInt(ctx.query.page) : undefined,
        pageSize: ctx.query.pageSize ? parseInt(ctx.query.pageSize) : undefined,
        userId: ctx.query.userId,
        offerId: ctx.query.offerId,
        status: ctx.query.status,
      };

      const result = await this.service.getBookingList(params);

      ctx.success(result, '获取订单列表成功');
    } catch (error: any) {
      logger.error('获取订单列表失败:', error);
      ctx.error(500, error.message || '获取订单列表失败');
    }
  };

  /**
   * 获取特惠订单详情（管理端）
   * GET /api/admin/special-offers/bookings/:id
   */
  adminGetBookingDetail = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      const booking = await this.service.getBookingById(id);

      ctx.success(booking, '获取订单详情成功');
    } catch (error: any) {
      logger.error('获取订单详情失败:', error);
      ctx.error(500, error.message || '获取订单详情失败');
    }
  };

  /**
   * 分配车辆（管理端）
   * PUT /api/admin/special-offers/bookings/:id/assign-vehicle
   */
  adminAssignVehicle = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const { vehicleId } = ctx.request.body;

      if (!vehicleId) {
        ctx.error(400, '缺少车辆ID');
        return;
      }

      const booking = await this.service.assignVehicle(id, vehicleId);

      ctx.success(booking, '分配车辆成功');
    } catch (error: any) {
      logger.error('分配车辆失败:', error);
      ctx.error(500, error.message || '分配车辆失败');
    }
  };

  /**
   * 完成订单（管理端）
   * PUT /api/admin/special-offers/bookings/:id/complete
   */
  adminCompleteBooking = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      const booking = await this.service.completeBooking(id);

      ctx.success(booking, '完成订单成功');
    } catch (error: any) {
      logger.error('完成订单失败:', error);
      ctx.error(500, error.message || '完成订单失败');
    }
  };
}


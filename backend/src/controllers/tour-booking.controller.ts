import { TourBookingService } from '../services/tour-booking.service';
import { TourBookingStatus } from '../entities/TourBooking';
import { TourRouteService } from '../services/tour-route.service';
import { BookingMode } from '../entities/TourRoute';
import { logger } from '../utils/logger';

/**
 * 旅游预订控制器
 */
export class TourBookingController {
  private service = new TourBookingService();
  private routeService = new TourRouteService();

  /**
   * 创建预订（用户端）
   * POST /api/tours/bookings
   */
  createBooking = async (ctx: any) => {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        ctx.error(401, '请先登录');
        return;
      }

      const data = ctx.request.body;

      // 验证必填字段
      if (
        !data.routeId ||
        !data.batchId ||
        !data.adultCount ||
        !data.contactName ||
        !data.contactPhone
      ) {
        ctx.error(400, '缺少必填字段');
        return;
      }

      // 检查路线的预订模式
      const route = await this.routeService.getRouteById(data.routeId);
      if (route.bookingMode === BookingMode.INQUIRY) {
        ctx.error(
          400,
          `该路线当前为咨询模式，暂不支持在线预订。请联系客服：${route.customerServicePhone || '客服电话未设置'}`
        );
        return;
      }

      const booking = await this.service.createBooking({
        ...data,
        userId,
      });

      ctx.success(booking, '创建旅游预订成功');
    } catch (error: any) {
      logger.error('创建旅游预订失败:', error);
      ctx.error(500, error.message || '创建旅游预订失败');
    }
  };

  /**
   * 获取我的预订列表（用户端）
   * GET /api/tours/bookings/my
   */
  getMyBookings = async (ctx: any) => {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        ctx.error(401, '请先登录');
        return;
      }

      const { page, pageSize, status } = ctx.query;

      const result = await this.service.getBookingList({
        page: page ? parseInt(page) : undefined,
        pageSize: pageSize ? parseInt(pageSize) : undefined,
        userId,
        status,
      });

      ctx.success(result, '获取我的旅游预订列表成功');
    } catch (error: any) {
      logger.error('获取我的旅游预订列表失败:', error);
      ctx.error(500, error.message || '获取我的旅游预订列表失败');
    }
  };

  /**
   * 获取预订详情（用户端）
   * GET /api/tours/bookings/:id
   */
  getBookingById = async (ctx: any) => {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        ctx.error(401, '请先登录');
        return;
      }

      const { id } = ctx.params;

      const booking = await this.service.getBookingById(id);

      // 验证是否是本人的预订
      if (booking.userId !== userId) {
        ctx.error(403, '无权查看此预订');
        return;
      }

      ctx.success(booking, '获取旅游预订详情成功');
    } catch (error: any) {
      logger.error('获取旅游预订详情失败:', error);
      ctx.error(500, error.message || '获取旅游预订详情失败');
    }
  };

  /**
   * 取消预订（用户端）
   * POST /api/tours/bookings/:id/cancel
   */
  cancelBooking = async (ctx: any) => {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        ctx.error(401, '请先登录');
        return;
      }

      const { id } = ctx.params;

      const booking = await this.service.cancelBooking(id, userId);

      ctx.success(booking, '取消旅游预订成功');
    } catch (error: any) {
      logger.error('取消旅游预订失败:', error);
      ctx.error(500, error.message || '取消旅游预订失败');
    }
  };

  /**
   * 获取预订列表（管理端）
   * GET /api/admin/tours/bookings
   */
  adminGetBookings = async (ctx: any) => {
    try {
      const { page, pageSize, userId, routeId, batchId, status } = ctx.query;

      const result = await this.service.getBookingList({
        page: page ? parseInt(page) : undefined,
        pageSize: pageSize ? parseInt(pageSize) : undefined,
        userId,
        routeId,
        batchId,
        status,
      });

      ctx.success(result, '获取旅游预订列表成功');
    } catch (error: any) {
      logger.error('获取旅游预订列表失败:', error);
      ctx.error(500, error.message || '获取旅游预订列表失败');
    }
  };

  /**
   * 获取预订详情（管理端）
   * GET /api/admin/tours/bookings/:id
   */
  adminGetBookingById = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      const booking = await this.service.getBookingById(id);

      ctx.success(booking, '获取旅游预订详情成功');
    } catch (error: any) {
      logger.error('获取旅游预订详情失败:', error);
      ctx.error(500, error.message || '获取旅游预订详情失败');
    }
  };

  /**
   * 更新预订状态（管理端）
   * PUT /api/admin/tours/bookings/:id/status
   */
  adminUpdateBookingStatus = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const { status } = ctx.request.body;

      if (!status || !Object.values(TourBookingStatus).includes(status)) {
        ctx.error(400, '无效的状态值');
        return;
      }

      const booking = await this.service.updateBookingStatus(id, status);

      ctx.success(booking, '更新旅游预订状态成功');
    } catch (error: any) {
      logger.error('更新旅游预订状态失败:', error);
      ctx.error(500, error.message || '更新旅游预订状态失败');
    }
  };
}

import {
  CampsiteBookingService,
  CreateBookingDTO,
  BookingListDTO,
} from '../services/campsite-booking.service';
import { BookingStatus } from '../entities/CampsiteBooking';
import { logger } from '../utils/logger';

/**
 * 营地预订控制器
 */
export class CampsiteBookingController {
  private bookingService = new CampsiteBookingService();

  /**
   * 创建预订（用户端）
   * POST /api/campsites/bookings
   */
  createBooking = async (ctx: any) => {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        ctx.error(401, '请先登录');
        return;
      }

      const data: CreateBookingDTO = {
        ...ctx.request.body,
        userId,
      };

      // 验证必填字段
      if (
        !data.campsiteId ||
        !data.spotId ||
        !data.checkInDate ||
        !data.checkOutDate ||
        !data.spotQuantity ||
        !data.contactName ||
        !data.contactPhone
      ) {
        ctx.error(400, '缺少必填参数');
        return;
      }

      const booking = await this.bookingService.createBooking(data);

      ctx.success(booking, '创建预订成功');
    } catch (error: any) {
      logger.error('Failed to create booking:', error);
      ctx.error(500, error.message || '创建预订失败');
    }
  };

  /**
   * 获取我的预订列表（用户端）
   * GET /api/campsites/bookings/my
   */
  getMyBookings = async (ctx: any) => {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        ctx.error(401, '请先登录');
        return;
      }

      const { page, pageSize, status, keyword } = ctx.query;

      const params: BookingListDTO = {
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
        userId,
        status: status as BookingStatus,
        keyword,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };

      const result = await this.bookingService.getBookingList(params);

      ctx.success(result, '获取预订列表成功');
    } catch (error: any) {
      logger.error('Failed to get my bookings:', error);
      ctx.error(500, error.message || '获取预订列表失败');
    }
  };

  /**
   * 获取预订详情（用户端）
   * GET /api/campsites/bookings/:id
   */
  getBookingById = async (ctx: any) => {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        ctx.error(401, '请先登录');
        return;
      }

      const { id } = ctx.params;

      const booking = await this.bookingService.getBookingById(id);

      // 验证是否是用户自己的预订
      if (booking.userId !== userId) {
        ctx.error(403, '无权查看此预订');
        return;
      }

      ctx.success(booking, '获取预订详情成功');
    } catch (error: any) {
      logger.error('Failed to get booking details:', error);
      ctx.error(500, error.message || '获取预订详情失败');
    }
  };

  /**
   * 取消预订（用户端）
   * POST /api/campsites/bookings/:id/cancel
   */
  cancelBooking = async (ctx: any) => {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        ctx.error(401, '请先登录');
        return;
      }

      const { id } = ctx.params;
      const { reason } = ctx.request.body;

      const booking = await this.bookingService.cancelBooking(id, userId, reason);

      ctx.success(booking, '取消预订成功');
    } catch (error: any) {
      logger.error('Failed to cancel booking:', error);
      ctx.error(500, error.message || '取消预订失败');
    }
  };

  // ==================== 管理端 API ====================

  /**
   * 获取所有预订（管理端）
   * GET /api/admin/campsites/bookings
   */
  adminGetBookings = async (ctx: any) => {
    try {
      const {
        page,
        pageSize,
        campsiteId,
        status,
        checkInDateStart,
        checkInDateEnd,
        keyword,
        sortBy,
        sortOrder,
      } = ctx.query;

      const params: BookingListDTO = {
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
        campsiteId,
        status: status as BookingStatus,
        checkInDateStart: checkInDateStart ? new Date(checkInDateStart) : undefined,
        checkInDateEnd: checkInDateEnd ? new Date(checkInDateEnd) : undefined,
        keyword,
        sortBy: sortBy as 'createdAt' | 'checkInDate',
        sortOrder: sortOrder as 'ASC' | 'DESC',
      };

      const result = await this.bookingService.getBookingList(params);

      ctx.success(result, '获取预订列表成功');
    } catch (error: any) {
      logger.error('Failed to get bookings:', error);
      ctx.error(500, error.message || '获取预订列表失败');
    }
  };

  /**
   * 获取预订详情（管理端）
   * GET /api/admin/campsites/bookings/:id
   */
  adminGetBookingById = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      const booking = await this.bookingService.getBookingById(id);

      ctx.success(booking, '获取预订详情成功');
    } catch (error: any) {
      logger.error('Failed to get booking details:', error);
      ctx.error(500, error.message || '获取预订详情失败');
    }
  };

  /**
   * 更新预订状态（管理端）
   * PUT /api/admin/campsites/bookings/:id/status
   */
  adminUpdateBookingStatus = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const { status } = ctx.request.body;

      if (!status || !Object.values(BookingStatus).includes(status)) {
        ctx.error(400, '无效的预订状态');
        return;
      }

      const booking = await this.bookingService.getBookingById(id);

      // 更新状态
      booking.status = status;

      if (status === BookingStatus.CHECKED_IN) {
        booking.checkedInAt = new Date();
      } else if (status === BookingStatus.COMPLETED) {
        booking.checkedOutAt = new Date();
      }

      await this.bookingService['bookingRepository'].save(booking);

      ctx.success(booking, '更新预订状态成功');
    } catch (error: any) {
      logger.error('Failed to update booking status:', error);
      ctx.error(500, error.message || '更新预订状态失败');
    }
  };
}


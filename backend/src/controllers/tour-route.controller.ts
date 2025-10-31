import { TourRouteService } from '../services/tour-route.service';
import { TourStatus, BookingMode } from '../entities/TourRoute';
import { logger } from '../utils/logger';

/**
 * 旅游路线控制器
 */
export class TourRouteController {
  private service = new TourRouteService();

  /**
   * 获取路线列表（用户端）
   * GET /api/tours/routes
   */
  getRoutes = async (ctx: any) => {
    try {
      const {
        page,
        pageSize,
        destination,
        minDays,
        maxDays,
        minPrice,
        maxPrice,
        keyword,
        sortBy,
        sortOrder,
      } = ctx.query;

      const result = await this.service.getRouteList({
        page: page ? parseInt(page) : undefined,
        pageSize: pageSize ? parseInt(pageSize) : undefined,
        destination,
        minDays: minDays ? parseInt(minDays) : undefined,
        maxDays: maxDays ? parseInt(maxDays) : undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        status: TourStatus.ENABLED, // 用户端只显示启用的路线
        keyword,
        sortBy,
        sortOrder,
      });

      ctx.success(result, '获取旅游路线列表成功');
    } catch (error: any) {
      logger.error('获取旅游路线列表失败:', error);
      ctx.error(500, error.message || '获取旅游路线列表失败');
    }
  };

  /**
   * 获取路线详情（用户端）
   * GET /api/tours/routes/:id
   */
  getRouteById = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      const route = await this.service.getRouteById(id);

      // 用户端只能查看启用的路线
      if (route.status !== TourStatus.ENABLED) {
        ctx.error(404, '旅游路线不存在');
        return;
      }

      ctx.success(route, '获取旅游路线详情成功');
    } catch (error: any) {
      logger.error('获取旅游路线详情失败:', error);
      ctx.error(500, error.message || '获取旅游路线详情失败');
    }
  };

  /**
   * 创建路线（管理端）
   * POST /api/admin/tours/routes
   */
  adminCreateRoute = async (ctx: any) => {
    try {
      const data = ctx.request.body;

      // 验证必填字段
      if (
        !data.name ||
        !data.summary ||
        !data.destination ||
        !data.days ||
        !data.nights ||
        !data.itinerary ||
        !data.included ||
        !data.excluded ||
        !data.adultPrice ||
        !data.childPrice ||
        !data.serviceMode
      ) {
        ctx.error(400, '缺少必填字段');
        return;
      }

      const route = await this.service.createRoute(data);

      ctx.success(route, '创建旅游路线成功');
    } catch (error: any) {
      logger.error('创建旅游路线失败:', error);
      ctx.error(500, error.message || '创建旅游路线失败');
    }
  };

  /**
   * 更新路线（管理端）
   * PUT /api/admin/tours/routes/:id
   */
  adminUpdateRoute = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const data = ctx.request.body;

      const route = await this.service.updateRoute(id, data);

      ctx.success(route, '更新旅游路线成功');
    } catch (error: any) {
      logger.error('更新旅游路线失败:', error);
      ctx.error(500, error.message || '更新旅游路线失败');
    }
  };

  /**
   * 切换路线状态（管理端）
   * PUT /api/admin/tours/routes/:id/status
   */
  adminSwitchStatus = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const { status } = ctx.request.body;

      if (!status || !Object.values(TourStatus).includes(status)) {
        ctx.error(400, '无效的状态值');
        return;
      }

      const route = await this.service.switchStatus(id, status);

      ctx.success(route, '切换旅游路线状态成功');
    } catch (error: any) {
      logger.error('切换旅游路线状态失败:', error);
      ctx.error(500, error.message || '切换旅游路线状态失败');
    }
  };

  /**
   * 切换预订模式（管理端）
   * PUT /api/admin/tours/routes/:id/booking-mode
   */
  adminSwitchBookingMode = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const { bookingMode, customerServicePhone } = ctx.request.body;

      if (!bookingMode || !Object.values(BookingMode).includes(bookingMode)) {
        ctx.error(400, '无效的预订模式');
        return;
      }

      const route = await this.service.switchBookingMode(id, bookingMode, customerServicePhone);

      ctx.success(route, '切换预订模式成功');
    } catch (error: any) {
      logger.error('切换预订模式失败:', error);
      ctx.error(500, error.message || '切换预订模式失败');
    }
  };

  /**
   * 获取路线列表（管理端）
   * GET /api/admin/tours/routes
   */
  adminGetRoutes = async (ctx: any) => {
    try {
      const {
        page,
        pageSize,
        destination,
        minDays,
        maxDays,
        minPrice,
        maxPrice,
        status,
        keyword,
        sortBy,
        sortOrder,
      } = ctx.query;

      const result = await this.service.getRouteList({
        page: page ? parseInt(page) : undefined,
        pageSize: pageSize ? parseInt(pageSize) : undefined,
        destination,
        minDays: minDays ? parseInt(minDays) : undefined,
        maxDays: maxDays ? parseInt(maxDays) : undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        status, // 管理端可以查看所有状态
        keyword,
        sortBy,
        sortOrder,
      });

      ctx.success(result, '获取旅游路线列表成功');
    } catch (error: any) {
      logger.error('获取旅游路线列表失败:', error);
      ctx.error(500, error.message || '获取旅游路线列表失败');
    }
  };

  /**
   * 获取路线详情（管理端）
   * GET /api/admin/tours/routes/:id
   */
  adminGetRouteById = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      const route = await this.service.getRouteById(id);

      ctx.success(route, '获取旅游路线详情成功');
    } catch (error: any) {
      logger.error('获取旅游路线详情失败:', error);
      ctx.error(500, error.message || '获取旅游路线详情失败');
    }
  };

  /**
   * 删除路线（管理端）
   * DELETE /api/admin/tours/routes/:id
   */
  adminDeleteRoute = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      await this.service.deleteRoute(id);

      ctx.success(null, '删除旅游路线成功');
    } catch (error: any) {
      logger.error('删除旅游路线失败:', error);
      ctx.error(500, error.message || '删除旅游路线失败');
    }
  };
}

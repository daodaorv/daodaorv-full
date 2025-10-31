import { OrderService } from '../services/order.service';
import { logger } from '../utils/logger';

const orderService = new OrderService();

export class OrderController {
  /**
   * 创建订单
   * POST /api/orders
   */
  async createOrder(ctx: any) {
    try {
      const userId = ctx.state.user?.userId;
      if (!userId) {
        ctx.error(401, '未登录');
        return;
      }

      const dto = ctx.request.body as any;

      // 参数验证
      if (!dto.vehicleId || !dto.startDate || !dto.endDate) {
        ctx.error(400, '缺少必填字段');
        return;
      }

      // 解析 additionalServices JSON 字符串
      if (dto.additionalServices && typeof dto.additionalServices === 'string') {
        try {
          dto.additionalServices = JSON.parse(dto.additionalServices);
        } catch (e) {
          ctx.error(400, 'additionalServices 格式错误');
          return;
        }
      }

      const order = await orderService.createOrder(userId, dto);

      ctx.success(order, '订单创建成功');
    } catch (error: any) {
      logger.error('Failed to create order:', error);

      // 根据错误类型返回不同的状态码
      const errorMessage = error.message || '创建订单失败';
      if (errorMessage.includes('车辆不存在')) {
        ctx.error(404, errorMessage);
      } else if (
        errorMessage.includes('开始日期') ||
        errorMessage.includes('结束日期') ||
        errorMessage.includes('租赁天数') ||
        errorMessage.includes('车辆当前不可用') ||
        errorMessage.includes('时间段已被预订')
      ) {
        ctx.error(400, errorMessage);
      } else {
        ctx.error(500, errorMessage);
      }
    }
  }

  /**
   * 获取我的订单列表
   * GET /api/orders
   */
  async getMyOrders(ctx: any) {
    try {
      const userId = ctx.state.user?.userId;
      if (!userId) {
        ctx.error(401, '未登录');
        return;
      }

      const { status, page, pageSize } = ctx.query;

      const result = await orderService.getMyOrders(userId, {
        status,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 10,
      });

      ctx.success(result, '获取订单列表成功');
    } catch (error: any) {
      logger.error('Failed to get orders:', error);
      ctx.error(500, error.message || '获取订单列表失败');
    }
  }

  /**
   * 获取订单详情
   * GET /api/orders/:id
   */
  async getOrderDetail(ctx: any) {
    try {
      const userId = ctx.state.user?.userId;
      if (!userId) {
        ctx.error(401, '未登录');
        return;
      }

      const { id } = ctx.params;

      const order = await orderService.getOrderById(id, userId);

      ctx.success(order, '获取订单详情成功');
    } catch (error: any) {
      logger.error('Failed to get order detail:', error);
      if (error.message && error.message.includes('不存在')) {
        ctx.error(404, error.message);
      } else if (error.message && error.message.includes('无权')) {
        ctx.error(403, error.message);
      } else {
        ctx.error(500, error.message || '获取订单详情失败');
      }
    }
  }

  /**
   * 取消订单
   * POST /api/orders/:id/cancel
   */
  async cancelOrder(ctx: any) {
    try {
      const userId = ctx.state.user?.userId;
      if (!userId) {
        ctx.error(401, '未登录');
        return;
      }

      const { id } = ctx.params;
      const dto = ctx.request.body as any;

      const order = await orderService.cancelOrder(id, userId, dto);

      ctx.success(order, '订单取消成功');
    } catch (error: any) {
      logger.error('Failed to cancel order:', error);

      // 根据错误类型返回不同的状态码
      const errorMessage = error.message || '取消订单失败';
      if (errorMessage.includes('订单不存在')) {
        ctx.error(404, errorMessage);
      } else if (errorMessage.includes('只能取消自己的订单') || errorMessage.includes('无权')) {
        ctx.error(403, errorMessage);
      } else if (
        errorMessage.includes('当前订单状态不可取消') ||
        errorMessage.includes('当前状态不允许取消') ||
        errorMessage.includes('已取消') ||
        errorMessage.includes('不能取消')
      ) {
        ctx.error(400, errorMessage);
      } else {
        ctx.error(500, errorMessage);
      }
    }
  }

  /**
   * 获取订单列表（管理端）
   * GET /api/admin/orders
   */
  async getAdminOrders(ctx: any) {
    try {
      const query = ctx.query;

      const result = await orderService.getAdminOrders({
        status: query.status,
        orderType: query.orderType,
        startDate: query.startDate,
        endDate: query.endDate,
        storeId: query.storeId,
        keyword: query.keyword,
        page: query.page ? parseInt(query.page) : 1,
        pageSize: query.pageSize ? parseInt(query.pageSize) : 10,
      });

      ctx.success(result, '获取订单列表成功');
    } catch (error: any) {
      logger.error('Failed to get admin orders:', error);
      ctx.error(500, error.message || '获取订单列表失败');
    }
  }

  /**
   * 获取订单详情（管理端）
   * GET /api/admin/orders/:id
   */
  async getAdminOrderDetail(ctx: any) {
    try {
      const { id } = ctx.params;

      const order = await orderService.getOrderById(id);

      ctx.success(order, '获取订单详情成功');
    } catch (error: any) {
      logger.error('Failed to get admin order detail:', error);
      if (error.message && error.message.includes('不存在')) {
        ctx.error(404, error.message);
      } else {
        ctx.error(500, error.message || '获取订单详情失败');
      }
    }
  }

  /**
   * 更新订单状态
   * PUT /api/admin/orders/:id/status
   */
  async updateOrderStatus(ctx: any) {
    try {
      const { id } = ctx.params;
      const { status, remarks } = ctx.request.body as any;

      if (!status) {
        ctx.error(400, '缺少状态参数');
        return;
      }

      const order = await orderService.updateOrderStatus(id, status, remarks);

      ctx.success(order, '订单状态更新成功');
    } catch (error: any) {
      logger.error('Failed to update order status:', error);
      ctx.error(500, error.message || '更新订单状态失败');
    }
  }

  /**
   * 处理退款
   * POST /api/admin/orders/:id/refund
   */
  async processRefund(ctx: any) {
    try {
      const { id } = ctx.params;
      const { refundAmount, reason } = ctx.request.body as any;

      if (!refundAmount) {
        ctx.error(400, '缺少退款金额');
        return;
      }

      const order = await orderService.processRefund(id, parseFloat(refundAmount), reason);

      ctx.success(order, '退款处理成功');
    } catch (error: any) {
      logger.error('Failed to process refund:', error);
      ctx.error(500, error.message || '退款处理失败');
    }
  }
}

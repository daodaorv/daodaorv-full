import { RefundService } from '../services/refund.service';
import { PaymentPlatform } from '../entities/PaymentConfig';
import { logger } from '../utils/logger';

const refundService = new RefundService();

/**
 * 退款控制器
 */
export class RefundController {
  /**
   * 获取退款详情
   * GET /api/refund/:refundId
   */
  async getRefundDetail(ctx: any) {
    try {
      const { refundId } = ctx.params;

      const refundRecord = await refundService.getRefundDetail(refundId);

      ctx.success(refundRecord, '查询成功');
    } catch (error: any) {
      logger.error('Failed to get refund detail:', error);
      ctx.error(500, error.message || '查询失败');
    }
  }

  /**
   * 查询退款状态
   * GET /api/refund/status/:refundNo
   */
  async queryRefundStatus(ctx: any) {
    try {
      const { refundNo } = ctx.params;

      const refundRecord = await refundService.queryRefundStatus(refundNo);

      ctx.success(refundRecord, '查询成功');
    } catch (error: any) {
      logger.error('Failed to query refund status:', error);
      ctx.error(500, error.message || '查询失败');
    }
  }

  /**
   * 创建退款申请（管理端）
   * POST /api/admin/refund/create
   */
  async createRefund(ctx: any) {
    try {
      const { orderId, reason } = ctx.request.body as any;

      // 参数验证
      if (!orderId) {
        ctx.error(400, '缺少订单ID');
        return;
      }

      const refundRecord = await refundService.createRefund(orderId, reason);

      ctx.success(refundRecord, '退款申请创建成功');
    } catch (error: any) {
      logger.error('Failed to create refund:', error);
      ctx.error(500, error.message || '退款申请创建失败');
    }
  }

  /**
   * 处理退款（管理端）
   * POST /api/admin/refund/process/:refundId
   */
  async processRefund(ctx: any) {
    try {
      const { refundId } = ctx.params;

      const refundRecord = await refundService.processRefund(refundId);

      ctx.success(refundRecord, '退款处理成功');
    } catch (error: any) {
      logger.error('Failed to process refund:', error);
      ctx.error(500, error.message || '退款处理失败');
    }
  }

  /**
   * 微信退款回调
   * POST /api/refund/wechat/callback
   */
  async wechatRefundCallback(ctx: any) {
    try {
      const params = ctx.request.body;

      await refundService.handleRefundCallback(PaymentPlatform.WECHAT, params);

      // 微信要求返回 XML 格式
      ctx.type = 'application/xml';
      ctx.body = '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>';
    } catch (error: any) {
      logger.error('Wechat refund callback failed:', error);
      ctx.type = 'application/xml';
      ctx.body = `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[${error.message}]]></return_msg></xml>`;
    }
  }

  /**
   * 支付宝退款回调
   * POST /api/refund/alipay/callback
   */
  async alipayRefundCallback(ctx: any) {
    try {
      const params = ctx.request.body;

      await refundService.handleRefundCallback(PaymentPlatform.ALIPAY, params);

      ctx.body = 'success';
    } catch (error: any) {
      logger.error('Alipay refund callback failed:', error);
      ctx.body = 'fail';
    }
  }
}

export const refundController = new RefundController();


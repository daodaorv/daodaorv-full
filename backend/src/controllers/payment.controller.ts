import { paymentService } from '../services/payment.service';
import { PaymentPlatform } from '../entities/PaymentConfig';
import { logger } from '../utils/logger';

/**
 * 支付控制器
 */
export class PaymentController {
  /**
   * 创建支付
   * POST /api/payment/create
   */
  async createPayment(ctx: any) {
    try {
      const userId = ctx.state.user?.userId;
      const { orderId, platform, amount } = ctx.request.body as any;

      // 参数验证
      if (!orderId || !platform || !amount) {
        ctx.error(400, '缺少必填参数');
        return;
      }

      if (!Object.values(PaymentPlatform).includes(platform)) {
        ctx.error(400, '不支持的支付平台');
        return;
      }

      if (amount <= 0) {
        ctx.error(400, '支付金额必须大于0');
        return;
      }

      const result = await paymentService.createPayment(
        orderId,
        userId,
        platform,
        parseFloat(amount)
      );

      ctx.success(result, '支付创建成功');
    } catch (error: any) {
      logger.error('Failed to create payment:', error);
      ctx.error(500, error.message || '支付创建失败');
    }
  }

  /**
   * 查询支付状态
   * GET /api/payment/:paymentNo
   */
  async queryPaymentStatus(ctx: any) {
    try {
      const { paymentNo } = ctx.params;

      const paymentRecord = await paymentService.queryPaymentStatus(paymentNo);

      // 只返回必要信息
      const result = {
        paymentNo: paymentRecord.paymentNo,
        orderId: paymentRecord.orderId,
        amount: paymentRecord.amount,
        platform: paymentRecord.platform,
        status: paymentRecord.status,
        paidAt: paymentRecord.paidAt,
        createdAt: paymentRecord.createdAt,
      };

      ctx.success(result, '查询成功');
    } catch (error: any) {
      logger.error('Failed to query payment status:', error);
      ctx.error(500, error.message || '查询失败');
    }
  }

  /**
   * 微信支付回调
   * POST /api/payment/wechat/callback
   */
  async wechatCallback(ctx: any) {
    try {
      const params = ctx.request.body;

      const success = await paymentService.handlePaymentCallback(PaymentPlatform.WECHAT, params);

      if (success) {
        // 微信支付要求返回XML格式
        ctx.body =
          '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>';
      } else {
        ctx.body =
          '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[签名验证失败]]></return_msg></xml>';
      }
    } catch (error: any) {
      logger.error('Wechat payment callback failed:', error);
      ctx.body =
        '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[处理失败]]></return_msg></xml>';
    }
  }

  /**
   * 支付宝回调
   * POST /api/payment/alipay/callback
   */
  async alipayCallback(ctx: any) {
    try {
      const params = ctx.request.body;

      const success = await paymentService.handlePaymentCallback(PaymentPlatform.ALIPAY, params);

      if (success) {
        ctx.body = 'success';
      } else {
        ctx.body = 'fail';
      }
    } catch (error: any) {
      logger.error('Alipay payment callback failed:', error);
      ctx.body = 'fail';
    }
  }

  /**
   * 获取支付配置（管理端）
   * GET /api/admin/payment/config/:platform
   */
  async getPaymentConfig(ctx: any) {
    try {
      const { platform } = ctx.params;

      if (!Object.values(PaymentPlatform).includes(platform)) {
        ctx.error(400, '不支持的支付平台');
        return;
      }

      const config = await paymentService.getPaymentConfig(platform);

      if (!config) {
        ctx.success(null, '配置不存在');
        return;
      }

      // 脱敏处理：不返回敏感信息
      const result = {
        platform: config.platform,
        isEnabled: config.isEnabled,
        remark: config.remark,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
        // config字段不返回，避免泄露密钥
      };

      ctx.success(result, '查询成功');
    } catch (error: any) {
      logger.error('Failed to get payment config:', error);
      ctx.error(500, error.message || '查询失败');
    }
  }

  /**
   * 更新支付配置（管理端）
   * POST /api/admin/payment/config/:platform
   */
  async updatePaymentConfig(ctx: any) {
    try {
      const { platform } = ctx.params;
      const { config, isEnabled } = ctx.request.body as any;

      if (!Object.values(PaymentPlatform).includes(platform)) {
        ctx.error(400, '不支持的支付平台');
        return;
      }

      if (!config) {
        ctx.error(400, '缺少配置参数');
        return;
      }

      const paymentConfig = await paymentService.updatePaymentConfig(platform, config, isEnabled);

      ctx.success(
        {
          platform: paymentConfig.platform,
          isEnabled: paymentConfig.isEnabled,
        },
        '配置更新成功'
      );
    } catch (error: any) {
      logger.error('Failed to update payment config:', error);
      ctx.error(500, error.message || '配置更新失败');
    }
  }

  /**
   * 测试支付配置（管理端）
   * POST /api/admin/payment/config/:platform/test
   */
  async testPaymentConfig(ctx: any) {
    try {
      const { platform } = ctx.params;

      if (!Object.values(PaymentPlatform).includes(platform)) {
        ctx.error(400, '不支持的支付平台');
        return;
      }

      // TODO: 实现支付配置测试逻辑
      // 调用支付平台的测试接口，验证配置是否正确

      ctx.success({ success: true }, '配置测试成功（预留功能）');
    } catch (error: any) {
      logger.error('Failed to test payment config:', error);
      ctx.error(500, error.message || '配置测试失败');
    }
  }
}

export const paymentController = new PaymentController();

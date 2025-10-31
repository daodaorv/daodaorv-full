import { Context } from 'koa';
import { OrderService } from '../services/order.service';
import { logger } from '../utils/logger';

/**
 * 押金支付控制器
 */
export class DepositController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  /**
   * 处理车辆押金支付
   */
  async processVehicleDepositPayment(ctx: Context): Promise<void> {
    try {
      const { orderId } = ctx.params;
      const { paymentMethod, transactionId, amount } = ctx.request.body;

      // 验证参数
      if (!orderId || !paymentMethod || !amount) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: '参数不完整',
          data: null
        };
        return;
      }

      // 验证支付方式
      const validPaymentMethods = ['wechat', 'alipay', 'cash'];
      if (!validPaymentMethods.includes(paymentMethod)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: '不支持的支付方式',
          data: null
        };
        return;
      }

      const order = await this.orderService.processVehicleDepositPayment(orderId, {
        paymentMethod,
        transactionId,
        amount: Number(amount)
      });

      ctx.body = {
        success: true,
        message: '车辆押金支付成功',
        data: {
          orderId: order.id,
          orderNo: order.orderNo,
          vehicleDeposit: order.vehicleDeposit,
          paymentMethod,
          paidAt: order.vehicleDepositPaidAt
        }
      };
    } catch (error: any) {
      logger.error('车辆押金支付失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: error.message || '车辆押金支付失败',
        data: null
      };
    }
  }

  /**
   * 处理违章押金支付
   */
  async processViolationDepositPayment(ctx: Context): Promise<void> {
    try {
      const { orderId } = ctx.params;
      const { paymentMethod, transactionId, amount } = ctx.request.body;

      // 验证参数
      if (!orderId || !paymentMethod || !amount) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: '参数不完整',
          data: null
        };
        return;
      }

      // 验证支付方式
      const validPaymentMethods = ['wechat', 'alipay', 'cash'];
      if (!validPaymentMethods.includes(paymentMethod)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: '不支持的支付方式',
          data: null
        };
        return;
      }

      const order = await this.orderService.processViolationDepositPayment(orderId, {
        paymentMethod,
        transactionId,
        amount: Number(amount)
      });

      ctx.body = {
        success: true,
        message: '违章押金支付成功',
        data: {
          orderId: order.id,
          orderNo: order.orderNo,
          violationDeposit: order.violationDeposit,
          paymentMethod,
          paidAt: order.violationDepositPaidAt
        }
      };
    } catch (error) {
      logger.error('违章押金支付失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: error.message || '违章押金支付失败',
        data: null
      };
    }
  }

  /**
   * 处理车辆押金退还
   */
  async processVehicleDepositRefund(ctx: Context): Promise<void> {
    try {
      const { orderId } = ctx.params;
      const { deductionAmount, reason } = ctx.request.body;

      if (!orderId) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: '订单ID不能为空',
          data: null
        };
        return;
      }

      const order = await this.orderService.processVehicleDepositRefund(
        orderId,
        deductionAmount ? Number(deductionAmount) : undefined,
        reason
      );

      ctx.body = {
        success: true,
        message: '车辆押金退还处理成功',
        data: {
          orderId: order.id,
          orderNo: order.orderNo,
          vehicleDeposit: order.vehicleDeposit,
          deductionAmount: order.vehicleDepositDeduction,
          refundAmount: order.vehicleDeposit - (order.vehicleDepositDeduction || 0),
          status: order.vehicleDepositStatus,
          refundedAt: order.vehicleDepositRefundedAt,
          reason: order.depositDeductionReason
        }
      };
    } catch (error) {
      logger.error('车辆押金退还失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: error.message || '车辆押金退还失败',
        data: null
      };
    }
  }

  /**
   * 处理违章押金退还
   */
  async processViolationDepositRefund(ctx: Context): Promise<void> {
    try {
      const { orderId } = ctx.params;
      const { deductionAmount, reason } = ctx.request.body;

      if (!orderId) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: '订单ID不能为空',
          data: null
        };
        return;
      }

      const order = await this.orderService.processViolationDepositRefund(
        orderId,
        deductionAmount ? Number(deductionAmount) : undefined,
        reason
      );

      ctx.body = {
        success: true,
        message: '违章押金退还处理成功',
        data: {
          orderId: order.id,
          orderNo: order.orderNo,
          violationDeposit: order.violationDeposit,
          deductionAmount: order.violationDepositDeduction,
          refundAmount: order.violationDeposit - (order.violationDepositDeduction || 0),
          status: order.violationDepositStatus,
          refundedAt: order.violationDepositRefundedAt,
          expectedRefundAt: order.violationDepositExpectedRefundAt,
          reason: order.depositDeductionReason
        }
      };
    } catch (error) {
      logger.error('违章押金退还失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: error.message || '违章押金退还失败',
        data: null
      };
    }
  }

  /**
   * 获取订单押金信息
   */
  async getOrderDepositInfo(ctx: Context): Promise<void> {
    try {
      const { orderId } = ctx.params;

      if (!orderId) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: '订单ID不能为空',
          data: null
        };
        return;
      }

      const depositInfo = await this.orderService.getOrderDepositInfo(orderId);

      ctx.body = {
        success: true,
        message: '获取押金信息成功',
        data: depositInfo
      };
    } catch (error) {
      logger.error('获取押金信息失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: error.message || '获取押金信息失败',
        data: null
      };
    }
  }

  /**
   * 生成押金支付二维码
   */
  async generateDepositPaymentQR(ctx: Context): Promise<void> {
    try {
      const { orderId } = ctx.params;
      const { depositType } = ctx.query; // 'vehicle' | 'violation'

      if (!orderId || !depositType) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: '参数不完整',
          data: null
        };
        return;
      }

      if (!['vehicle', 'violation'].includes(depositType as string)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: '押金类型无效',
          data: null
        };
        return;
      }

      const depositInfo = await this.orderService.getOrderDepositInfo(orderId);

      const amount = depositType === 'vehicle' ? depositInfo.vehicleDeposit : depositInfo.violationDeposit;

      if (amount <= 0) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: '押金金额无效',
          data: null
        };
        return;
      }

      // 生成支付二维码数据
      const qrData = {
        type: 'deposit_payment',
        orderId,
        depositType,
        amount,
        timestamp: new Date().toISOString(),
        // 在实际项目中，这里应该生成真实的支付二维码
        qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==` // 临时占位符
      };

      ctx.body = {
        success: true,
        message: '生成支付二维码成功',
        data: qrData
      };
    } catch (error) {
      logger.error('生成支付二维码失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: error.message || '生成支付二维码失败',
        data: null
      };
    }
  }

  /**
   * 批量处理违章押金自动退还
   */
  async processViolationDepositAutoRefunds(ctx: Context): Promise<void> {
    try {
      const result = await this.orderService.processViolationDepositAutoRefunds();

      ctx.body = {
        success: true,
        message: '违章押金自动退还处理完成',
        data: result
      };
    } catch (error) {
      logger.error('违章押金自动退还处理失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: error.message || '违章押金自动退还处理失败',
        data: null
      };
    }
  }
}
import { AppDataSource } from '../config/database';
import { RefundRecord, RefundStatus } from '../entities/RefundRecord';
import { PaymentRecord, PaymentStatus } from '../entities/PaymentRecord';
import { PaymentPlatform } from '../entities/PaymentConfig';
import { Order, PaymentStatus as OrderPaymentStatus } from '../entities/Order';
import { generateRefundNumber } from '../utils/refund-number';
import { WalletService } from './wallet.service';
import { logger } from '../utils/logger';

/**
 * 退款服务
 */
export class RefundService {
  private refundRecordRepository = AppDataSource.getRepository(RefundRecord);
  private paymentRecordRepository = AppDataSource.getRepository(PaymentRecord);
  private orderRepository = AppDataSource.getRepository(Order);
  private walletService = new WalletService();

  /**
   * 创建退款申请
   * @param orderId 订单ID
   * @param reason 退款原因
   * @returns 退款记录
   */
  async createRefund(orderId: string, reason?: string): Promise<RefundRecord> {
    logger.info(`创建退款申请: 订单ID=${orderId}, 原因=${reason}`);

    // 1. 验证订单
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.paymentStatus !== OrderPaymentStatus.PAID) {
      throw new Error('订单未支付，无法退款');
    }

    // 2. 查找支付记录
    const paymentRecord = await this.paymentRecordRepository.findOne({
      where: { orderId, status: PaymentStatus.PAID },
    });

    if (!paymentRecord) {
      throw new Error('支付记录不存在');
    }

    // 3. 检查是否已有退款记录
    const existingRefund = await this.refundRecordRepository.findOne({
      where: { orderId },
    });

    if (existingRefund) {
      if (existingRefund.status === RefundStatus.REFUNDED) {
        throw new Error('订单已退款');
      }
      if (existingRefund.status === RefundStatus.PROCESSING) {
        throw new Error('退款处理中，请勿重复提交');
      }
      // 如果之前退款失败，可以重新创建
      logger.info(`订单已有退款记录（状态：${existingRefund.status}），将创建新的退款记录`);
    }

    // 4. 创建退款记录
    const refundNo = generateRefundNumber();
    const refundRecord = this.refundRecordRepository.create({
      refundNo,
      orderId,
      paymentRecordId: paymentRecord.id,
      amount: paymentRecord.amount,
      reason: reason || '用户申请退款',
      status: RefundStatus.PENDING,
    });

    await this.refundRecordRepository.save(refundRecord);
    logger.info(`退款记录创建成功: ${refundNo}`);

    return refundRecord;
  }

  /**
   * 处理退款
   * @param refundId 退款记录ID
   * @returns 退款记录
   */
  async processRefund(refundId: string): Promise<RefundRecord> {
    logger.info(`处理退款: 退款ID=${refundId}`);

    // 1. 查找退款记录
    const refundRecord = await this.refundRecordRepository.findOne({
      where: { id: refundId },
      relations: ['paymentRecord'],
    });

    if (!refundRecord) {
      throw new Error('退款记录不存在');
    }

    if (refundRecord.status === RefundStatus.REFUNDED) {
      throw new Error('退款已完成');
    }

    if (refundRecord.status === RefundStatus.PROCESSING) {
      throw new Error('退款处理中');
    }

    // 2. 更新退款状态为处理中
    refundRecord.status = RefundStatus.PROCESSING;
    await this.refundRecordRepository.save(refundRecord);

    try {
      // 3. 根据支付平台处理退款
      const paymentRecord = refundRecord.paymentRecord;

      if (paymentRecord.platform === PaymentPlatform.WALLET) {
        await this.processWalletRefund(refundRecord, paymentRecord);
      } else if (paymentRecord.platform === PaymentPlatform.WECHAT) {
        await this.processWechatRefund(refundRecord, paymentRecord);
      } else if (paymentRecord.platform === PaymentPlatform.ALIPAY) {
        await this.processAlipayRefund(refundRecord, paymentRecord);
      } else {
        throw new Error('不支持的支付平台');
      }

      return refundRecord;
    } catch (error: any) {
      // 退款失败，更新状态
      refundRecord.status = RefundStatus.FAILED;
      refundRecord.failureReason = error.message;
      await this.refundRecordRepository.save(refundRecord);
      throw error;
    }
  }

  /**
   * 处理钱包退款
   */
  private async processWalletRefund(
    refundRecord: RefundRecord,
    paymentRecord: PaymentRecord
  ): Promise<void> {
    logger.info(`处理钱包退款: 退款单号=${refundRecord.refundNo}, 金额=${refundRecord.amount}`);

    // 1. 增加钱包余额
    await this.walletService.refund(
      paymentRecord.userId,
      Number(refundRecord.amount),
      refundRecord.orderId,
      'ORDER',
      `订单退款: ${refundRecord.orderId}`
    );

    // 2. 更新退款记录状态
    refundRecord.status = RefundStatus.REFUNDED;
    refundRecord.refundedAt = new Date();
    await this.refundRecordRepository.save(refundRecord);

    // 3. 更新订单支付状态
    await this.orderRepository.update(
      { id: refundRecord.orderId },
      { paymentStatus: OrderPaymentStatus.REFUNDED }
    );

    // 4. 更新支付记录状态
    await this.paymentRecordRepository.update(
      { id: paymentRecord.id },
      { status: PaymentStatus.REFUNDED }
    );

    logger.info(`钱包退款成功: ${refundRecord.refundNo}`);
  }

  /**
   * 处理微信退款（预留）
   */
  private async processWechatRefund(
    _refundRecord: RefundRecord,
    _paymentRecord: PaymentRecord
  ): Promise<void> {
    logger.info(`处理微信退款（预留功能）`);
    throw new Error('微信退款功能暂未实现');

    // TODO: 实现微信退款
    // const wechatPay = new WechatPay(config);
    // const result = await wechatPay.refund({
    //   outTradeNo: paymentRecord.paymentNo,
    //   outRefundNo: refundRecord.refundNo,
    //   totalFee: Number(paymentRecord.amount) * 100,
    //   refundFee: Number(refundRecord.amount) * 100,
    // });
    //
    // refundRecord.thirdPartyRefundNo = result.refundId;
    // refundRecord.status = RefundStatus.REFUNDED;
    // refundRecord.refundedAt = new Date();
    // await this.refundRecordRepository.save(refundRecord);
  }

  /**
   * 处理支付宝退款（预留）
   */
  private async processAlipayRefund(
    _refundRecord: RefundRecord,
    _paymentRecord: PaymentRecord
  ): Promise<void> {
    logger.info(`处理支付宝退款（预留功能）`);
    throw new Error('支付宝退款功能暂未实现');

    // TODO: 实现支付宝退款
    // const alipay = new Alipay(config);
    // const result = await alipay.refund({
    //   outTradeNo: paymentRecord.paymentNo,
    //   refundAmount: Number(refundRecord.amount),
    //   refundReason: refundRecord.reason,
    // });
    //
    // refundRecord.thirdPartyRefundNo = result.tradeNo;
    // refundRecord.status = RefundStatus.REFUNDED;
    // refundRecord.refundedAt = new Date();
    // await this.refundRecordRepository.save(refundRecord);
  }

  /**
   * 处理退款回调（预留）
   */
  async handleRefundCallback(platform: PaymentPlatform, _params: any): Promise<void> {
    logger.info(`处理退款回调: 平台=${platform}`);

    // TODO: 实现退款回调处理
    // 1. 验证签名
    // 2. 查找退款记录
    // 3. 更新退款状态
    // 4. 更新订单支付状态

    throw new Error('退款回调功能暂未实现');
  }

  /**
   * 查询退款状态
   * @param refundNo 退款单号
   * @returns 退款记录
   */
  async queryRefundStatus(refundNo: string): Promise<RefundRecord> {
    logger.info(`查询退款状态: 退款单号=${refundNo}`);

    const refundRecord = await this.refundRecordRepository.findOne({
      where: { refundNo },
    });

    if (!refundRecord) {
      throw new Error('退款记录不存在');
    }

    return refundRecord;
  }

  /**
   * 获取退款详情
   * @param refundId 退款ID
   * @returns 退款记录
   */
  async getRefundDetail(refundId: string): Promise<RefundRecord> {
    logger.info(`获取退款详情: 退款ID=${refundId}`);

    const refundRecord = await this.refundRecordRepository.findOne({
      where: { id: refundId },
      relations: ['order', 'paymentRecord'],
    });

    if (!refundRecord) {
      throw new Error('退款记录不存在');
    }

    return refundRecord;
  }
}

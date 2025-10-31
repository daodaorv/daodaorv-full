import { AppDataSource } from '../config/database';
import { PaymentRecord, PaymentStatus } from '../entities/PaymentRecord';
import { PaymentConfig, PaymentPlatform } from '../entities/PaymentConfig';
import { Order } from '../entities/Order';
import { OrderStatus, PaymentStatus as OrderPaymentStatus } from '../entities/Order';
import { generatePaymentNumber } from '../utils/payment-number';
import { WechatPay } from '../utils/wechat-pay';
import { Alipay } from '../utils/alipay';
import { WalletService } from './wallet.service';
import { logger } from '../utils/logger';

/**
 * 支付服务
 */
export class PaymentService {
  private paymentRecordRepository = AppDataSource.getRepository(PaymentRecord);
  private paymentConfigRepository = AppDataSource.getRepository(PaymentConfig);
  private orderRepository = AppDataSource.getRepository(Order);
  private walletService = new WalletService();

  /**
   * 创建支付
   * @param orderId 订单ID
   * @param userId 用户ID
   * @param platform 支付平台
   * @param amount 支付金额
   * @returns 支付记录和支付参数
   */
  async createPayment(
    orderId: string,
    userId: string,
    platform: PaymentPlatform,
    amount: number
  ): Promise<{ paymentRecord: PaymentRecord; paymentParams?: any }> {
    logger.info(`创建支付: 订单ID=${orderId}, 用户ID=${userId}, 平台=${platform}, 金额=${amount}`);

    // 1. 验证订单
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new Error('订单状态不正确，无法支付');
    }

    if (Number(order.totalPrice) !== amount) {
      throw new Error('支付金额与订单金额不一致');
    }

    // 2. 检查是否已有待支付记录
    const existingPayment = await this.paymentRecordRepository.findOne({
      where: { orderId, status: PaymentStatus.PENDING },
    });

    if (existingPayment) {
      logger.info(`订单已有待支付记录: ${existingPayment.paymentNo}`);
      return { paymentRecord: existingPayment };
    }

    // 3. 根据支付平台处理
    if (platform === PaymentPlatform.WALLET) {
      return await this.processWalletPayment(orderId, userId, amount);
    } else if (platform === PaymentPlatform.WECHAT) {
      return await this.processWechatPayment(orderId, userId, amount);
    } else if (platform === PaymentPlatform.ALIPAY) {
      return await this.processAlipayPayment(orderId, userId, amount);
    } else {
      throw new Error('不支持的支付平台');
    }
  }

  /**
   * 处理钱包余额支付
   */
  private async processWalletPayment(
    orderId: string,
    userId: string,
    amount: number
  ): Promise<{ paymentRecord: PaymentRecord }> {
    logger.info(`处理钱包支付: 订单ID=${orderId}, 金额=${amount}`);

    // 1. 创建支付记录
    const paymentNo = generatePaymentNumber();
    const paymentRecord = this.paymentRecordRepository.create({
      paymentNo,
      orderId,
      userId,
      amount,
      platform: PaymentPlatform.WALLET,
      status: PaymentStatus.PENDING,
      expiredAt: new Date(Date.now() + 15 * 60 * 1000), // 15分钟后过期
    });

    await this.paymentRecordRepository.save(paymentRecord);

    // 2. 扣减钱包余额
    try {
      await this.walletService.consume({
        userId,
        amount,
        relatedId: orderId,
        relatedType: 'ORDER',
        description: `订单支付: ${orderId}`,
      });

      // 3. 更新支付记录状态
      paymentRecord.status = PaymentStatus.PAID;
      paymentRecord.paidAt = new Date();
      await this.paymentRecordRepository.save(paymentRecord);

      // 4. 更新订单状态
      await this.updateOrderPaymentStatus(orderId, OrderPaymentStatus.PAID);

      logger.info(`钱包支付成功: ${paymentNo}`);

      return { paymentRecord };
    } catch (error: any) {
      // 支付失败，更新支付记录状态
      paymentRecord.status = PaymentStatus.FAILED;
      paymentRecord.remark = error.message;
      await this.paymentRecordRepository.save(paymentRecord);

      throw error;
    }
  }

  /**
   * 处理微信支付（预留）
   */
  private async processWechatPayment(
    orderId: string,
    userId: string,
    amount: number
  ): Promise<{ paymentRecord: PaymentRecord; paymentParams: any }> {
    logger.info(`处理微信支付: 订单ID=${orderId}, 金额=${amount}`);

    // 1. 获取微信支付配置
    const config = await this.paymentConfigRepository.findOne({
      where: { platform: PaymentPlatform.WECHAT, isEnabled: true },
    });

    if (!config) {
      throw new Error('微信支付未配置或未启用');
    }

    // 2. 创建支付记录
    const paymentNo = generatePaymentNumber();
    const paymentRecord = this.paymentRecordRepository.create({
      paymentNo,
      orderId,
      userId,
      amount,
      platform: PaymentPlatform.WECHAT,
      status: PaymentStatus.PENDING,
      expiredAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    await this.paymentRecordRepository.save(paymentRecord);

    // 3. 调用微信支付接口（预留）
    try {
      const wechatPay = new WechatPay(config.config as any);
      const result = await wechatPay.createOrder({
        outTradeNo: paymentNo,
        totalFee: Math.round(amount * 100), // 转换为分
        body: `订单支付-${orderId}`,
        notifyUrl: `${process.env.API_BASE_URL}/api/payment/wechat/callback`,
      });

      // 4. 保存支付参数
      paymentRecord.thirdPartyOrderNo = result.prepay_id;
      paymentRecord.paymentParams = result;
      paymentRecord.status = PaymentStatus.PAYING;
      await this.paymentRecordRepository.save(paymentRecord);

      logger.info(`微信支付订单创建成功: ${paymentNo}`);

      return { paymentRecord, paymentParams: result };
    } catch (error: any) {
      // 支付失败，更新支付记录状态
      paymentRecord.status = PaymentStatus.FAILED;
      paymentRecord.remark = error.message;
      await this.paymentRecordRepository.save(paymentRecord);

      throw error;
    }
  }

  /**
   * 处理支付宝支付（预留）
   */
  private async processAlipayPayment(
    orderId: string,
    userId: string,
    amount: number
  ): Promise<{ paymentRecord: PaymentRecord; paymentParams: any }> {
    logger.info(`处理支付宝支付: 订单ID=${orderId}, 金额=${amount}`);

    // 1. 获取支付宝配置
    const config = await this.paymentConfigRepository.findOne({
      where: { platform: PaymentPlatform.ALIPAY, isEnabled: true },
    });

    if (!config) {
      throw new Error('支付宝支付未配置或未启用');
    }

    // 2. 创建支付记录
    const paymentNo = generatePaymentNumber();
    const paymentRecord = this.paymentRecordRepository.create({
      paymentNo,
      orderId,
      userId,
      amount,
      platform: PaymentPlatform.ALIPAY,
      status: PaymentStatus.PENDING,
      expiredAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    await this.paymentRecordRepository.save(paymentRecord);

    // 3. 调用支付宝接口（预留）
    try {
      const alipay = new Alipay(config.config as any);
      const result = await alipay.createOrder({
        outTradeNo: paymentNo,
        totalAmount: amount.toFixed(2),
        subject: `订单支付-${orderId}`,
        notifyUrl: `${process.env.API_BASE_URL}/api/payment/alipay/callback`,
      });

      // 4. 保存支付参数
      paymentRecord.thirdPartyOrderNo = result.trade_no;
      paymentRecord.paymentParams = result;
      paymentRecord.status = PaymentStatus.PAYING;
      await this.paymentRecordRepository.save(paymentRecord);

      logger.info(`支付宝支付订单创建成功: ${paymentNo}`);

      return { paymentRecord, paymentParams: result };
    } catch (error: any) {
      // 支付失败，更新支付记录状态
      paymentRecord.status = PaymentStatus.FAILED;
      paymentRecord.remark = error.message;
      await this.paymentRecordRepository.save(paymentRecord);

      throw error;
    }
  }

  /**
   * 更新订单支付状态
   */
  private async updateOrderPaymentStatus(
    orderId: string,
    paymentStatus: OrderPaymentStatus
  ): Promise<void> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new Error('订单不存在');
    }

    order.paymentStatus = paymentStatus;

    // 如果支付成功，更新订单状态为已支付
    if (paymentStatus === OrderPaymentStatus.PAID) {
      order.status = OrderStatus.PAID;
    }

    await this.orderRepository.save(order);
    logger.info(`订单支付状态已更新: ${orderId} -> ${paymentStatus}`);
  }

  /**
   * 处理支付回调（微信/支付宝）
   * @param platform 支付平台
   * @param params 回调参数
   * @returns 是否处理成功
   */
  async handlePaymentCallback(
    platform: PaymentPlatform,
    params: Record<string, any>
  ): Promise<boolean> {
    logger.info(`收到支付回调: 平台=${platform}`);

    try {
      // 1. 验证签名
      const config = await this.paymentConfigRepository.findOne({
        where: { platform, isEnabled: true },
      });

      if (!config) {
        logger.error(`支付平台未配置: ${platform}`);
        return false;
      }

      let isValid = false;
      let paymentNo = '';
      let thirdPartyTransactionNo = '';

      if (platform === PaymentPlatform.WECHAT) {
        const wechatPay = new WechatPay(config.config as any);
        isValid = wechatPay.verifySignature(params);
        paymentNo = params.out_trade_no;
        thirdPartyTransactionNo = params.transaction_id;
      } else if (platform === PaymentPlatform.ALIPAY) {
        const alipay = new Alipay(config.config as any);
        isValid = alipay.verifySignature(params);
        paymentNo = params.out_trade_no;
        thirdPartyTransactionNo = params.trade_no;
      }

      if (!isValid) {
        logger.error(`支付回调签名验证失败: ${platform}`);
        return false;
      }

      // 2. 查找支付记录
      const paymentRecord = await this.paymentRecordRepository.findOne({
        where: { paymentNo },
      });

      if (!paymentRecord) {
        logger.error(`支付记录不存在: ${paymentNo}`);
        return false;
      }

      // 3. 幂等处理：如果已经支付成功，直接返回成功
      if (paymentRecord.status === PaymentStatus.PAID) {
        logger.info(`支付记录已处理（幂等）: ${paymentNo}`);
        return true;
      }

      // 4. 更新支付记录
      paymentRecord.status = PaymentStatus.PAID;
      paymentRecord.thirdPartyTransactionNo = thirdPartyTransactionNo;
      paymentRecord.paidAt = new Date();
      await this.paymentRecordRepository.save(paymentRecord);

      // 5. 更新订单状态
      await this.updateOrderPaymentStatus(paymentRecord.orderId, OrderPaymentStatus.PAID);

      logger.info(`支付回调处理成功: ${paymentNo}`);
      return true;
    } catch (error: any) {
      logger.error(`支付回调处理失败:`, error);
      return false;
    }
  }

  /**
   * 查询支付状态
   * @param paymentNo 支付单号
   * @returns 支付记录
   */
  async queryPaymentStatus(paymentNo: string): Promise<PaymentRecord> {
    const paymentRecord = await this.paymentRecordRepository.findOne({
      where: { paymentNo },
      relations: ['order'],
    });

    if (!paymentRecord) {
      throw new Error('支付记录不存在');
    }

    return paymentRecord;
  }

  /**
   * 取消支付
   * @param paymentNo 支付单号
   */
  async cancelPayment(paymentNo: string): Promise<void> {
    const paymentRecord = await this.paymentRecordRepository.findOne({
      where: { paymentNo },
    });

    if (!paymentRecord) {
      throw new Error('支付记录不存在');
    }

    if (paymentRecord.status === PaymentStatus.PAID) {
      throw new Error('支付已完成，无法取消');
    }

    paymentRecord.status = PaymentStatus.CANCELLED;
    await this.paymentRecordRepository.save(paymentRecord);

    logger.info(`支付已取消: ${paymentNo}`);
  }

  /**
   * 获取支付配置
   * @param platform 支付平台
   * @returns 支付配置
   */
  async getPaymentConfig(platform: PaymentPlatform): Promise<PaymentConfig | null> {
    return await this.paymentConfigRepository.findOne({
      where: { platform },
    });
  }

  /**
   * 更新支付配置
   * @param platform 支付平台
   * @param config 配置参数
   * @param isEnabled 是否启用
   * @returns 支付配置
   */
  async updatePaymentConfig(
    platform: PaymentPlatform,
    config: Record<string, any>,
    isEnabled: boolean
  ): Promise<PaymentConfig> {
    let paymentConfig = await this.paymentConfigRepository.findOne({
      where: { platform },
    });

    if (paymentConfig) {
      paymentConfig.config = config;
      paymentConfig.isEnabled = isEnabled;
    } else {
      paymentConfig = this.paymentConfigRepository.create({
        platform,
        config,
        isEnabled,
      });
    }

    await this.paymentConfigRepository.save(paymentConfig);
    logger.info(`支付配置已更新: ${platform}`);

    return paymentConfig;
  }
}

export const paymentService = new PaymentService();

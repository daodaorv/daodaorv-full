import { generateSignature, generateNonceStr } from './payment-signature';

/**
 * 微信支付配置接口
 */
export interface WechatPayConfig {
  appId: string; // 应用ID
  mchId: string; // 商户号
  apiKey: string; // API密钥
  certPath?: string; // 证书路径（退款时需要）
}

/**
 * 微信支付工具类（预留接口）
 *
 * 注意：当前为预留接口，等待微信支付配置后实现
 * 需要安装依赖：npm install wechatpay-node-v3
 */
export class WechatPay {
  private config: WechatPayConfig;

  constructor(config: WechatPayConfig) {
    this.config = config;
  }

  /**
   * 统一下单（预留）
   * @param _params 订单参数
   * @returns 支付参数
   */
  async createOrder(_params: {
    outTradeNo: string; // 商户订单号
    totalFee: number; // 总金额（分）
    body: string; // 商品描述
    notifyUrl: string; // 回调地址
    openid?: string; // 用户openid（小程序支付需要）
  }): Promise<any> {
    // TODO: 实现微信统一下单接口
    // 参考文档：https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_5_1.shtml

    console.warn('⚠️ 微信支付统一下单接口未实现（预留）');

    throw new Error('微信支付功能暂未配置，请联系管理员');
  }

  /**
   * 查询订单（预留）
   * @param _outTradeNo 商户订单号
   * @returns 订单信息
   */
  async queryOrder(_outTradeNo: string): Promise<any> {
    // TODO: 实现微信查询订单接口
    // 参考文档：https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_5_2.shtml

    console.warn('⚠️ 微信支付查询订单接口未实现（预留）');

    throw new Error('微信支付功能暂未配置，请联系管理员');
  }

  /**
   * 关闭订单（预留）
   * @param _outTradeNo 商户订单号
   */
  async closeOrder(_outTradeNo: string): Promise<void> {
    // TODO: 实现微信关闭订单接口
    // 参考文档：https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_5_3.shtml

    console.warn('⚠️ 微信支付关闭订单接口未实现（预留）');

    throw new Error('微信支付功能暂未配置，请联系管理员');
  }

  /**
   * 申请退款（预留）
   * @param _params 退款参数
   */
  async refund(_params: {
    outTradeNo: string; // 商户订单号
    outRefundNo: string; // 商户退款单号
    totalFee: number; // 订单总金额（分）
    refundFee: number; // 退款金额（分）
    refundDesc?: string; // 退款原因
  }): Promise<any> {
    // TODO: 实现微信退款接口
    // 参考文档：https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_5_9.shtml

    console.warn('⚠️ 微信支付退款接口未实现（预留）');

    throw new Error('微信支付功能暂未配置，请联系管理员');
  }

  /**
   * 验证回调签名（预留）
   * @param _params 回调参数
   * @returns 是否验证通过
   */
  verifySignature(_params: Record<string, any>): boolean {
    // TODO: 实现微信支付回调签名验证
    // 参考文档：https://pay.weixin.qq.com/wiki/doc/apiv3/wechatpay/wechatpay4_1.shtml

    console.warn('⚠️ 微信支付签名验证接口未实现（预留）');

    // 临时返回false，等待实现
    return false;
  }

  /**
   * 生成小程序支付参数（预留）
   * @param prepayId 预支付ID
   * @returns 小程序支付参数
   */
  generateMiniProgramPayParams(prepayId: string): any {
    // TODO: 实现小程序支付参数生成

    const timeStamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = generateNonceStr();
    const packageStr = `prepay_id=${prepayId}`;
    const signType = 'MD5';

    const paySign = generateSignature(
      {
        appId: this.config.appId,
        timeStamp,
        nonceStr,
        package: packageStr,
        signType,
      },
      this.config.apiKey
    );

    return {
      timeStamp,
      nonceStr,
      package: packageStr,
      signType,
      paySign,
    };
  }
}

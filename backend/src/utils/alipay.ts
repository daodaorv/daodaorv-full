/**
 * 支付宝支付配置接口
 */
export interface AlipayConfig {
  appId: string; // 应用ID
  privateKey: string; // 应用私钥
  publicKey: string; // 支付宝公钥
  gateway?: string; // 网关地址，默认：https://openapi.alipay.com/gateway.do
}

/**
 * 支付宝支付工具类（预留接口）
 *
 * 注意：当前为预留接口，等待支付宝配置后实现
 * 需要安装依赖：npm install alipay-sdk
 */
export class Alipay {
  private config: AlipayConfig;

  constructor(config: AlipayConfig) {
    this.config = config;
    this.config.gateway = config.gateway || 'https://openapi.alipay.com/gateway.do';
  }

  /**
   * 统一下单（预留）
   * @param _params 订单参数
   * @returns 支付参数
   */
  async createOrder(_params: {
    outTradeNo: string; // 商户订单号
    totalAmount: string; // 订单总金额（元）
    subject: string; // 订单标题
    body?: string; // 订单描述
    notifyUrl: string; // 回调地址
  }): Promise<any> {
    // TODO: 实现支付宝统一下单接口
    // 参考文档：https://opendocs.alipay.com/open/02ivbs

    console.warn('⚠️ 支付宝统一下单接口未实现（预留）');

    throw new Error('支付宝支付功能暂未配置，请联系管理员');
  }

  /**
   * 查询订单（预留）
   * @param _outTradeNo 商户订单号
   * @returns 订单信息
   */
  async queryOrder(_outTradeNo: string): Promise<any> {
    // TODO: 实现支付宝查询订单接口
    // 参考文档：https://opendocs.alipay.com/open/02ivbt

    console.warn('⚠️ 支付宝查询订单接口未实现（预留）');

    throw new Error('支付宝支付功能暂未配置，请联系管理员');
  }

  /**
   * 关闭订单（预留）
   * @param _outTradeNo 商户订单号
   */
  async closeOrder(_outTradeNo: string): Promise<void> {
    // TODO: 实现支付宝关闭订单接口
    // 参考文档：https://opendocs.alipay.com/open/02e7gq

    console.warn('⚠️ 支付宝关闭订单接口未实现（预留）');

    throw new Error('支付宝支付功能暂未配置，请联系管理员');
  }

  /**
   * 申请退款（预留）
   * @param _params 退款参数
   */
  async refund(_params: {
    outTradeNo: string; // 商户订单号
    refundAmount: string; // 退款金额（元）
    refundReason?: string; // 退款原因
  }): Promise<any> {
    // TODO: 实现支付宝退款接口
    // 参考文档：https://opendocs.alipay.com/open/02e7go

    console.warn('⚠️ 支付宝退款接口未实现（预留）');

    throw new Error('支付宝支付功能暂未配置，请联系管理员');
  }

  /**
   * 验证回调签名（预留）
   * @param _params 回调参数
   * @returns 是否验证通过
   */
  verifySignature(_params: Record<string, any>): boolean {
    // TODO: 实现支付宝回调签名验证
    // 参考文档：https://opendocs.alipay.com/open/270/105902

    console.warn('⚠️ 支付宝签名验证接口未实现（预留）');

    // 临时返回false，等待实现
    return false;
  }

  /**
   * 生成小程序支付参数（预留）
   * @param tradeNo 支付宝交易号
   * @returns 小程序支付参数
   */
  generateMiniProgramPayParams(tradeNo: string): any {
    // TODO: 实现小程序支付参数生成

    console.warn('⚠️ 支付宝小程序支付参数生成未实现（预留）');

    return {
      tradeNO: tradeNo,
    };
  }
}

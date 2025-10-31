import axios from 'axios';
import { logger } from './logger';

export interface WechatLoginConfig {
  appId: string;
  appSecret: string;
}

export interface WechatLoginResult {
  openid: string;
  session_key: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

/**
 * 微信小程序登录工具类
 */
export class WechatLogin {
  private config: WechatLoginConfig;

  constructor(config: WechatLoginConfig) {
    this.config = config;
  }

  /**
   * 通过 code 换取 openid 和 session_key
   * @param code 小程序登录凭证
   * @returns 登录结果
   */
  async code2Session(code: string): Promise<WechatLoginResult> {
    try {
      const url = 'https://api.weixin.qq.com/sns/jscode2session';
      const params = {
        appid: this.config.appId,
        secret: this.config.appSecret,
        js_code: code,
        grant_type: 'authorization_code',
      };

      logger.info(`微信登录请求: code=${code.substring(0, 10)}...`);

      const response = await axios.get<WechatLoginResult>(url, { params });
      const result = response.data;

      if (result.errcode) {
        logger.error(`微信登录失败: ${result.errcode} - ${result.errmsg}`);
        throw new Error(`微信登录失败: ${result.errmsg}`);
      }

      logger.info(`微信登录成功: openid=${result.openid}`);
      return result;
    } catch (error: any) {
      logger.error('微信登录异常:', error);
      throw new Error(error.message || '微信登录失败');
    }
  }

  /**
   * 解密微信用户信息
   * @param encryptedData 加密数据
   * @param iv 初始向量
   * @param sessionKey 会话密钥
   * @returns 用户信息
   */
  decryptUserInfo(
    _encryptedData: string,
    _iv: string,
    _sessionKey: string
  ): any {
    // TODO: 实现微信用户信息解密
    // 参考文档：https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/signature.html
    
    console.warn('⚠️ 微信用户信息解密接口未实现（预留）');
    throw new Error('微信用户信息解密功能暂未实现');
  }
}


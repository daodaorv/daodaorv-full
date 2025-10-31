import axios from 'axios';
import { logger } from './logger';

export interface AlipayLoginConfig {
  appId: string;
  privateKey: string;
  alipayPublicKey: string;
  gateway?: string;
}

export interface AlipayLoginResult {
  user_id: string;
  access_token: string;
  expires_in: number;
  refresh_token: string;
  re_expires_in: number;
}

/**
 * 支付宝小程序登录工具类（预留接口）
 * 
 * 注意：当前为预留接口，等待支付宝配置后实现
 * 需要安装依赖：npm install alipay-sdk
 */
export class AlipayLogin {
  private config: AlipayLoginConfig;

  constructor(config: AlipayLoginConfig) {
    this.config = config;
    this.config.gateway = config.gateway || 'https://openapi.alipay.com/gateway.do';
  }

  /**
   * 通过 authCode 换取 userId 和 access_token
   * @param authCode 授权码
   * @returns 登录结果
   */
  async getAccessToken(_authCode: string): Promise<AlipayLoginResult> {
    try {
      // TODO: 实现支付宝登录接口
      // 参考文档：https://opendocs.alipay.com/mini/introduce/authcode

      logger.warn('⚠️ 支付宝登录接口未实现（预留）');

      throw new Error('支付宝登录功能暂未配置，请联系管理员');
    } catch (error: any) {
      logger.error('支付宝登录异常:', error);
      throw new Error(error.message || '支付宝登录失败');
    }
  }

  /**
   * 获取支付宝用户信息
   * @param accessToken 访问令牌
   * @returns 用户信息
   */
  async getUserInfo(_accessToken: string): Promise<any> {
    try {
      // TODO: 实现支付宝获取用户信息接口
      // 参考文档：https://opendocs.alipay.com/mini/api/userinfo

      logger.warn('⚠️ 支付宝获取用户信息接口未实现（预留）');

      throw new Error('支付宝获取用户信息功能暂未配置，请联系管理员');
    } catch (error: any) {
      logger.error('支付宝获取用户信息异常:', error);
      throw new Error(error.message || '获取用户信息失败');
    }
  }
}


import axios from 'axios';
import { logger } from './logger';

export interface DouyinLoginConfig {
  appId: string;
  appSecret: string;
}

export interface DouyinLoginResult {
  openid: string;
  session_key: string;
  anonymous_openid?: string;
  errcode?: number;
  errmsg?: string;
}

/**
 * 抖音小程序登录工具类（预留接口）
 * 
 * 注意：当前为预留接口，等待抖音配置后实现
 */
export class DouyinLogin {
  private config: DouyinLoginConfig;

  constructor(config: DouyinLoginConfig) {
    this.config = config;
  }

  /**
   * 通过 code 换取 openid 和 session_key
   * @param code 小程序登录凭证
   * @returns 登录结果
   */
  async code2Session(_code: string): Promise<DouyinLoginResult> {
    try {
      // TODO: 实现抖音登录接口
      // 参考文档：https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/server/log-in/code-2-session

      logger.warn('⚠️ 抖音登录接口未实现（预留）');

      throw new Error('抖音登录功能暂未配置，请联系管理员');
    } catch (error: any) {
      logger.error('抖音登录异常:', error);
      throw new Error(error.message || '抖音登录失败');
    }
  }

  /**
   * 获取抖音用户信息
   * @param openid 用户唯一标识
   * @param accessToken 访问令牌
   * @returns 用户信息
   */
  async getUserInfo(_openid: string, _accessToken: string): Promise<any> {
    try {
      // TODO: 实现抖音获取用户信息接口
      // 参考文档：https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/server/data-caching/user-info

      logger.warn('⚠️ 抖音获取用户信息接口未实现（预留）');

      throw new Error('抖音获取用户信息功能暂未配置，请联系管理员');
    } catch (error: any) {
      logger.error('抖音获取用户信息异常:', error);
      throw new Error(error.message || '获取用户信息失败');
    }
  }
}


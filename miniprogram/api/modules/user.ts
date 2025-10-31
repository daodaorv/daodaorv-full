/**
 * 用户相关 API
 */

import { post, get } from "@/utils/request";

/**
 * 登录参数
 */
export interface LoginParams {
  phone: string;
  password: string;
}

/**
 * 微信登录参数
 */
export interface WechatLoginParams {
  code: string;
  nickname?: string;
  avatar?: string;
}

/**
 * 支付宝登录参数
 */
export interface AlipayLoginParams {
  authCode: string;
}

/**
 * 抖音登录参数
 */
export interface DouyinLoginParams {
  code: string;
  nickname?: string;
  avatar?: string;
}

/**
 * 手机号验证码登录参数
 */
export interface SmsLoginParams {
  phone: string;
  code: string;
}

/**
 * 登录结果
 */
export interface LoginResult {
  token: string;
  user: UserInfo;
}

/**
 * 用户信息
 */
export interface UserInfo {
  id: string;
  phone: string;
  nickname: string;
  avatar: string;
  realName?: string;
  idCard?: string;
  driverLicense?: string;
  /** 是否已实名认证 */
  isRealNameVerified?: boolean;
  /** 是否已驾照认证 */
  isDriverLicenseVerified?: boolean;
}

/**
 * 登录
 */
export function login(data: LoginParams) {
  return post<LoginResult>("/auth/login", data);
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return get<UserInfo>("/user/info");
}

/**
 * 更新用户信息
 */
export function updateUserInfo(data: Partial<UserInfo>) {
  return post<UserInfo>("/user/update", data);
}

/**
 * 微信一键登录
 */
export function wechatLogin(data: WechatLoginParams) {
  return post<LoginResult>("/auth/wechat-login", data);
}

/**
 * 支付宝一键登录
 */
export function alipayLogin(data: AlipayLoginParams) {
  return post<LoginResult>("/auth/alipay-login", data);
}

/**
 * 抖音一键登录
 */
export function douyinLogin(data: DouyinLoginParams) {
  return post<LoginResult>("/auth/douyin-login", data);
}

/**
 * 手机号验证码登录
 */
export function smsLogin(data: SmsLoginParams) {
  return post<LoginResult>("/auth/sms-login", data);
}

/**
 * 发送验证码
 */
export function sendCode(phone: string) {
  return post("/auth/send-code", { phone });
}

/**
 * 用户相关 API
 */

import { post, get } from '@/utils/request'

/**
 * 登录参数
 */
export interface LoginParams {
  phone: string
  password: string
}

/**
 * 登录结果
 */
export interface LoginResult {
  token: string
  userInfo: UserInfo
}

/**
 * 用户信息
 */
export interface UserInfo {
  id: string
  phone: string
  nickname: string
  avatar: string
  realName?: string
  role: string  // 管理员角色
  storeId?: string  // 门店ID
}

/**
 * 登录
 */
export function login(data: LoginParams) {
  return post<LoginResult>('/auth/login', data)
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return get<UserInfo>('/user/info')
}

/**
 * 更新用户信息
 */
export function updateUserInfo(data: Partial<UserInfo>) {
  return post<UserInfo>('/user/update', data)
}


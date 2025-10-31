/**
 * Token 存储工具
 */

const TOKEN_KEY = 'access_token'
const USER_INFO_KEY = 'user_info'

/**
 * 存储 Token
 */
export function setToken(token: string) {
  uni.setStorageSync(TOKEN_KEY, token)
}

/**
 * 获取 Token
 */
export function getToken(): string {
  return uni.getStorageSync(TOKEN_KEY) || ''
}

/**
 * 移除 Token
 */
export function removeToken() {
  uni.removeStorageSync(TOKEN_KEY)
}

/**
 * 存储用户信息
 */
export function setUserInfo(userInfo: any) {
  uni.setStorageSync(USER_INFO_KEY, JSON.stringify(userInfo))
}

/**
 * 获取用户信息
 */
export function getUserInfo(): any | null {
  const userInfo = uni.getStorageSync(USER_INFO_KEY)
  return userInfo ? JSON.parse(userInfo) : null
}

/**
 * 清除所有存储
 */
export function clearStorage() {
  uni.clearStorageSync()
}


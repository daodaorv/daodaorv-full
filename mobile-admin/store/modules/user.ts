/**
 * 用户状态管理
 */

import { defineStore } from 'pinia'
import { login as loginApi, getUserInfo as getUserInfoApi, type UserInfo, type LoginParams } from '@/api/modules/user'
import { setToken, getToken, removeToken, setUserInfo as saveUserInfo, clearStorage } from '@/utils/auth'

interface UserState {
  token: string
  userInfo: UserInfo | null
  isAuthenticated: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: getToken(),
    userInfo: null,
    isAuthenticated: false
  }),
  
  getters: {
    isLogin: (state) => !!state.token
  },
  
  actions: {
    /**
     * 登录
     */
    async login(params: LoginParams) {
      try {
        const { token, userInfo } = await loginApi(params)
        this.token = token
        this.userInfo = userInfo
        this.isAuthenticated = true
        setToken(token)
        saveUserInfo(userInfo)
        return true
      } catch (error) {
        console.error('登录失败', error)
        return false
      }
    },
    
    /**
     * 获取用户信息
     */
    async fetchUserInfo() {
      try {
        const userInfo = await getUserInfoApi()
        this.userInfo = userInfo
        this.isAuthenticated = true
        saveUserInfo(userInfo)
        return true
      } catch (error) {
        console.error('获取用户信息失败', error)
        this.logout()
        return false
      }
    },
    
    /**
     * 登出
     */
    logout() {
      this.token = ''
      this.userInfo = null
      this.isAuthenticated = false
      clearStorage()
      uni.reLaunch({ url: '/pages/login/index' })
    }
  }
})


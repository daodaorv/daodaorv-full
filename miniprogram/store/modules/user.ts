/**
 * 用户状态管理
 */

import { defineStore } from "pinia";
import {
  login as loginApi,
  getUserInfo as getUserInfoApi,
  wechatLogin as wechatLoginApi,
  alipayLogin as alipayLoginApi,
  douyinLogin as douyinLoginApi,
  smsLogin as smsLoginApi,
  sendCode as sendCodeApi,
  type UserInfo,
  type LoginParams,
  type WechatLoginParams,
  type AlipayLoginParams,
  type DouyinLoginParams,
  type SmsLoginParams,
} from "@/api/modules/user";
import {
  setToken,
  getToken,
  removeToken,
  setUserInfo as saveUserInfo,
  getUserInfo as getStoredUserInfo,
  clearStorage,
} from "@/utils/auth";

interface UserState {
  token: string;
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  redirectPath: string; // 登录后重定向路径
}

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    token: getToken(),
    userInfo: null,
    isAuthenticated: false,
    redirectPath: "",
  }),

  getters: {
    /** 是否已登录 */
    isLogin: (state) => !!state.token,

    /** 是否已实名认证 */
    isRealNameVerified: (state) => state.userInfo?.isRealNameVerified || false,

    /** 是否已驾照认证 */
    isDriverLicenseVerified: (state) =>
      state.userInfo?.isDriverLicenseVerified || false,

    /** 用户昵称 */
    nickname: (state) => state.userInfo?.nickname || "未登录",

    /** 用户头像 */
    avatar: (state) => state.userInfo?.avatar || "",
  },

  actions: {
    /**
     * 初始化用户状态(从 localStorage 恢复)
     */
    init() {
      const token = getToken();
      const userInfo = getStoredUserInfo();

      if (token) {
        this.token = token;
      }

      if (userInfo) {
        this.userInfo = userInfo;
        this.isAuthenticated = true;
      }
    },

    /**
     * 设置重定向路径
     */
    setRedirectPath(path: string) {
      this.redirectPath = path;
    },

    /**
     * 清除重定向路径
     */
    clearRedirectPath() {
      this.redirectPath = "";
    },

    /**
     * 登录
     */
    async login(params: LoginParams) {
      try {
        const { token, user } = await loginApi(params);
        this.token = token;
        this.userInfo = user;
        this.isAuthenticated = true;
        setToken(token);
        saveUserInfo(user);
        return true;
      } catch (error) {
        console.error("登录失败", error);
        throw error;
      }
    },

    /**
     * 微信一键登录
     */
    async wechatLogin(params: WechatLoginParams) {
      try {
        const { token, user } = await wechatLoginApi(params);
        this.token = token;
        this.userInfo = user;
        this.isAuthenticated = true;
        setToken(token);
        saveUserInfo(user);
        return true;
      } catch (error) {
        console.error("微信登录失败", error);
        throw error;
      }
    },

    /**
     * 支付宝一键登录
     */
    async alipayLogin(params: AlipayLoginParams) {
      try {
        const { token, user } = await alipayLoginApi(params);
        this.token = token;
        this.userInfo = user;
        this.isAuthenticated = true;
        setToken(token);
        saveUserInfo(user);
        return true;
      } catch (error) {
        console.error("支付宝登录失败", error);
        throw error;
      }
    },

    /**
     * 抖音一键登录
     */
    async douyinLogin(params: DouyinLoginParams) {
      try {
        const { token, user } = await douyinLoginApi(params);
        this.token = token;
        this.userInfo = user;
        this.isAuthenticated = true;
        setToken(token);
        saveUserInfo(user);
        return true;
      } catch (error) {
        console.error("抖音登录失败", error);
        throw error;
      }
    },

    /**
     * 手机号验证码登录
     */
    async smsLogin(params: SmsLoginParams) {
      try {
        const { token, user } = await smsLoginApi(params);
        this.token = token;
        this.userInfo = user;
        this.isAuthenticated = true;
        setToken(token);
        saveUserInfo(user);
        return true;
      } catch (error) {
        console.error("验证码登录失败", error);
        throw error;
      }
    },

    /**
     * 发送验证码
     */
    async sendCode(phone: string) {
      try {
        await sendCodeApi(phone);
        return true;
      } catch (error) {
        console.error("发送验证码失败", error);
        throw error;
      }
    },

    /**
     * 获取用户信息
     */
    async fetchUserInfo() {
      try {
        const userInfo = await getUserInfoApi();
        this.userInfo = userInfo;
        this.isAuthenticated = true;
        saveUserInfo(userInfo);
        return true;
      } catch (error) {
        console.error("获取用户信息失败", error);
        this.logout();
        return false;
      }
    },

    /**
     * 登出
     */
    logout() {
      this.token = "";
      this.userInfo = null;
      this.isAuthenticated = false;
      clearStorage();
      uni.reLaunch({ url: "/pages/login/index" });
    },
  },
});

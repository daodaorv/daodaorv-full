/**
 * 路由工具 - 统一路由跳转与权限拦截
 */

import {
  getPageAuthConfig,
  isWhitelistPage,
  isLoginRequired,
  isRealNameRequired,
  isDriverLicenseRequired,
  PageAuthType,
} from "@/config/page-auth";

/**
 * tabBar 页面列表(需要与 pages.json 中的 tabBar 配置保持一致)
 */
const TAB_BAR_PAGES = [
  "/pages/index/index",
  "/pages/community/index",
  "/pages/service/index",
  "/pages/mine/index",
];

/**
 * 路由拦截结果
 */
interface InterceptResult {
  /** 是否允许跳转 */
  allow: boolean;
  /** 拦截原因 */
  reason?: string;
  /** 重定向路径 */
  redirectPath?: string;
  /** 原始目标路径(用于登录后返回) */
  originalPath?: string;
}

/**
 * 路由跳转选项
 */
interface NavigateOptions {
  /** 页面路径 */
  url: string;
  /** 是否需要权限检查(默认 true) */
  checkAuth?: boolean;
  /** 成功回调 */
  success?: () => void;
  /** 失败回调 */
  fail?: (err: any) => void;
  /** 完成回调 */
  complete?: () => void;
  /** 其他参数 */
  [key: string]: any;
}

/**
 * 存储原始目标路径(用于登录后返回)
 */
const REDIRECT_PATH_KEY = "redirect_path";

/**
 * 检查是否为 tabBar 页面
 * @param url 页面路径
 * @returns 是否为 tabBar 页面
 */
function isTabBarPage(url: string): boolean {
  // 移除查询参数,获取纯路径
  const path = url.split("?")[0];
  return TAB_BAR_PAGES.includes(path);
}

/**
 * 保存重定向路径
 */
function saveRedirectPath(path: string) {
  uni.setStorageSync(REDIRECT_PATH_KEY, path);
}

/**
 * 获取重定向路径
 */
export function getRedirectPath(): string {
  return uni.getStorageSync(REDIRECT_PATH_KEY) || "";
}

/**
 * 清除重定向路径
 */
export function clearRedirectPath() {
  uni.removeStorageSync(REDIRECT_PATH_KEY);
}

/**
 * 获取用户信息(从 localStorage)
 */
function getUserInfo() {
  try {
    const userInfoStr = uni.getStorageSync("user_info");
    return userInfoStr ? JSON.parse(userInfoStr) : null;
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return null;
  }
}

/**
 * 检查是否登录
 */
function checkIsLogin(): boolean {
  const token = uni.getStorageSync("access_token");
  return !!token;
}

/**
 * 路由拦截器
 *
 * 业务逻辑说明:
 * - 当前业务中,用户只需登录后在订单页填写资料即可下单
 * - 实际核验在线下进行(门店取车/营地入住时核验证件原件)
 * - 线上提交资料 ≠ 线上认证,门店核验 ≠ 系统认证
 * - 实名/驾照认证检查保留用于未来扩展(如提现等金融操作)
 *
 * @param url 目标页面路径
 * @returns 拦截结果
 */
function routerInterceptor(url: string): InterceptResult {
  // 移除查询参数,获取纯路径
  const path = url.split("?")[0];

  // 白名单页面直接放行
  if (isWhitelistPage(path)) {
    return { allow: true };
  }

  // 获取用户状态
  const isLogin = checkIsLogin();
  const userInfo = getUserInfo();

  // 获取页面权限配置
  const config = getPageAuthConfig(path);

  // 如果没有配置,默认需要登录
  if (!config) {
    if (!isLogin) {
      return {
        allow: false,
        reason: "请先登录",
        redirectPath: "/pages/login/index",
        originalPath: url,
      };
    }
    return { allow: true };
  }

  // 检查登录状态
  if (isLoginRequired(path) && !isLogin) {
    return {
      allow: false,
      reason: "请先登录",
      redirectPath: config.redirectPath || "/pages/login/index",
      originalPath: url,
    };
  }

  // 检查实名认证状态(保留用于未来扩展,如提现等金融操作)
  // 注意: 当前业务中,订单页面只需登录,用户在页面内填写身份证资料即可
  if (isRealNameRequired(path)) {
    if (!userInfo?.isRealNameVerified) {
      return {
        allow: false,
        reason: "请先完成实名认证",
        redirectPath: config.redirectPath || "/pages/auth/real-name",
        originalPath: url,
      };
    }
  }

  // 检查驾照认证状态(保留用于未来扩展)
  // 注意: 当前业务中,房车租赁订单页只需登录,用户在页面内填写驾照资料即可
  if (isDriverLicenseRequired(path)) {
    if (!userInfo?.isDriverLicenseVerified) {
      return {
        allow: false,
        reason: "请先完成驾照认证",
        redirectPath: config.redirectPath || "/pages/auth/driver-license",
        originalPath: url,
      };
    }
  }

  // 所有检查通过
  return { allow: true };
}

/**
 * 显示拦截提示
 */
function showInterceptTip(reason: string) {
  uni.showToast({
    title: reason,
    icon: "none",
    duration: 2000,
  });
}

/**
 * 路由跳转 - navigateTo
 * 保留当前页面,跳转到应用内的某个页面
 * 注意: 如果目标页面是 tabBar 页面,会自动使用 switchTab
 */
export function navigateTo(options: NavigateOptions) {
  const { url, checkAuth = true, ...restOptions } = options;

  // 权限检查
  if (checkAuth) {
    const result = routerInterceptor(url);

    if (!result.allow) {
      // 保存原始目标路径
      if (result.originalPath) {
        saveRedirectPath(result.originalPath);
      }

      // 显示提示
      if (result.reason) {
        showInterceptTip(result.reason);
      }

      // 跳转到拦截页面
      if (result.redirectPath) {
        // 检查拦截页面是否为 tabBar 页面
        if (isTabBarPage(result.redirectPath)) {
          uni.switchTab({
            url: result.redirectPath,
            ...restOptions,
          });
        } else {
          uni.navigateTo({
            url: result.redirectPath,
            ...restOptions,
          });
        }
      }

      return;
    }
  }

  // 执行跳转 - 检查是否为 tabBar 页面
  if (isTabBarPage(url)) {
    uni.switchTab({
      url,
      ...restOptions,
    });
  } else {
    uni.navigateTo({
      url,
      ...restOptions,
    });
  }
}

/**
 * 路由跳转 - redirectTo
 * 关闭当前页面,跳转到应用内的某个页面
 * 注意: 如果目标页面是 tabBar 页面,会自动使用 switchTab
 */
export function redirectTo(options: NavigateOptions) {
  const { url, checkAuth = true, ...restOptions } = options;

  // 权限检查
  if (checkAuth) {
    const result = routerInterceptor(url);

    if (!result.allow) {
      // 保存原始目标路径
      if (result.originalPath) {
        saveRedirectPath(result.originalPath);
      }

      // 显示提示
      if (result.reason) {
        showInterceptTip(result.reason);
      }

      // 跳转到拦截页面
      if (result.redirectPath) {
        // 检查拦截页面是否为 tabBar 页面
        if (isTabBarPage(result.redirectPath)) {
          uni.switchTab({
            url: result.redirectPath,
            ...restOptions,
          });
        } else {
          uni.redirectTo({
            url: result.redirectPath,
            ...restOptions,
          });
        }
      }

      return;
    }
  }

  // 执行跳转 - 检查是否为 tabBar 页面
  if (isTabBarPage(url)) {
    uni.switchTab({
      url,
      ...restOptions,
    });
  } else {
    uni.redirectTo({
      url,
      ...restOptions,
    });
  }
}

/**
 * 路由跳转 - switchTab
 * 跳转到 tabBar 页面,并关闭其他所有非 tabBar 页面
 * TabBar 页面不需要权限检查
 */
export function switchTab(options: Omit<NavigateOptions, "checkAuth">) {
  const { url, ...restOptions } = options;

  uni.switchTab({
    url,
    ...restOptions,
  });
}

/**
 * 路由跳转 - reLaunch
 * 关闭所有页面,打开到应用内的某个页面
 * 注意: 如果目标页面是 tabBar 页面,会自动使用 switchTab
 */
export function reLaunch(options: NavigateOptions) {
  const { url, checkAuth = true, ...restOptions } = options;

  // 权限检查
  if (checkAuth) {
    const result = routerInterceptor(url);

    if (!result.allow) {
      // 保存原始目标路径
      if (result.originalPath) {
        saveRedirectPath(result.originalPath);
      }

      // 显示提示
      if (result.reason) {
        showInterceptTip(result.reason);
      }

      // 跳转到拦截页面
      if (result.redirectPath) {
        // 检查拦截页面是否为 tabBar 页面
        if (isTabBarPage(result.redirectPath)) {
          uni.switchTab({
            url: result.redirectPath,
            ...restOptions,
          });
        } else {
          uni.reLaunch({
            url: result.redirectPath,
            ...restOptions,
          });
        }
      }

      return;
    }
  }

  // 执行跳转 - 检查是否为 tabBar 页面
  if (isTabBarPage(url)) {
    uni.switchTab({
      url,
      ...restOptions,
    });
  } else {
    uni.reLaunch({
      url,
      ...restOptions,
    });
  }
}

/**
 * 路由跳转 - navigateBack
 * 关闭当前页面,返回上一页面或多级页面
 */
export function navigateBack(options: { delta?: number } = {}) {
  uni.navigateBack(options);
}

/**
 * 导出路由对象
 */
export const router = {
  navigateTo,
  redirectTo,
  switchTab,
  reLaunch,
  navigateBack,
  getRedirectPath,
  clearRedirectPath,
};

export default router;

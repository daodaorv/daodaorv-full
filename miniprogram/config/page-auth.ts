/**
 * 页面权限配置
 */

/**
 * 页面权限类型
 *
 * 注意:
 * - REAL_NAME_REQUIRED 和 DRIVER_LICENSE_REQUIRED 保留用于未来扩展(如提现、金融服务等)
 * - 当前业务逻辑:用户只需登录后在订单页填写资料即可下单,实际核验在线下进行
 * - 线上提交资料 ≠ 线上认证,门店核验 ≠ 系统认证
 */
export enum PageAuthType {
  /** 白名单页面(无需任何认证) */
  WHITELIST = "whitelist",
  /** 需要登录 */
  LOGIN_REQUIRED = "login_required",
  /** 需要实名认证(保留用于未来扩展,如提现等金融操作) */
  REAL_NAME_REQUIRED = "real_name_required",
  /** 需要驾照认证(保留用于未来扩展) */
  DRIVER_LICENSE_REQUIRED = "driver_license_required",
}

/**
 * 页面权限配置接口
 */
export interface PageAuthConfig {
  /** 页面路径 */
  path: string;
  /** 权限类型 */
  authType: PageAuthType;
  /** 拦截后跳转的页面 */
  redirectPath?: string;
}

/**
 * 页面权限配置列表
 */
const pageAuthConfigs: PageAuthConfig[] = [
  // ==================== 白名单页面 ====================
  {
    path: "/pages/index/index",
    authType: PageAuthType.WHITELIST,
  },
  {
    path: "/pages/community/index",
    authType: PageAuthType.WHITELIST,
  },
  {
    path: "/pages/login/index",
    authType: PageAuthType.WHITELIST,
  },

  // ==================== 需要登录的页面 ====================
  // TabBar 页面
  {
    path: "/pages/mine/index",
    authType: PageAuthType.LOGIN_REQUIRED,
    redirectPath: "/pages/login/index",
  },
  {
    path: "/pages/service/index",
    authType: PageAuthType.LOGIN_REQUIRED,
    redirectPath: "/pages/login/index",
  },

  // 订单相关页面(只需登录,用户在页面内填写资料)
  {
    path: "/pages/order/confirm",
    authType: PageAuthType.LOGIN_REQUIRED,
    redirectPath: "/pages/login/index",
  },
  {
    path: "/pages/order/detail",
    authType: PageAuthType.LOGIN_REQUIRED,
    redirectPath: "/pages/login/index",
  },
  {
    path: "/pages/order/list",
    authType: PageAuthType.LOGIN_REQUIRED,
    redirectPath: "/pages/login/index",
  },

  // 支付相关页面(只需登录)
  {
    path: "/pages/payment/index",
    authType: PageAuthType.LOGIN_REQUIRED,
    redirectPath: "/pages/login/index",
  },

  // 钱包相关页面
  {
    path: "/pages/wallet/index",
    authType: PageAuthType.LOGIN_REQUIRED,
    redirectPath: "/pages/login/index",
  },
  // 提现页面(需要实名认证 - 金融操作)
  {
    path: "/pages/wallet/withdraw",
    authType: PageAuthType.REAL_NAME_REQUIRED,
    redirectPath: "/pages/auth/real-name",
  },

  // 房车租赁相关页面(只需登录,用户在订单页填写驾照资料)
  {
    path: "/pages/rv-rental/order-confirm",
    authType: PageAuthType.LOGIN_REQUIRED,
    redirectPath: "/pages/login/index",
  },
  {
    path: "/pages/rv-rental/detail",
    authType: PageAuthType.LOGIN_REQUIRED,
    redirectPath: "/pages/login/index",
  },

  // 特惠租车相关页面(只需登录,用户在订单页填写驾照资料)
  {
    path: "/pages/special-offer/order-confirm",
    authType: PageAuthType.LOGIN_REQUIRED,
    redirectPath: "/pages/login/index",
  },

  // 营地预订相关页面(只需登录,用户在订单页填写身份证资料)
  {
    path: "/pages/campsite/order-confirm",
    authType: PageAuthType.LOGIN_REQUIRED,
    redirectPath: "/pages/login/index",
  },

  // 旅行预订相关页面(只需登录,用户在订单页填写身份证资料)
  {
    path: "/pages/travel/order-confirm",
    authType: PageAuthType.LOGIN_REQUIRED,
    redirectPath: "/pages/login/index",
  },

  // 众筹相关页面(只需登录,用户在页面内填写驾照资料)
  {
    path: "/pages/crowdfunding/invest",
    authType: PageAuthType.LOGIN_REQUIRED,
    redirectPath: "/pages/login/index",
  },
  {
    path: "/pages/crowdfunding/my-shares",
    authType: PageAuthType.LOGIN_REQUIRED,
    redirectPath: "/pages/login/index",
  },
];

/**
 * 获取页面权限配置
 * @param path 页面路径
 * @returns 页面权限配置,如果未配置则返回 null
 */
export function getPageAuthConfig(path: string): PageAuthConfig | null {
  // 移除查询参数
  const cleanPath = path.split("?")[0];

  // 查找配置
  const config = pageAuthConfigs.find((item) => item.path === cleanPath);

  return config || null;
}

/**
 * 检查页面是否在白名单中
 * @param path 页面路径
 * @returns 是否在白名单中
 */
export function isWhitelistPage(path: string): boolean {
  const config = getPageAuthConfig(path);
  return config?.authType === PageAuthType.WHITELIST;
}

/**
 * 检查页面是否需要登录
 * @param path 页面路径
 * @returns 是否需要登录
 */
export function isLoginRequired(path: string): boolean {
  const config = getPageAuthConfig(path);
  return (
    config?.authType === PageAuthType.LOGIN_REQUIRED ||
    config?.authType === PageAuthType.REAL_NAME_REQUIRED ||
    config?.authType === PageAuthType.DRIVER_LICENSE_REQUIRED
  );
}

/**
 * 检查页面是否需要实名认证
 * @param path 页面路径
 * @returns 是否需要实名认证
 */
export function isRealNameRequired(path: string): boolean {
  const config = getPageAuthConfig(path);
  return (
    config?.authType === PageAuthType.REAL_NAME_REQUIRED ||
    config?.authType === PageAuthType.DRIVER_LICENSE_REQUIRED
  );
}

/**
 * 检查页面是否需要驾照认证
 * @param path 页面路径
 * @returns 是否需要驾照认证
 */
export function isDriverLicenseRequired(path: string): boolean {
  const config = getPageAuthConfig(path);
  return config?.authType === PageAuthType.DRIVER_LICENSE_REQUIRED;
}

/**
 * 网络请求封装
 * 包含请求/响应拦截器
 */

import { getToken } from "./auth";

// ⚠️ 注意：后端运行在 Docker 容器中，端口为 3000
const BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000" // 开发环境直接连接本地后端服务
    : "https://api.daodaorv.com"; // 生产环境使用实际域名

/**
 * 请求拦截器
 */
function requestInterceptor(
  config: UniApp.RequestOptions
): UniApp.RequestOptions {
  const token = getToken();

  // 添加 Token
  if (token) {
    config.header = {
      ...config.header,
      Authorization: `Bearer ${token}`,
    };
  }

  // 添加通用 Header
  config.header = {
    ...config.header,
    "Content-Type": "application/json",
  };

  // 添加完整 URL
  config.url = BASE_URL + config.url;

  return config;
}

/**
 * 响应拦截器
 */
function responseInterceptor(response: any): any {
  const { statusCode, data } = response;

  // 处理 HTTP 错误
  if (statusCode === 401) {
    // Token 过期，跳转登录
    uni.showToast({ title: "登录已过期，请重新登录", icon: "none" });
    setTimeout(() => {
      uni.reLaunch({ url: "/pages/login/index" });
    }, 1500);
    return Promise.reject("未授权");
  }

  if (statusCode !== 200) {
    uni.showToast({ title: "网络请求失败", icon: "none" });
    return Promise.reject(response);
  }

  // 处理业务错误 - 后端成功响应的code是200
  if (data.code !== 200) {
    uni.showToast({ title: data.message || "请求失败", icon: "none" });
    return Promise.reject(data);
  }

  return data;
}

/**
 * 封装请求方法
 */
export function request<T = any>(options: UniApp.RequestOptions): Promise<T> {
  const config = requestInterceptor(options);

  return new Promise((resolve, reject) => {
    uni.request({
      ...config,
      success: (res) => {
        try {
          const data = responseInterceptor(res);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      },
      fail: (err) => {
        uni.showToast({ title: "网络请求失败", icon: "none" });
        reject(err);
      },
    });
  });
}

/**
 * GET 请求
 */
export function get<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({
    url,
    method: "GET",
    data,
  });
}

/**
 * POST 请求
 */
export function post<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({
    url,
    method: "POST",
    data,
  });
}

/**
 * PUT 请求
 */
export function put<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({
    url,
    method: "PUT",
    data,
  });
}

/**
 * DELETE 请求
 */
export function del<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({
    url,
    method: "DELETE",
    data,
  });
}

// 默认导出 request 函数
export default request;

import { Context, Next } from 'koa';

export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * 响应格式化中间件
 * 为 ctx 添加 success 和 error 方法
 */
export async function responseMiddleware(ctx: Context, next: Next) {
  // 成功响应
  ctx.success = function <T = any>(data: T, message = 'Success') {
    ctx.body = {
      success: true,
      code: 200,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  };

  // 错误响应
  ctx.error = function (code: number, message: string) {
    ctx.status = code >= 500 ? 500 : code;
    ctx.body = {
      success: false,
      code,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    };
  };

  await next();
}

// 扩展 Koa Context 类型
declare module 'koa' {
  interface Context {
    success<T = any>(data: T, message?: string): void;
    error(code: number, message: string): void;
  }
}

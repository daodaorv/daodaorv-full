import { Context, Next } from 'koa';
import { logger } from '../utils/logger';

/**
 * 全局错误处理中间件
 */
export const errorHandler = async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (err: any) {
    // 记录错误日志
    logger.error(`Error: ${err.message}`, { stack: err.stack });

    // 设置响应状态码
    ctx.status = err.status || 500;

    // 设置响应体
    ctx.body = {
      code: ctx.status,
      message: err.message || 'Internal Server Error',
      data: null,
      timestamp: new Date().toISOString(),
    };

    // 触发Koa的错误事件
    ctx.app.emit('error', err, ctx);
  }
};


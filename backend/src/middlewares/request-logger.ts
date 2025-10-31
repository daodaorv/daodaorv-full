import { Context, Next } from 'koa';
import { logger } from '../utils/logger';

/**
 * 请求日志中间件
 */
export const requestLogger = async (ctx: Context, next: Next) => {
  const start = Date.now();

  await next();

  const ms = Date.now() - start;
  const logMessage = `${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`;

  if (ctx.status >= 500) {
    logger.error(logMessage);
  } else if (ctx.status >= 400) {
    logger.warn(logMessage);
  } else {
    logger.info(logMessage);
  }
};


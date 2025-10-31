import { Context, Next } from 'koa';
import { verifyToken, JwtPayload } from '../utils/jwt';
import * as redisUtil from '../utils/redis';
import { logger } from '../utils/logger';

declare module 'koa' {
  interface DefaultState {
    user?: JwtPayload;
    token?: string;
  }
}

/**
 * JWT 认证中间件
 */
export async function authMiddleware(ctx: Context, next: Next) {
  const authHeader = ctx.headers.authorization;

  if (!authHeader) {
    ctx.status = 401;
    ctx.body = {
      code: 40100,
      message: '未登录',
    };
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // 验证JWT令牌
    const payload = verifyToken(token);

    // 检查令牌是否在Redis中（未被撤销）
    const isValid = await redisUtil.verifyToken(payload.userId, token);

    if (!isValid) {
      ctx.status = 401;
      ctx.body = {
        code: 40101,
        message: '令牌已失效，请重新登录',
      };
      return;
    }

    // 将用户信息和token存储到ctx.state
    ctx.state.user = payload;
    ctx.state.token = token;

    await next();
  } catch (error) {
    logger.error('JWT验证失败', error);
    ctx.status = 401;
    ctx.body = {
      code: 40102,
      message: '令牌无效或已过期',
    };
  }
}

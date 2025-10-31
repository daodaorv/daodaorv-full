import { Context, Next } from 'koa';
import { verifyToken, JwtPayload } from '../utils/jwt';
import * as redisUtil from '../utils/redis';
import { logger } from '../utils/logger';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

declare module 'koa' {
  interface DefaultState {
    user?: JwtPayload;
    token?: string;
    isAdmin?: boolean;
  }
}

/**
 * 管理员认证中间件
 */
export async function adminAuthMiddleware(ctx: Context, next: Next) {
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

    // 从数据库查询用户并验证是否为管理员
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: payload.userId } });

    if (!user) {
      ctx.status = 401;
      ctx.body = {
        code: 40102,
        message: '用户不存在',
      };
      return;
    }

    // 检查是否为管理员（使用手机号判断，管理员手机号为 13800000000）
    if (user.phone !== '13800000000') {
      ctx.status = 403;
      ctx.body = {
        code: 40300,
        message: '无管理员权限',
      };
      return;
    }

    // 将用户信息和token存储到ctx.state
    ctx.state.user = payload;
    ctx.state.token = token;
    ctx.state.isAdmin = true;

    await next();
  } catch (error) {
    logger.error('管理员JWT验证失败', error);
    ctx.status = 401;
    ctx.body = {
      code: 40103,
      message: '令牌无效或已过期',
    };
  }
}

/**
 * 角色权限验证中间件（可选）
 * @param requiredRole 需要的角色
 */
export function requireRole(requiredRole: string) {
  return async (_ctx: Context, next: Next) => {
    // TODO: 实际项目中需要从数据库查询用户角色
    // 这里简化处理
    logger.info(`检查角色权限: ${requiredRole}`);

    await next();
  };
}

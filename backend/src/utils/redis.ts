import { logger } from './logger';

// 临时禁用Redis连接 - 使用内存存储替代
console.log('⚠️  Redis暂时禁用，使用内存存储替代');

// 简单的内存存储替代Redis
const memoryStore: Map<string, string> = new Map();

/**
 * 存储JWT令牌
 * @param userId 用户ID
 * @param token JWT令牌
 * @param expiresIn 过期时间（秒）
 */
export async function saveToken(
  userId: string,
  token: string,
  expiresIn: number = 7 * 24 * 60 * 60
): Promise<void> {
  const key = `jwt:${userId}:${token}`;
  memoryStore.set(key, 'valid');

  // 设置过期时间清理
  setTimeout(() => {
    memoryStore.delete(key);
  }, expiresIn * 1000);
}

/**
 * 验证JWT令牌是否存在且有效
 * @param userId 用户ID
 * @param token JWT令牌
 * @returns 是否有效
 */
export async function verifyToken(userId: string, token: string): Promise<boolean> {
  const key = `jwt:${userId}:${token}`;
  const value = memoryStore.get(key);
  return value === 'valid';
}

/**
 * 撤销JWT令牌（退出登录）
 * @param userId 用户ID
 * @param token JWT令牌
 */
export async function revokeToken(userId: string, token: string): Promise<void> {
  const key = `jwt:${userId}:${token}`;
  memoryStore.delete(key);
}

/**
 * 撤销用户的所有令牌（安全措施）
 * @param userId 用户ID
 */
export async function revokeAllTokens(userId: string): Promise<void> {
  const pattern = `jwt:${userId}:*`;
  for (const key of memoryStore.keys()) {
    if (key.startsWith(pattern)) {
      memoryStore.delete(key);
    }
  }
}

// 模拟Redis客户端对象
export const redisClient = {
  setEx: async (key: string, seconds: number, value: string) => {
    memoryStore.set(key, value);
    setTimeout(() => memoryStore.delete(key), seconds * 1000);
  },
  get: async (key: string) => memoryStore.get(key) || null,
  del: async (key: string | string[]) => {
    const keys = Array.isArray(key) ? key : [key];
    keys.forEach(k => memoryStore.delete(k));
    return keys.length;
  },
  keys: async (pattern: string) => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(memoryStore.keys()).filter(key => regex.test(key));
  },
  connect: async () => {
    logger.info('Redis模拟客户端已连接（内存存储）');
  },
  on: (event: string, callback: Function) => {
    // 模拟事件监听器
  }
};

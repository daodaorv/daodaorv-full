/**
 * Redis Mock for Testing
 * 测试环境使用的 Redis Mock，避免依赖真实的 Redis 服务
 */

const tokenStore: Map<string, Set<string>> = new Map();
const revokedTokens: Map<string, Set<string>> = new Map();

export async function saveToken(
  userId: string,
  token: string,
  _expiresIn: number = 7 * 24 * 60 * 60
): Promise<void> {
  if (!tokenStore.has(userId)) {
    tokenStore.set(userId, new Set());
  }
  tokenStore.get(userId)!.add(token);
}

export async function verifyToken(userId: string, token: string): Promise<boolean> {
  // 检查 token 是否被撤销
  const userRevokedTokens = revokedTokens.get(userId);
  if (userRevokedTokens && userRevokedTokens.has(token)) {
    return false;
  }
  // 测试环境中默认返回 true（已保存或未保存的token都认为有效，除非被明确撤销）
  return true;
}

export async function removeToken(userId: string, token: string): Promise<void> {
  const tokens = tokenStore.get(userId);
  if (tokens) {
    tokens.delete(token);
  }
}

export async function revokeToken(userId: string, token: string): Promise<void> {
  // 将 token 添加到撤销列表
  if (!revokedTokens.has(userId)) {
    revokedTokens.set(userId, new Set());
  }
  revokedTokens.get(userId)!.add(token);

  // 同时从token store中删除
  const tokens = tokenStore.get(userId);
  if (tokens) {
    tokens.delete(token);
  }
}

export async function removeAllTokens(userId: string): Promise<void> {
  // 将所有 token 添加到撤销列表
  const tokens = tokenStore.get(userId);
  if (tokens) {
    if (!revokedTokens.has(userId)) {
      revokedTokens.set(userId, new Set());
    }
    tokens.forEach(token => revokedTokens.get(userId)!.add(token));
  }
  tokenStore.delete(userId);
}

export async function revokeAllTokens(userId: string): Promise<void> {
  // 同 removeAllTokens
  await removeAllTokens(userId);
}

export function clearAll(): void {
  tokenStore.clear();
}

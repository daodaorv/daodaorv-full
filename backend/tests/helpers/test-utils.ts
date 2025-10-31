/**
 * 测试辅助工具函数
 */

import request from 'supertest';
import { generateUniquePhone } from './test-data';

// 导出 generateUniquePhone 供其他测试文件使用
export { generateUniquePhone } from './test-data';

/**
 * 创建用户并获取Token
 */
export async function createUserAndGetToken(
  app: any,
  phone?: string,
  password: string = 'Test@123',
  nickname?: string
): Promise<{ token: string; userId: string }> {
  const userData = {
    phone: phone || generateUniquePhone(),
    password,
    nickname: nickname || '测试用户',
  };

  const response = await request(app.callback()).post('/api/auth/register').send(userData);

  if (response.body && response.body.success) {
    return {
      token: response.body.data.token,
      userId: response.body.data.user.id,
    };
  }

  const errorMsg = response.body?.message || response.text || `状态码: ${response.status}`;
  throw new Error(`创建用户失败: ${errorMsg}`);
}

/**
 * 登录并获取Token
 */
export async function loginAndGetToken(
  app: any,
  phone: string,
  password: string
): Promise<string> {
  const response = await request(app.callback()).post('/api/auth/login').send({
    phone,
    password,
  });

  if (response.body.success) {
    return response.body.data.token;
  }

  const errorMsg = response.body?.message || response.text || `状态码: ${response.status}`;
  throw new Error(`登录失败: ${errorMsg}`);
}

/**
 * 获取管理员Token（使用系统预设的管理员账号）
 * 管理员账号：13800000000
 */
export async function getAdminToken(app: any): Promise<string> {
  const adminPhone = '13800000000';
  const adminPassword = 'Admin@123456';

  try {
    // 先尝试登录
    return await loginAndGetToken(app, adminPhone, adminPassword);
  } catch (error) {
    // 如果登录失败，说明账号不存在，创建它
    const result = await createUserAndGetToken(app, adminPhone, adminPassword, '系统管理员');
    return result.token;
  }
}

/**
 * 用户认证 API 测试
 */

import request from 'supertest';
import app from '../src/app';
import { generateUniquePhone } from './helpers/test-data';
import { loginAndGetToken } from './helpers/test-utils';

describe('用户认证 API 测试', () => {
  let testUserToken: string;
  const testPhone = generateUniquePhone();
  const testPassword = 'Test@123456';

  describe('POST /api/auth/register - 用户注册', () => {
    it('应该成功注册新用户', async () => {
      const response = await request(app.callback()).post('/api/auth/register').send({
        phone: testPhone,
        password: testPassword,
        nickname: '测试用户',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('注册成功');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.phone).toBe(testPhone);

      testUserToken = response.body.data.token;
    });

    it('重复手机号应该返回错误', async () => {
      const response = await request(app.callback()).post('/api/auth/register').send({
        phone: testPhone,
        password: testPassword,
        nickname: '重复用户',
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('手机号已注册');
    });

    it('缺少必填字段应该返回 400 错误', async () => {
      const response = await request(app.callback()).post('/api/auth/register').send({
        phone: generateUniquePhone(),
        // 缺少 password
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('手机号格式不正确应该返回错误', async () => {
      const response = await request(app.callback()).post('/api/auth/register').send({
        phone: '123',
        password: testPassword,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login - 用户登录', () => {
    it('应该成功登录', async () => {
      const response = await request(app.callback()).post('/api/auth/login').send({
        phone: testPhone,
        password: testPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('登录成功');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
    });

    it('错误的密码应该返回错误', async () => {
      const response = await request(app.callback()).post('/api/auth/login').send({
        phone: testPhone,
        password: 'WrongPassword@123',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('密码错误');
    });

    it('不存在的手机号应该返回错误', async () => {
      const response = await request(app.callback()).post('/api/auth/login').send({
        phone: '19999999999',
        password: testPassword,
      });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户不存在');
    });

    it('缺少必填字段应该返回 400 错误', async () => {
      const response = await request(app.callback()).post('/api/auth/login').send({
        phone: testPhone,
        // 缺少 password
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile - 获取用户信息', () => {
    it('应该成功获取当前用户信息', async () => {
      const response = await request(app.callback())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.phone).toBe(testPhone);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('未登录应该返回 401 错误', async () => {
      const response = await request(app.callback()).get('/api/auth/profile');

      expect(response.status).toBe(401);
    });

    it('无效的 Token 应该返回 401 错误', async () => {
      const response = await request(app.callback())
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout - 退出登录', () => {
    it('应该成功退出登录', async () => {
      const response = await request(app.callback())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('退出登录成功');
    });

    it('退出后 Token 应该失效', async () => {
      const response = await request(app.callback())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/change-password - 修改密码', () => {
    let changePasswordPhone: string;
    const changePasswordOldPass = 'OldPass@123456';
    const changePasswordNewPass = 'NewPass@123456';

    it('应该成功修改密码', async () => {
      // 创建一个新用户用于测试修改密码
      changePasswordPhone = generateUniquePhone();
      await request(app.callback()).post('/api/auth/register').send({
        phone: changePasswordPhone,
        password: changePasswordOldPass,
        nickname: '修改密码测试用户',
      });

      const activeToken = await loginAndGetToken(app, changePasswordPhone, changePasswordOldPass);

      const response = await request(app.callback())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${activeToken}`)
        .send({
          oldPassword: changePasswordOldPass,
          newPassword: changePasswordNewPass,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('密码修改成功');
    });

    it('应该可以使用新密码登录', async () => {
      const response = await request(app.callback()).post('/api/auth/login').send({
        phone: changePasswordPhone,
        password: changePasswordNewPass,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('旧密码错误应该返回错误', async () => {
      // 创建一个新用户用于测试旧密码错误
      const wrongPassPhone = generateUniquePhone();
      const wrongPassPassword = 'CorrectPass@123456';

      await request(app.callback()).post('/api/auth/register').send({
        phone: wrongPassPhone,
        password: wrongPassPassword,
        nickname: '旧密码错误测试用户',
      });

      const token = await loginAndGetToken(app, wrongPassPhone, wrongPassPassword);

      const response = await request(app.callback())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          oldPassword: 'WrongOldPassword@123',
          newPassword: 'AnotherPass@123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('旧密码错误');
    });
  });

  describe('POST /api/auth/real-name - 提交实名认证', () => {
    let realNamePhone: string;
    const realNamePassword = 'RealName@123456';

    it('应该成功提交实名认证资料', async () => {
      // 创建一个新用户用于测试实名认证
      realNamePhone = generateUniquePhone();
      await request(app.callback()).post('/api/auth/register').send({
        phone: realNamePhone,
        password: realNamePassword,
        nickname: '实名认证测试用户',
      });

      const activeToken = await loginAndGetToken(app, realNamePhone, realNamePassword);

      const response = await request(app.callback())
        .post('/api/auth/real-name')
        .set('Authorization', `Bearer ${activeToken}`)
        .send({
          realName: '张三',
          idCard: '110101199001011234',
          phone: realNamePhone,
          idCardFrontImage: 'https://example.com/id-front.jpg',
          idCardBackImage: 'https://example.com/id-back.jpg',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('实名资料提交成功');
    });

    it('缺少必填字段应该返回错误', async () => {
      const activeToken = await loginAndGetToken(app, realNamePhone, realNamePassword);

      const response = await request(app.callback())
        .post('/api/auth/real-name')
        .set('Authorization', `Bearer ${activeToken}`)
        .send({
          realName: '李四',
          // 缺少 idCard
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/driving-license - 提交驾照认证', () => {
    let drivingLicensePhone: string;
    const drivingLicensePassword = 'DrivingLicense@123456';

    it('应该成功提交驾照认证资料', async () => {
      // 创建一个新用户用于测试驾照认证
      drivingLicensePhone = generateUniquePhone();
      await request(app.callback()).post('/api/auth/register').send({
        phone: drivingLicensePhone,
        password: drivingLicensePassword,
        nickname: '驾照认证测试用户',
      });

      const activeToken = await loginAndGetToken(app, drivingLicensePhone, drivingLicensePassword);

      // 先完成实名认证
      await request(app.callback())
        .post('/api/auth/real-name')
        .set('Authorization', `Bearer ${activeToken}`)
        .send({
          realName: '张三',
          idCard: '110101199001011234',
          idCardFrontImage: 'https://example.com/id-front.jpg',
          idCardBackImage: 'https://example.com/id-back.jpg',
        });

      const requestBody = {
        drivingLicense: '110101199001011234',
        drivingLicenseFrontImage: 'https://example.com/license-front.jpg',
        drivingLicenseBackImage: 'https://example.com/license-back.jpg',
      };

      const response = await request(app.callback())
        .post('/api/auth/driving-license')
        .set('Authorization', `Bearer ${activeToken}`)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('驾照资料提交成功');
    });
  });
});

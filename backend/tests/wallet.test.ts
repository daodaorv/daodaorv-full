import request from 'supertest';
import app from '../src/app';
import { AppDataSource } from '../src/config/database';
import { getAdminToken, createUserAndGetToken, generateUniquePhone } from './helpers/test-utils';

describe('钱包 API 测试', () => {
  let adminToken: string;
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    adminToken = await getAdminToken(app);
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('用户钱包功能', () => {
    test('获取钱包信息 - 自动创建钱包', async () => {
      const phone = generateUniquePhone();
      const { token, userId: uid } = await createUserAndGetToken(app, phone);
      userToken = token;
      userId = uid;

      const response = await request(app.callback())
        .get('/api/wallet')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.balance).toBe('0.00');
      expect(response.body.data.frozenAmount).toBe('0.00');
      expect(response.body.data.availableBalance).toBe('0.00');
    });

    test('管理员手动充值', async () => {
      const response = await request(app.callback())
        .post('/api/admin/wallet/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId,
          amount: 1000,
          reason: '测试充值',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.newBalance).toBe('1000.00');
      expect(response.body.data.adjustAmount).toBe('1000.00');
    });

    test('查看钱包余额 - 充值后', async () => {
      const response = await request(app.callback())
        .get('/api/wallet')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBe('1000.00');
      expect(response.body.data.availableBalance).toBe('1000.00');
      expect(response.body.data.totalRecharge).toBe('1000.00');
    });

    test('获取交易记录', async () => {
      const response = await request(app.callback())
        .get('/api/wallet/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toBeInstanceOf(Array);
      expect(response.body.data.transactions.length).toBeGreaterThan(0);
      expect(response.body.data.transactions[0].type).toBe('adjustment');
    });
  });

  describe('提现功能', () => {
    let withdrawalId: string;

    test('申请提现 - 微信', async () => {
      const response = await request(app.callback())
        .post('/api/wallet/withdraw')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 100,
          method: 'wechat',
          account: '13800001111',
          accountName: '测试用户',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('withdrawalNo');
      expect(response.body.data.amount).toBe('100.00');
      expect(response.body.data.status).toBe('pending');

      withdrawalId = response.body.data.id;
    });

    test('申请提现 - 余额不足', async () => {
      const response = await request(app.callback())
        .post('/api/wallet/withdraw')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 10000,
          method: 'alipay',
          account: 'test@example.com',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('余额不足');
    });

    test('申请提现 - 参数验证失败', async () => {
      const response = await request(app.callback())
        .post('/api/wallet/withdraw')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: -50,
          method: 'wechat',
          account: '13800001111',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('查看钱包余额 - 提现后（冻结）', async () => {
      const response = await request(app.callback())
        .get('/api/wallet')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBe('1000.00'); // 余额未扣减
      expect(response.body.data.frozenAmount).toBe('100.00'); // 冻结100
      expect(response.body.data.availableBalance).toBe('900.00'); // 可用余额减少
    });

    test('获取提现记录（用户端）', async () => {
      const response = await request(app.callback())
        .get('/api/wallet/withdrawals')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.withdrawals).toBeInstanceOf(Array);
      expect(response.body.data.withdrawals.length).toBeGreaterThan(0);
      expect(response.body.data.withdrawals[0].status).toBe('pending');
      // 账号应该脱敏
      expect(response.body.data.withdrawals[0].account).toContain('****');
    });

    test('获取提现记录列表（管理端）', async () => {
      const response = await request(app.callback())
        .get('/api/admin/withdrawals')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'pending', page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.withdrawals).toBeInstanceOf(Array);
      expect(response.body.data.withdrawals.length).toBeGreaterThan(0);
    });

    test('获取提现详情（管理端）', async () => {
      const response = await request(app.callback())
        .get(`/api/admin/withdrawals/${withdrawalId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(withdrawalId);
      expect(response.body.data.status).toBe('pending');
    });

    test('审核提现 - 通过', async () => {
      const response = await request(app.callback())
        .post(`/api/admin/withdrawals/${withdrawalId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          approved: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
    });

    test('查看钱包余额 - 提现审核通过后', async () => {
      const response = await request(app.callback())
        .get('/api/wallet')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBe('900.00'); // 余额扣减
      expect(response.body.data.frozenAmount).toBe('0.00'); // 冻结金额解除
      expect(response.body.data.availableBalance).toBe('900.00');
      expect(response.body.data.totalWithdrawal).toBe('100.00');
    });
  });

  describe('提现审核 - 拒绝', () => {
    let withdrawalId2: string;

    test('再次申请提现', async () => {
      const response = await request(app.callback())
        .post('/api/wallet/withdraw')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 50,
          method: 'bank_card',
          account: '6222021234567890123',
          accountName: '测试用户',
          bankName: '中国工商银行',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      withdrawalId2 = response.body.data.id;
    });

    test('审核提现 - 拒绝', async () => {
      const response = await request(app.callback())
        .post(`/api/admin/withdrawals/${withdrawalId2}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          approved: false,
          rejectReason: '银行卡信息有误',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('rejected');
    });

    test('查看钱包余额 - 提现拒绝后', async () => {
      const response = await request(app.callback())
        .get('/api/wallet')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBe('900.00'); // 余额不变
      expect(response.body.data.frozenAmount).toBe('0.00'); // 冻结金额解除
      expect(response.body.data.availableBalance).toBe('900.00'); // 可用余额恢复
    });
  });

  describe('管理员余额调整', () => {
    test('管理员扣减余额', async () => {
      const response = await request(app.callback())
        .post('/api/admin/wallet/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId,
          amount: -200,
          reason: '测试扣减',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.newBalance).toBe('700.00');
      expect(response.body.data.adjustAmount).toBe('-200.00');
    });

    test('查看钱包余额 - 余额调整后', async () => {
      const response = await request(app.callback())
        .get('/api/wallet')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBe('700.00');
    });
  });

  describe('权限验证', () => {
    test('未登录不能访问钱包', async () => {
      await request(app.callback()).get('/api/wallet').expect(401);
    });

    test('普通用户不能访问管理端提现列表', async () => {
      await request(app.callback())
        .get('/api/admin/withdrawals')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    test('普通用户不能审核提现', async () => {
      await request(app.callback())
        .post('/api/admin/withdrawals/some-id/review')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ approved: true })
        .expect(403);
    });

    test('普通用户不能调整余额', async () => {
      await request(app.callback())
        .post('/api/admin/wallet/adjust')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId, amount: 100, reason: '测试' })
        .expect(403);
    });
  });
});

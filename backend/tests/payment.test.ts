import request from 'supertest';
import app from '../src/app';
import { AppDataSource } from '../src/config/database';
import { getAdminToken, createUserAndGetToken, generateUniquePhone } from './helpers/test-utils';
import { generateUniqueLicensePlate, generateUniqueVin } from './helpers/test-data';
import { PaymentPlatform } from '../src/entities/PaymentConfig';

describe('支付 API 测试', () => {
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let vehicleId: string;
  let orderId: string;
  let paymentNo: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    adminToken = await getAdminToken(app);

    // 创建车型模板
    const modelResponse = await request(app.callback())
      .post('/api/admin/vehicle-models')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        modelName: '支付测试车型',
        brand: '测试品牌',
        model: 'PAY-TEST-01',
        category: 'type_c',
        seatCount: 4,
        bedCount: 2,
        dailyPrice: 100.0,
        weeklyPrice: 600.0,
        monthlyPrice: 2000.0,
        deposit: 1000.0,
      });

    const vehicleModelId = modelResponse.body.data.id;

    // 创建车辆
    const vehicleResponse = await request(app.callback())
      .post('/api/admin/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vehicleModelId,
        licensePlate: generateUniqueLicensePlate(),
        vin: generateUniqueVin(),
        year: 2023,
        mileage: 10000,
        ownershipType: 'platform',
      });

    vehicleId = vehicleResponse.body.data?.id;
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('钱包支付功能', () => {
    test('准备工作 - 创建用户并充值', async () => {
      const phone = generateUniquePhone();
      const { token, userId: uid } = await createUserAndGetToken(app, phone);
      userToken = token;
      userId = uid;

      // 管理员充值 1000 元
      await request(app.callback())
        .post('/api/admin/wallet/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId,
          amount: 1000,
          reason: '测试充值',
        })
        .expect(200);
    });

    test('准备工作 - 创建测试订单', async () => {
      // 创建订单
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 2);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 3);

      const response = await request(app.callback())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          vehicleId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          insurancePrice: 0,
          additionalServices: JSON.stringify([]),
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      orderId = response.body.data.id;
    });

    test('创建钱包支付 - 成功', async () => {
      // 先获取订单详情，获取实际金额
      const orderDetail = await request(app.callback())
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const orderAmount = parseFloat(orderDetail.body.data.totalPrice);

      const response = await request(app.callback())
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId,
          platform: PaymentPlatform.WALLET,
          amount: orderAmount,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentRecord).toHaveProperty('paymentNo');
      expect(response.body.data.paymentRecord.platform).toBe(PaymentPlatform.WALLET);
      expect(response.body.data.paymentRecord.status).toBe('paid');
      expect(response.body.data.paymentRecord.amount).toBe(orderAmount);

      paymentNo = response.body.data.paymentRecord.paymentNo;
    });

    test('创建钱包支付 - 余额不足', async () => {
      // 创建另一个订单（使用更长的租期，确保金额超过剩余余额）
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 10);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30); // 30天租期，确保金额足够大

      const orderResponse = await request(app.callback())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          vehicleId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          insurancePrice: 0,
          additionalServices: JSON.stringify([]),
        })
        .expect(200);

      const newOrderId = orderResponse.body.data.id;
      const orderAmount = parseFloat(orderResponse.body.data.totalPrice);

      // 尝试支付（余额不足：当前余额700，订单金额应该超过700）
      const response = await request(app.callback())
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: newOrderId,
          platform: PaymentPlatform.WALLET,
          amount: orderAmount,
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('余额不足');
    });

    test('查询支付状态 - 成功', async () => {
      const response = await request(app.callback())
        .get(`/api/payment/${paymentNo}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentNo).toBe(paymentNo);
      expect(response.body.data.status).toBe('paid');
      expect(response.body.data.platform).toBe(PaymentPlatform.WALLET);
    });

    test('查询支付状态 - 支付单号不存在', async () => {
      const response = await request(app.callback())
        .get('/api/payment/PAY20251026999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('支付记录不存在');
    });
  });

  describe('支付参数验证', () => {
    test('创建支付 - 缺少必填参数', async () => {
      const response = await request(app.callback())
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: 'test-order-id',
          // 缺少 platform 和 amount
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('缺少必填参数');
    });

    test('创建支付 - 不支持的支付平台', async () => {
      const response = await request(app.callback())
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: 'test-order-id',
          platform: 'invalid-platform',
          amount: 100,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不支持的支付平台');
    });

    test('创建支付 - 金额必须大于0', async () => {
      const response = await request(app.callback())
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: 'test-order-id',
          platform: PaymentPlatform.WALLET,
          amount: -100,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('支付金额必须大于0');
    });
  });

  describe('第三方支付（预留）', () => {
    test('创建微信支付 - 未配置', async () => {
      // 创建订单
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 20);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 3);

      const orderResponse = await request(app.callback())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          vehicleId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          insurancePrice: 0,
          additionalServices: JSON.stringify([]),
        })
        .expect(200);

      const newOrderId = orderResponse.body.data.id;
      const orderAmount = parseFloat(orderResponse.body.data.totalPrice);

      const response = await request(app.callback())
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: newOrderId,
          platform: PaymentPlatform.WECHAT,
          amount: orderAmount,
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('微信支付未配置或未启用');
    });

    test('创建支付宝支付 - 未配置', async () => {
      // 创建订单
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 30);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 3);

      const orderResponse = await request(app.callback())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          vehicleId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          insurancePrice: 0,
          additionalServices: JSON.stringify([]),
        })
        .expect(200);

      const newOrderId = orderResponse.body.data.id;
      const orderAmount = parseFloat(orderResponse.body.data.totalPrice);

      const response = await request(app.callback())
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: newOrderId,
          platform: PaymentPlatform.ALIPAY,
          amount: orderAmount,
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('支付宝支付未配置或未启用');
    });
  });

  describe('支付配置管理（管理端）', () => {
    test('获取支付配置 - 配置不存在', async () => {
      const response = await request(app.callback())
        .get(`/api/admin/payment/config/${PaymentPlatform.WECHAT}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });

    test('更新支付配置 - 微信支付', async () => {
      const response = await request(app.callback())
        .post(`/api/admin/payment/config/${PaymentPlatform.WECHAT}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          config: {
            appId: 'wx1234567890',
            mchId: '1234567890',
            apiKey: 'test-api-key',
          },
          isEnabled: false, // 暂不启用
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.platform).toBe(PaymentPlatform.WECHAT);
      expect(response.body.data.isEnabled).toBe(false);
    });

    test('获取支付配置 - 配置存在（脱敏）', async () => {
      const response = await request(app.callback())
        .get(`/api/admin/payment/config/${PaymentPlatform.WECHAT}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.platform).toBe(PaymentPlatform.WECHAT);
      expect(response.body.data.isEnabled).toBe(false);
      // 验证脱敏：不应该返回 config 字段
      expect(response.body.data.config).toBeUndefined();
    });
  });
});

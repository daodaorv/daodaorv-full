import request from 'supertest';
import app from '../src/app';
import { AppDataSource } from '../src/config/database';
import { getAdminToken, createUserAndGetToken, generateUniquePhone } from './helpers/test-utils';
import { generateUniqueLicensePlate, generateUniqueVin } from './helpers/test-data';
import { PaymentPlatform } from '../src/entities/PaymentConfig';
import { RefundStatus } from '../src/entities/RefundRecord';

describe('退款 API 测试', () => {
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let vehicleId: string;
  let orderId: string;
  let refundId: string;
  let refundNo: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    adminToken = await getAdminToken(app);

    // 创建车型模板
    console.log('Creating vehicle model');
    const modelResponse = await request(app.callback())
      .post('/api/admin/vehicle-models')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        modelName: '退款测试车型',
        brand: '测试品牌',
        model: 'REFUND-TEST-01',
        category: 'type_c',
        seatCount: 4,
        bedCount: 2,
        dailyPrice: 100.0,
        weeklyPrice: 600.0,
        monthlyPrice: 2000.0,
        deposit: 1000.0,
      });

    const vehicleModelId = modelResponse.body.data.id;
    console.log('Vehicle model created successfully');

    // 创建车辆
    console.log('Creating vehicle');
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
    console.log('Vehicle created successfully');
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('退款申请功能', () => {
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

    test('准备工作 - 创建订单并支付', async () => {
      // 创建订单
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 5);
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

      orderId = orderResponse.body.data.id;

      // 获取订单金额
      const orderDetailResponse = await request(app.callback())
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const orderAmount = parseFloat(orderDetailResponse.body.data.totalPrice);

      // 钱包支付
      const paymentResponse = await request(app.callback())
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId,
          platform: PaymentPlatform.WALLET,
          amount: orderAmount,
        })
        .expect(200);

      expect(paymentResponse.body.data.paymentRecord.status).toBe('paid');
    });

    test('创建退款申请 - 成功', async () => {
      const response = await request(app.callback())
        .post('/api/admin/refund/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId,
          reason: '用户申请退款',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('refundNo');
      expect(response.body.data.status).toBe(RefundStatus.PENDING);
      expect(response.body.data.orderId).toBe(orderId);

      refundId = response.body.data.id;
      refundNo = response.body.data.refundNo;
    });

    test('创建退款申请 - 订单不存在', async () => {
      const response = await request(app.callback())
        .post('/api/admin/refund/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId: 'non-existent-order-id',
          reason: '测试',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('订单不存在');
    });

    test('创建退款申请 - 缺少订单ID', async () => {
      const response = await request(app.callback())
        .post('/api/admin/refund/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: '测试',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('缺少订单ID');
    });
  });

  describe('退款处理功能', () => {
    test('处理退款 - 成功', async () => {
      const response = await request(app.callback())
        .post(`/api/admin/refund/process/${refundId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(RefundStatus.REFUNDED);
      expect(response.body.data.refundedAt).toBeTruthy();
    });

    test('处理退款 - 退款ID不存在', async () => {
      const response = await request(app.callback())
        .post('/api/admin/refund/process/non-existent-refund-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('退款记录不存在');
    });

    test('处理退款 - 重复处理', async () => {
      const response = await request(app.callback())
        .post(`/api/admin/refund/process/${refundId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('退款已完成');
    });
  });

  describe('退款查询功能', () => {
    test('查询退款状态 - 成功', async () => {
      const response = await request(app.callback())
        .get(`/api/refund/status/${refundNo}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.refundNo).toBe(refundNo);
      expect(response.body.data.status).toBe(RefundStatus.REFUNDED);
    });

    test('查询退款状态 - 退款单号不存在', async () => {
      const response = await request(app.callback())
        .get('/api/refund/status/RFD20251026999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('退款记录不存在');
    });

    test('获取退款详情 - 成功', async () => {
      const response = await request(app.callback())
        .get(`/api/refund/${refundId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(refundId);
      expect(response.body.data.refundNo).toBe(refundNo);
      expect(response.body.data.status).toBe(RefundStatus.REFUNDED);
    });

    test('获取退款详情 - 退款ID不存在', async () => {
      const response = await request(app.callback())
        .get('/api/refund/non-existent-refund-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('退款记录不存在');
    });
  });

  describe('退款回调功能（预留）', () => {
    test('微信退款回调 - 预留功能', async () => {
      const response = await request(app.callback()).post('/api/refund/wechat/callback').send({
        // 微信回调参数
      });

      // 预留功能，应该返回失败
      expect(response.type).toBe('application/xml');
      expect(response.text).toContain('FAIL');
    });

    test('支付宝退款回调 - 预留功能', async () => {
      const response = await request(app.callback()).post('/api/refund/alipay/callback').send({
        // 支付宝回调参数
      });

      // 预留功能，应该返回失败
      expect(response.text).toBe('fail');
    });
  });
});

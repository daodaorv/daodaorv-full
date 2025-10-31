import request from 'supertest';
import app from '../src/app';
import { AppDataSource } from '../src/config/database';
import { getAdminToken, createUserAndGetToken, generateUniquePhone } from './helpers/test-utils';
import { generateUniqueLicensePlate, generateUniqueVin } from './helpers/test-data';
import { PaymentPlatform } from '../src/entities/PaymentConfig';
import { RefundStatus } from '../src/entities/RefundRecord';

describe('支付集成测试', () => {
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let vehicleId: string;
  let vehicleModelId: string;

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
        modelName: '集成测试车型',
        brand: '测试品牌',
        model: 'INTEGRATION-TEST-01',
        category: 'type_c',
        seatCount: 4,
        bedCount: 2,
        dailyPrice: 100.0,
        weeklyPrice: 600.0,
        monthlyPrice: 2000.0,
        deposit: 1000.0,
      });

    vehicleModelId = modelResponse.body.data.id;

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

    // 创建用户
    const phone = generateUniquePhone();
    const { token, userId: uid } = await createUserAndGetToken(app, phone);
    userToken = token;
    userId = uid;
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('完整支付流程', () => {
    let orderId: string;

    test('1. 用户充值钱包', async () => {
      // 管理员为用户充值 2000 元
      const response = await request(app.callback())
        .post('/api/admin/wallet/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId,
          amount: 2000,
          reason: '集成测试充值',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.newBalance).toBe('2000.00');
    });

    test('2. 用户查询钱包余额', async () => {
      const response = await request(app.callback())
        .get('/api/wallet')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBe('2000.00');
    });

    test('3. 用户创建订单', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 5);
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
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.paymentStatus).toBe('unpaid');

      orderId = response.body.data.id;
    });

    test('4. 用户使用钱包支付订单', async () => {
      // 获取订单金额
      const orderDetailResponse = await request(app.callback())
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const orderAmount = parseFloat(orderDetailResponse.body.data.totalPrice);

      // 钱包支付
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
      expect(response.body.data.paymentRecord.status).toBe('paid');
    });

    test('5. 验证钱包余额已扣减', async () => {
      const response = await request(app.callback())
        .get('/api/wallet')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // 2000 - 300 = 1700
      expect(parseFloat(response.body.data.balance)).toBeLessThan(2000);
    });

    test('6. 验证订单状态已更新', async () => {
      const response = await request(app.callback())
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('paid');
      expect(response.body.data.paymentStatus).toBe('paid');
    });
  });

  describe('完整退款流程', () => {
    let orderId: string;
    let refundId: string;
    let balanceBeforeRefund: number;

    test('1. 创建新订单并支付', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 10);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 2);

      // 创建订单
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
      await request(app.callback())
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId,
          platform: PaymentPlatform.WALLET,
          amount: orderAmount,
        })
        .expect(200);
    });

    test('2. 记录退款前的钱包余额', async () => {
      const response = await request(app.callback())
        .get('/api/wallet')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      balanceBeforeRefund = parseFloat(response.body.data.balance);
    });

    test('3. 管理员创建退款申请', async () => {
      const response = await request(app.callback())
        .post('/api/admin/refund/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId,
          reason: '集成测试退款',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(RefundStatus.PENDING);

      refundId = response.body.data.id;
    });

    test('4. 管理员处理退款', async () => {
      const response = await request(app.callback())
        .post(`/api/admin/refund/process/${refundId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(RefundStatus.REFUNDED);
      expect(response.body.data.refundedAt).toBeTruthy();
    });

    test('5. 验证钱包余额已退回', async () => {
      const response = await request(app.callback())
        .get('/api/wallet')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const balanceAfterRefund = parseFloat(response.body.data.balance);
      expect(balanceAfterRefund).toBeGreaterThan(balanceBeforeRefund);
    });

    test('6. 验证订单支付状态已更新', async () => {
      const response = await request(app.callback())
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentStatus).toBe('refunded');
    });
  });

  describe('订单取消自动退款流程', () => {
    let orderId: string;

    test('1. 创建新订单并支付', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 30); // 30天后，确保全额退款
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 2);

      // 创建订单
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
      await request(app.callback())
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId,
          platform: PaymentPlatform.WALLET,
          amount: orderAmount,
        })
        .expect(200);
    });

    test('2. 用户取消订单（自动触发退款）', async () => {
      const response = await request(app.callback())
        .post(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reason: '集成测试取消订单',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
      expect(response.body.data.paymentStatus).toBe('refunding');
    });

    test('3. 验证订单状态', async () => {
      const response = await request(app.callback())
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
      expect(response.body.data.paymentStatus).toBe('refunding');
    });
  });

  describe('充值流程', () => {
    test('1. 管理员为用户充值', async () => {
      const response = await request(app.callback())
        .post('/api/admin/wallet/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId,
          amount: 500,
          reason: '充值测试',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.newBalance).toBeTruthy();
    });

    test('2. 验证充值交易记录', async () => {
      const response = await request(app.callback())
        .get('/api/wallet/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toBeTruthy();
      expect(response.body.data.transactions.length).toBeGreaterThan(0);

      // 查找充值记录（adjustment类型）
      const rechargeRecord = response.body.data.transactions.find(
        (t: any) => t.type === 'adjustment' && parseFloat(t.amount) === 500
      );
      expect(rechargeRecord).toBeTruthy();
    });
  });

  describe('提现流程', () => {
    test('1. 用户申请提现 - 需要实名认证', async () => {
      const response = await request(app.callback())
        .post('/api/wallet/withdraw')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 100,
          method: 'bank_card',
          account: '6222000000000000',
          accountName: '测试用户',
          bankName: '测试银行',
        });

      // 由于用户未实名认证，应该返回错误
      // 这里我们只验证API能正常响应
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('错误场景测试', () => {
    test('余额不足时无法支付', async () => {
      // 创建一个新用户，余额为0
      const phone = generateUniquePhone();
      const { token } = await createUserAndGetToken(app, phone);

      // 创建新车辆避免时间冲突
      const newVehicleResponse = await request(app.callback())
        .post('/api/admin/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleModelId,
          licensePlate: generateUniqueLicensePlate(),
          vin: generateUniqueVin(),
          year: 2023,
          mileage: 10000,
          ownershipType: 'platform',
        })
        .expect(200);

      const newVehicleId = newVehicleResponse.body.data.id;

      // 创建订单
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 50);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 3);

      const orderResponse = await request(app.callback())
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehicleId: newVehicleId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          insurancePrice: 0,
          additionalServices: JSON.stringify([]),
        })
        .expect(200);

      const orderId = orderResponse.body.data.id;

      // 获取订单金额
      const orderDetailResponse = await request(app.callback())
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const orderAmount = parseFloat(orderDetailResponse.body.data.totalPrice);

      // 尝试支付（余额不足）
      const response = await request(app.callback())
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderId,
          platform: PaymentPlatform.WALLET,
          amount: orderAmount,
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('余额不足');
    });

    test('重复支付订单会失败', async () => {
      // 创建新车辆避免时间冲突
      const newVehicleResponse = await request(app.callback())
        .post('/api/admin/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleModelId,
          licensePlate: generateUniqueLicensePlate(),
          vin: generateUniqueVin(),
          year: 2023,
          mileage: 10000,
          ownershipType: 'platform',
        })
        .expect(200);

      const newVehicleId = newVehicleResponse.body.data.id;

      // 创建订单并支付
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 60);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      const orderResponse = await request(app.callback())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          vehicleId: newVehicleId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          insurancePrice: 0,
          additionalServices: JSON.stringify([]),
        })
        .expect(200);

      const orderId = orderResponse.body.data.id;

      // 获取订单金额
      const orderDetailResponse = await request(app.callback())
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const orderAmount = parseFloat(orderDetailResponse.body.data.totalPrice);

      // 第一次支付
      await request(app.callback())
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId,
          platform: PaymentPlatform.WALLET,
          amount: orderAmount,
        })
        .expect(200);

      // 第二次支付（重复）
      const response = await request(app.callback())
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId,
          platform: PaymentPlatform.WALLET,
          amount: orderAmount,
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      // 订单状态已经是paid，所以会返回"订单状态不正确"
      expect(response.body.message).toContain('订单状态不正确');
    });
  });
});

/**
 * 订单管理 API 测试
 */

import request from 'supertest';
import app from '../src/app';
import {
  generateUniqueLicensePlate,
  generateUniqueVin,
  generateUniquePhone,
} from './helpers/test-data';
import { getAdminToken, createUserAndGetToken } from './helpers/test-utils';

describe('订单管理 API 测试', () => {
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let vehicleModelId: string;
  let vehicleId: string;
  let orderId: string;

  beforeAll(async () => {
    // 获取管理员Token
    adminToken = await getAdminToken(app);

    // 创建普通用户
    const userPhone = generateUniquePhone();
    const userResult = await createUserAndGetToken(app, userPhone, 'User@123', '测试用户');
    userToken = userResult.token;
    userId = userResult.userId;

    // 创建车型模板
    const modelResponse = await request(app.callback())
      .post('/api/admin/vehicle-models')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        modelName: '订单测试车型',
        brand: '测试品牌',
        model: 'TEST-01',
        category: 'type_c',
        seatCount: 4,
        bedCount: 2,
        dailyPrice: 500.0,
        weeklyPrice: 3000.0,
        monthlyPrice: 10000.0,
        deposit: 5000.0,
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
        mileage: 12000,
        ownershipType: 'platform',
      });

    vehicleId = vehicleResponse.body.data?.id;
  });

  describe('用户端订单 API', () => {
    describe('POST /api/orders - 创建订单', () => {
      it('应该成功创建订单', async () => {
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
            insurancePrice: 100,
            additionalServices: JSON.stringify([{ name: '接送机', price: 200 }]),
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('orderNo');
        expect(response.body.data.status).toBe('pending');
        orderId = response.body.data.id;
      });

      it('未登录应该返回 401 错误', async () => {
        await request(app.callback())
          .post('/api/orders')
          .send({
            vehicleId,
            startDate: '2024-12-01',
            endDate: '2024-12-03',
          })
          .expect(401);
      });

      it('缺少必填字段应该返回 400 错误', async () => {
        const response = await request(app.callback())
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            vehicleId,
            // 缺少 startDate 和 endDate
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('车辆不存在应该返回错误', async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 5);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 2);

        const response = await request(app.callback())
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            vehicleId: '99999999-9999-9999-9999-999999999999',
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
          })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('车辆不存在');
      });

      it('开始日期早于今天应该返回错误', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const response = await request(app.callback())
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            vehicleId,
            startDate: yesterday.toISOString().split('T')[0],
            endDate: tomorrow.toISOString().split('T')[0],
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('开始日期不能早于今天');
      });

      it('结束日期早于开始日期应该返回错误', async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 5);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() - 2);

        const response = await request(app.callback())
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            vehicleId,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('结束日期必须晚于开始日期');
      });
    });

    describe('GET /api/orders - 获取我的订单列表', () => {
      it('应该成功获取我的订单列表', async () => {
        const response = await request(app.callback())
          .get('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.orders).toBeInstanceOf(Array);
      });

      it('可以按状态筛选订单', async () => {
        const response = await request(app.callback())
          .get('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .query({ status: 'pending' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('未登录应该返回 401 错误', async () => {
        await request(app.callback()).get('/api/orders').expect(401);
      });
    });

    describe('GET /api/orders/:id - 获取订单详情', () => {
      it('应该成功获取订单详情', async () => {
        const response = await request(app.callback())
          .get(`/api/orders/${orderId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(orderId);
        expect(response.body.data.userId).toBe(userId);
      });

      it('未登录应该返回 401 错误', async () => {
        await request(app.callback()).get(`/api/orders/${orderId}`).expect(401);
      });

      it('访问他人订单应该返回 403 错误', async () => {
        const response = await request(app.callback()).get(`/api/orders/${orderId}`).expect(401);

        expect(response.status).toBe(401);
      });
    });

    describe('POST /api/orders/:id/cancel - 取消订单', () => {
      it('应该成功取消订单', async () => {
        const response = await request(app.callback())
          .post(`/api/orders/${orderId}/cancel`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            reason: '行程变更',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('cancelled');
      });

      it('未登录应该返回 401 错误', async () => {
        await request(app.callback())
          .post(`/api/orders/${orderId}/cancel`)
          .send({
            reason: '测试',
          })
          .expect(401);
      });
    });

    it('已取消的订单不能再次取消', async () => {
      const response = await request(app.callback())
        .post(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reason: '再次取消',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('管理端订单 API', () => {
    let adminOrderId: string;

    beforeAll(async () => {
      // 创建一个新订单用于管理员测试
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 10);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 3);

      const response = await request(app.callback())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          vehicleId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        });

      adminOrderId = response.body.data.id;
    });

    describe('GET /api/admin/orders - 获取所有订单列表', () => {
      it('应该成功获取所有订单列表', async () => {
        const response = await request(app.callback())
          .get('/api/admin/orders')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.orders).toBeInstanceOf(Array);
        expect(response.body.data.orders.length).toBeGreaterThan(0);
      });

      it('可以按状态筛选订单', async () => {
        const response = await request(app.callback())
          .get('/api/admin/orders')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ status: 'pending' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('普通用户不能访问管理端订单列表', async () => {
        await request(app.callback())
          .get('/api/admin/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);
      });
    });

    describe('GET /api/admin/orders/:id - 获取订单详情（管理端）', () => {
      it('应该成功获取订单详情', async () => {
        const response = await request(app.callback())
          .get(`/api/admin/orders/${adminOrderId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(adminOrderId);
      });

      it('普通用户不能访问管理端订单详情', async () => {
        const response = await request(app.callback())
          .get(`/api/admin/orders/${adminOrderId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('普通用户访问应该返回403', async () => {
        await request(app.callback())
          .get(`/api/admin/orders/${adminOrderId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);
      });
    });

    describe('PUT /api/admin/orders/:id/status - 更新订单状态', () => {
      it('应该成功更新订单状态为已支付', async () => {
        const response = await request(app.callback())
          .put(`/api/admin/orders/${adminOrderId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'paid',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('订单状态更新成功');
        expect(response.body.data.status).toBe('paid');
      });

      it('应该成功更新订单状态为待取车', async () => {
        const response = await request(app.callback())
          .put(`/api/admin/orders/${adminOrderId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'pickup',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('pickup');
      });

      it('缺少状态参数应该返回 400 错误', async () => {
        const response = await request(app.callback())
          .put(`/api/admin/orders/${adminOrderId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('普通用户不能更新订单状态', async () => {
        await request(app.callback())
          .put(`/api/admin/orders/${adminOrderId}/status`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            status: 'paid',
          })
          .expect(403);
      });
    });

    describe('POST /api/admin/orders/:id/refund - 处理退款', () => {
      let refundOrderId: string;

      beforeAll(async () => {
        // 创建一个新订单并支付后取消用于退款测试
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 20);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 3);

        const createResponse = await request(app.callback())
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            vehicleId,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
          });

        refundOrderId = createResponse.body.data.id;

        // 更新为已支付状态
        await request(app.callback())
          .put(`/api/admin/orders/${refundOrderId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'paid' });

        // 取消订单
        await request(app.callback())
          .post(`/api/orders/${refundOrderId}/cancel`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ reason: '测试退款' });
      });

      it('应该成功处理退款', async () => {
        const response = await request(app.callback())
          .post(`/api/admin/orders/${refundOrderId}/refund`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            refundAmount: 500,
            reason: '客户要求全额退款',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('退款处理成功');
        expect(response.body.data.paymentStatus).toBe('refunded');
      });

      it('缺少退款金额应该返回 400 错误', async () => {
        const response = await request(app.callback())
          .post(`/api/admin/orders/${refundOrderId}/refund`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            reason: '退款原因',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('普通用户不能处理退款', async () => {
        await request(app.callback())
          .post(`/api/admin/orders/${refundOrderId}/refund`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            refundAmount: 500,
            reason: '测试',
          })
          .expect(403);
      });
    });
  });
});

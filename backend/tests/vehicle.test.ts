/**
 * 车辆管理 API 测试
 */

import request from 'supertest';
import app from '../src/app';
import { generateUniqueLicensePlate, generateUniqueVin } from './helpers/test-data';
import { getAdminToken } from './helpers/test-utils';

describe('车辆管理 API 测试', () => {
  let adminToken: string;
  let vehicleModelId: string;
  let vehicleId: string;

  beforeAll(async () => {
    adminToken = await getAdminToken(app);
  });

  describe('车型模板管理', () => {
    describe('POST /api/admin/vehicle-models - 创建车型模板', () => {
      it('应该成功创建车型模板', async () => {
        const response = await request(app.callback())
          .post('/api/admin/vehicle-models')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            modelName: '测试大通RV80',
            brand: '上汽大通',
            model: 'RV80',
            category: 'type_c',
            seatCount: 4,
            bedCount: 2,
            dailyPrice: 580.0,
            weeklyPrice: 3500.0,
            monthlyPrice: 12000.0,
            deposit: 5000.0,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.modelName).toBe('测试大通RV80');
        vehicleModelId = response.body.data.id;
      });

      it('缺少必填字段应该返回400错误', async () => {
        const response = await request(app.callback())
          .post('/api/admin/vehicle-models')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            modelName: '不完整车型',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('车型分类不合法应该返回错误', async () => {
        const response = await request(app.callback())
          .post('/api/admin/vehicle-models')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            modelName: '测试车型',
            brand: '测试品牌',
            model: 'TEST-INVALID',
            category: '非法分类',
            seatCount: 4,
            bedCount: 2,
            dailyPrice: 580.0,
            deposit: 3000.0,
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('车型分类不合法');
      });
    });

    describe('GET /api/admin/vehicle-models - 获取车型模板列表', () => {
      it('应该成功获取车型模板列表', async () => {
        const response = await request(app.callback())
          .get('/api/admin/vehicle-models')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.list).toBeInstanceOf(Array);
      });

      it('支持分页查询', async () => {
        const response = await request(app.callback())
          .get('/api/admin/vehicle-models')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ page: 1, pageSize: 10 })
          .expect(200);

        expect(response.body.data).toHaveProperty('total');
        expect(response.body.data).toHaveProperty('list');
      });

      it('支持按分类筛选', async () => {
        const response = await request(app.callback())
          .get('/api/admin/vehicle-models')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ category: 'type_c' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('支持关键词搜索', async () => {
        const response = await request(app.callback())
          .get('/api/admin/vehicle-models')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ keyword: '大通' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('PUT /api/admin/vehicle-models/:id - 更新车型模板', () => {
      it('应该成功更新车型模板', async () => {
        const response = await request(app.callback())
          .put(`/api/admin/vehicle-models/${vehicleModelId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            modelName: '测试大通RV80 豪华版',
            dailyPrice: 680.0,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.dailyPrice).toBe('680.00');
      });
    });

    describe('GET /api/admin/vehicle-models/active - 获取启用的车型模板', () => {
      it('应该返回所有启用的车型模板', async () => {
        const response = await request(app.callback())
          .get('/api/admin/vehicle-models/active')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('PUT /api/admin/vehicle-models/:id/toggle - 切换启用状态', () => {
      it('应该成功切换车型模板状态', async () => {
        const response = await request(app.callback())
          .put(`/api/admin/vehicle-models/${vehicleModelId}/toggle`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('再次切换应该恢复状态', async () => {
        const response = await request(app.callback())
          .put(`/api/admin/vehicle-models/${vehicleModelId}/toggle`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('车辆管理', () => {
    describe('POST /api/admin/vehicles - 添加车辆', () => {
      it('应该成功添加车辆', async () => {
        const response = await request(app.callback())
          .post('/api/admin/vehicles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            vehicleModelId: vehicleModelId,
            licensePlate: generateUniqueLicensePlate(),
            vin: generateUniqueVin(),
            year: 2023,
            mileage: 12000,
            ownershipType: 'platform',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        vehicleId = response.body.data.id;
      });

      it('重复车牌号应该返回错误', async () => {
        const firstLicensePlate = generateUniqueLicensePlate();
        const firstVehicle = await request(app.callback())
          .post('/api/admin/vehicles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            vehicleModelId: vehicleModelId,
            licensePlate: firstLicensePlate,
            vin: generateUniqueVin(),
            year: 2023,
            ownershipType: 'platform',
          });

        const duplicateVehicle = await request(app.callback())
          .post('/api/admin/vehicles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            vehicleModelId: vehicleModelId,
            licensePlate: firstLicensePlate,
            vin: generateUniqueVin(),
            year: 2023,
            ownershipType: 'platform',
          });

        expect(duplicateVehicle.status).toBe(500);
        expect(duplicateVehicle.body.success).toBe(false);

        // 清理：删除第一个车辆
        await request(app.callback())
          .delete(`/api/admin/vehicles/${firstVehicle.body.data.id}`)
          .set('Authorization', `Bearer ${adminToken}`);
      });

      it('缺少必填字段应该返回400错误', async () => {
        const response = await request(app.callback())
          .post('/api/admin/vehicles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            licensePlate: generateUniqueLicensePlate(),
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/admin/vehicles/:id - 获取车辆详情', () => {
      it('应该成功获取车辆详情', async () => {
        const response = await request(app.callback())
          .get(`/api/admin/vehicles/${vehicleId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(vehicleId);
        expect(response.body.data).toHaveProperty('vehicleModel');
        expect(response.body.data.vehicleModel.id).toBe(vehicleModelId);
      });
    });

    describe('GET /api/admin/vehicles - 获取车辆列表', () => {
      it('应该成功获取车辆列表', async () => {
        const response = await request(app.callback())
          .get('/api/admin/vehicles')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.list).toBeInstanceOf(Array);
      });

      it('支持按状态筛选', async () => {
        const response = await request(app.callback())
          .get('/api/admin/vehicles')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ status: 'available' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('支持按车型模板筛选', async () => {
        const response = await request(app.callback())
          .get('/api/admin/vehicles')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ vehicleModelId: vehicleModelId })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('PUT /api/admin/vehicles/:id - 更新车辆信息', () => {
      it('应该成功更新车辆信息', async () => {
        const response = await request(app.callback())
          .put(`/api/admin/vehicles/${vehicleId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            mileage: 15000,
            location: '北京海淀店',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('PUT /api/admin/vehicles/:id/status - 更新车辆状态', () => {
      it('应该成功更新车辆状态', async () => {
        const response = await request(app.callback())
          .put(`/api/admin/vehicles/${vehicleId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'maintenance',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('maintenance');
      });

      it('不合法的状态值应该返回错误', async () => {
        const response = await request(app.callback())
          .put(`/api/admin/vehicles/${vehicleId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'invalid_status',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('车辆维护管理', () => {
    describe('POST /api/admin/vehicles/:id/maintenance - 添加维护记录', () => {
      it('应该成功添加维护记录', async () => {
        const response = await request(app.callback())
          .post(`/api/admin/vehicles/${vehicleId}/maintenance`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            maintenanceDate: new Date().toISOString().split('T')[0],
            maintenanceType: 'regular',
            maintenanceContent: '更换机油、机滤',
            maintenanceCost: 580.0,
            mileage: 15000,
            nextMaintenanceDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            maintainedBy: '张师傅',
            remarks: '常规保养',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('缺少必填字段应该返回400错误', async () => {
        const response = await request(app.callback())
          .post(`/api/admin/vehicles/${vehicleId}/maintenance`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            maintenanceDate: new Date().toISOString().split('T')[0],
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/admin/vehicles/:id/maintenance - 获取维护记录', () => {
      it('应该成功获取车辆的维护记录', async () => {
        const response = await request(app.callback())
          .get(`/api/admin/vehicles/${vehicleId}/maintenance`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });
    });
  });

  describe('车辆调度管理', () => {
    describe('POST /api/admin/vehicles/:id/transfers - 添加调度记录', () => {
      it('应该成功添加调度记录', async () => {
        const response = await request(app.callback())
          .post(`/api/admin/vehicles/${vehicleId}/transfers`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            fromStoreId: 'store-001',
            toStoreId: 'store-002',
            transferDate: new Date().toISOString().split('T')[0],
            reason: '客户需求',
            operatedBy: '李经理',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('调出门店和调入门店相同应该返回错误', async () => {
        const response = await request(app.callback())
          .post(`/api/admin/vehicles/${vehicleId}/transfers`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            fromStoreId: 'store-001',
            toStoreId: 'store-001',
            transferDate: new Date().toISOString().split('T')[0],
            reason: '测试',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('调出门店和调入门店不能相同');
      });
    });

    describe('GET /api/admin/vehicles/:id/transfers - 获取调度记录', () => {
      it('应该成功获取车辆的调度记录', async () => {
        const response = await request(app.callback())
          .get(`/api/admin/vehicles/${vehicleId}/transfers`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });
    });
  });

  describe('DELETE /api/admin/vehicles/:id - 删除车辆', () => {
    it('应该成功删除车辆', async () => {
      const response = await request(app.callback())
        .delete(`/api/admin/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('有关联车辆的车型模板不能删除', async () => {
      // 创建新的车型模板和车辆
      const newModel = await request(app.callback())
        .post('/api/admin/vehicle-models')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          modelName: '待删除车型',
          brand: '测试',
          model: 'TEST-DEL',
          category: 'type_b',
          seatCount: 2,
          bedCount: 2,
          dailyPrice: 500.0,
          deposit: 3000.0,
        });

      const newVehicle = await request(app.callback())
        .post('/api/admin/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleModelId: newModel.body.data.id,
          licensePlate: generateUniqueLicensePlate(),
          vin: generateUniqueVin(),
          year: 2023,
          ownershipType: 'platform',
        });

      // 尝试删除有关联车辆的车型模板
      const response = await request(app.callback())
        .delete(`/api/admin/vehicle-models/${newModel.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);

      // 清理：先删除车辆，再删除车型模板
      await request(app.callback())
        .delete(`/api/admin/vehicles/${newVehicle.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      await request(app.callback())
        .delete(`/api/admin/vehicle-models/${vehicleModelId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });
  });
});

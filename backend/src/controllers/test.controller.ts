import { TestService } from '../services/test.service';
import { config } from '../config';

const testService = new TestService();

export class TestController {
  /**
   * Ping 测试
   * GET /api/test/ping
   */
  async ping(ctx: any) {
    ctx.success(
      {
        timestamp: new Date().toISOString(),
        server: 'DaoDaoRV API Server',
        version: '1.0.0',
        environment: config.env,
      },
      'pong'
    );
  }

  /**
   * Echo 测试
   * POST /api/test/echo
   */
  async echo(ctx: any) {
    const body = ctx.request.body;
    ctx.success({
      received: body,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 获取车辆列表
   * GET /api/test/vehicles
   */
  async getVehicles(ctx: any) {
    try {
      const { page = '1', pageSize = '10' } = ctx.query;

      const pageNum = parseInt(page as string, 10);
      const pageSizeNum = parseInt(pageSize as string, 10);

      if (pageNum < 1 || pageSizeNum < 1 || pageSizeNum > 100) {
        ctx.error(400, '分页参数错误');
        return;
      }

      const result = await testService.getVehicles(pageNum, pageSizeNum);
      ctx.success(result);
    } catch (error: any) {
      ctx.error(500, error.message || '获取车辆列表失败');
    }
  }

  /**
   * 创建测试数据
   * POST /api/test/seed
   */
  async seedData(ctx: any) {
    try {
      const vehicles = await testService.createTestVehicles();
      ctx.success(
        {
          created: vehicles.length,
          vehicles,
        },
        '测试数据创建成功'
      );
    } catch (error: any) {
      ctx.error(500, error.message || '创建测试数据失败');
    }
  }
}

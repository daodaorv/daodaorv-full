/**
 * 健康检查控制器
 */
class HealthController {
  /**
   * 健康检查
   */
  async check(ctx: any) {
    ctx.body = {
      code: 200,
      message: 'OK',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      },
    };
  }
}

export const healthController = new HealthController();

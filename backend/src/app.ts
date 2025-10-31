import 'reflect-metadata';
// Application restarted - port 3000 is now free - attempt 3
import Koa from 'koa';
import koaBody from 'koa-body';
import cors from 'koa-cors';
import serve from 'koa-static';
import * as path from 'path';
import { createServer } from 'http';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/error-handler';
import { requestLogger } from './middlewares/request-logger';
import { responseMiddleware } from './middlewares/response';
import router from './routes';
import { initializeDatabase } from './config/database';
import { startPaymentTimeoutTask } from './tasks/payment-timeout.task';
import { startCrowdfundingStatusTask } from './tasks/crowdfunding-status.task';
import { startProfitSharingCalculationTask } from './tasks/profit-sharing-calculation.task';
import { startProfitSharingDistributionTask } from './tasks/profit-sharing-distribution.task';
import { startPointsExpiryTask } from './tasks/points-expiry.task';
import { startPointsClearTask } from './tasks/points-clear.task';
import { startDepositAutoRefundTask } from './tasks/deposit-auto-refund.task';

// 创建Koa应用实例
const app = new Koa();

// 全局错误处理中间件
app.use(errorHandler);

// 请求日志中间件
app.use(requestLogger);

// 响应格式化中间件
app.use(responseMiddleware);

// CORS跨域配置
app.use(cors());

// 请求体解析中间件
app.use(
  koaBody({
    multipart: true,
    formidable: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
    },
  })
);

// 静态文件服务（用于本地开发时访问上传的文件）
app.use(serve(path.join(process.cwd(), 'uploads')));

// 注册路由
app.use(router.routes());
app.use(router.allowedMethods());

// 创建HTTP服务器
const server = createServer(app.callback());

// 初始化数据库并启动服务器
const PORT = config.port || 3000;

export async function startServer() {
  try {
    console.log('🔧 Starting server initialization...');

    // 初始化数据库
    console.log('📦 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    // 启动服务器
    console.log(`🚀 Starting HTTP server on port ${PORT}...`);
    server.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
      console.log(`📝 Environment: ${config.env}`);
      logger.info(`🚀 Server is running on http://localhost:${PORT}`);
      logger.info(`📝 Environment: ${config.env}`);

      // 启动定时任务
      logger.info('⏰ Starting scheduled tasks...');
      startPaymentTimeoutTask(); // 支付超时处理（每5分钟）
      startCrowdfundingStatusTask(); // 众筹状态检查（每小时）
      startProfitSharingCalculationTask(); // 分润计算（每月1日）
      startProfitSharingDistributionTask(); // 分润发放（每月10日）
      startPointsExpiryTask(); // 积分过期（每天）
      startPointsClearTask(); // 积分年度清零（每年12月31日）
      startDepositAutoRefundTask(); // 押金自动退还（每天凌晨2点）
      logger.info('✅ All scheduled tasks started');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 只在直接运行时启动服务器（非测试环境）
if (require.main === module) {
  console.log('🎬 Application starting...');
  startServer();

  // 优雅关闭
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
}

export default app;
export { server };

import Router from 'koa-router';
import { DepositController } from '../controllers/deposit.controller.simple';
// import { authMiddleware } from '../middlewares/auth.middleware';
// import { roleMiddleware } from '../middlewares/role.middleware';

const router = new Router();
const depositController = new DepositController();

// 暂时注释掉认证中间件，先测试基础功能
// router.use(authMiddleware);

// 获取订单押金信息
router.get('/orders/:orderId/deposit-info', depositController.getOrderDepositInfo.bind(depositController));

// 生成押金支付二维码
router.get('/orders/:orderId/deposit-qr', depositController.generateDepositPaymentQR.bind(depositController));

// 处理车辆押金支付
router.post('/orders/:orderId/vehicle-deposit/payment', depositController.processVehicleDepositPayment.bind(depositController));

// 处理违章押金支付
router.post('/orders/:orderId/violation-deposit/payment', depositController.processViolationDepositPayment.bind(depositController));

// 处理车辆押金退还
router.post('/orders/:orderId/vehicle-deposit/refund', depositController.processVehicleDepositRefund.bind(depositController));

// 处理违章押金退还
router.post('/orders/:orderId/violation-deposit/refund', depositController.processViolationDepositRefund.bind(depositController));

// 批量处理违章押金自动退还
router.post('/admin/deposits/violation-auto-refunds', depositController.processViolationDepositAutoRefunds.bind(depositController));

export default router;
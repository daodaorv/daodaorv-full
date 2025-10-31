import Router from 'koa-router';
import { healthController } from '../controllers/health.controller';
import { AuthController } from '../controllers/auth.controller';
import { TestController } from '../controllers/test.controller';
import { UserManagementController } from '../controllers/user-management.controller';
import { VehicleModelController } from '../controllers/vehicle-model.controller';
import { VehicleController } from '../controllers/vehicle.controller';
import { OrderController } from '../controllers/order.controller';
import { WalletController } from '../controllers/wallet.controller';
import { WithdrawalController } from '../controllers/withdrawal.controller';
import { paymentController } from '../controllers/payment.controller';
import { refundController } from '../controllers/refund.controller';
import { uploadController } from '../controllers/upload.controller';
import { CrowdfundingProjectController } from '../controllers/crowdfunding-project.controller';
import { CrowdfundingShareController } from '../controllers/crowdfunding-share.controller';
import { ProfitSharingController } from '../controllers/profit-sharing.controller';
import { OwnerPointsController } from '../controllers/owner-points.controller';
import { CampsiteController } from '../controllers/campsite.controller';
import { CampsiteSpotController } from '../controllers/campsite-spot.controller';
import { CampsiteBookingController } from '../controllers/campsite-booking.controller';
import { CampsiteInquiryController } from '../controllers/campsite-inquiry.controller';
import { CampsiteReviewController } from '../controllers/campsite-review.controller';
import { TourRouteController } from '../controllers/tour-route.controller';
import { TourBatchController } from '../controllers/tour-batch.controller';
import { TourBookingController } from '../controllers/tour-booking.controller';
import { SpecialOfferController } from '../controllers/special-offer.controller';
import { SpecialOfferBookingController } from '../controllers/special-offer-booking.controller';
import {
  CustomerServiceController,
  StaffCustomerServiceController,
} from '../controllers/customer-service.controller';
import { CustomerServiceAdminController } from '../controllers/customer-service-admin.controller';
import { CouponController } from '../controllers/coupon.controller';
import { CouponAdminController } from '../controllers/coupon-admin.controller';
import { CommunityController } from '../controllers/community.controller';
import { CommunityAdminController } from '../controllers/community-admin.controller';
import { UserFavoriteController } from '../controllers/user-favorite.controller';
import { StatisticsAdminController } from '../controllers/statistics-admin.controller';
import { authMiddleware } from '../middlewares/auth';
import { adminAuthMiddleware } from '../middlewares/admin-auth';
import { uploadSingle, uploadMultiple } from '../middlewares/upload.middleware';
import depositRouter from './deposit.routes';

const router = new Router();
const authController = new AuthController();
const testController = new TestController();
const userManagementController = new UserManagementController();
const vehicleModelController = new VehicleModelController();
const vehicleController = new VehicleController();
const orderController = new OrderController();
const walletController = new WalletController();
const withdrawalController = new WithdrawalController();
const crowdfundingProjectController = new CrowdfundingProjectController();
const crowdfundingShareController = new CrowdfundingShareController();
const profitSharingController = new ProfitSharingController();
const ownerPointsController = new OwnerPointsController();
const campsiteController = new CampsiteController();
const campsiteSpotController = new CampsiteSpotController();
const campsiteBookingController = new CampsiteBookingController();
const campsiteInquiryController = new CampsiteInquiryController();
const campsiteReviewController = new CampsiteReviewController();
const tourRouteController = new TourRouteController();
const tourBatchController = new TourBatchController();
const tourBookingController = new TourBookingController();
const specialOfferController = new SpecialOfferController();
const specialOfferBookingController = new SpecialOfferBookingController();
const customerServiceController = new CustomerServiceController();
const staffCustomerServiceController = new StaffCustomerServiceController();
const customerServiceAdminController = new CustomerServiceAdminController();
const couponController = new CouponController();
const couponAdminController = new CouponAdminController();
const userFavoriteController = new UserFavoriteController();
const communityController = new CommunityController();
const communityAdminController = new CommunityAdminController();
const statisticsAdminController = new StatisticsAdminController();

// 健康检查接口
router.get('/health', healthController.check);

// API路由前缀
const apiRouter = new Router({ prefix: '/api' });

// 车型模板公开路由（用户端）
apiRouter.get('/vehicle-models', vehicleModelController.getModelList.bind(vehicleModelController));
apiRouter.get('/vehicle-models/active', vehicleModelController.getActiveModels.bind(vehicleModelController));
apiRouter.get('/vehicle-models/:id', vehicleModelController.getModelDetail.bind(vehicleModelController));

// 认证路由
const authRouter = new Router({ prefix: '/auth' });

// 公开路由（无需认证）
authRouter.post('/register', authController.register.bind(authController));
authRouter.post('/login', authController.login.bind(authController));
authRouter.post('/reset-password', authController.resetPassword.bind(authController));
authRouter.post('/wechat-login', authController.wechatLogin.bind(authController));
authRouter.post('/alipay-login', authController.alipayLogin.bind(authController));
authRouter.post('/douyin-login', authController.douyinLogin.bind(authController));
authRouter.post('/sms-login', authController.smsLogin.bind(authController));
authRouter.post('/send-code', authController.sendCode.bind(authController));

// 受保护路由（需要认证）
authRouter.get('/profile', authMiddleware, authController.getProfile.bind(authController));
authRouter.post('/logout', authMiddleware, authController.logout.bind(authController));
authRouter.post('/real-name', authMiddleware, authController.submitRealName.bind(authController));
authRouter.post(
  '/driving-license',
  authMiddleware,
  authController.submitDrivingLicense.bind(authController)
);
authRouter.post(
  '/change-password',
  authMiddleware,
  authController.changePassword.bind(authController)
);
authRouter.post('/change-phone', authMiddleware, authController.changePhone.bind(authController));

// 测试路由
const testRouter = new Router({ prefix: '/test' });
testRouter.get('/ping', testController.ping.bind(testController));
testRouter.post('/echo', testController.echo.bind(testController));
testRouter.get('/vehicles', testController.getVehicles.bind(testController));
testRouter.post('/seed', testController.seedData.bind(testController));

// 订单路由（用户端，需要登录）
const orderRouter = new Router({ prefix: '/orders' });
orderRouter.post('/', authMiddleware, orderController.createOrder.bind(orderController));
orderRouter.get('/', authMiddleware, orderController.getMyOrders.bind(orderController));
orderRouter.get('/:id', authMiddleware, orderController.getOrderDetail.bind(orderController));
orderRouter.post('/:id/cancel', authMiddleware, orderController.cancelOrder.bind(orderController));

// 钱包路由（用户端，需要登录）
const walletRouter = new Router({ prefix: '/wallet' });
walletRouter.get('/', authMiddleware, walletController.getWalletInfo.bind(walletController));
walletRouter.get(
  '/transactions',
  authMiddleware,
  walletController.getTransactions.bind(walletController)
);
walletRouter.post(
  '/withdraw',
  authMiddleware,
  walletController.requestWithdrawal.bind(walletController)
);
walletRouter.get(
  '/withdrawals',
  authMiddleware,
  walletController.getWithdrawals.bind(walletController)
);

// 支付路由（用户端）
const paymentRouter = new Router({ prefix: '/payment' });
// 创建支付（需要登录）
paymentRouter.post(
  '/create',
  authMiddleware,
  paymentController.createPayment.bind(paymentController)
);
// 查询支付状态（需要登录）
paymentRouter.get(
  '/:paymentNo',
  authMiddleware,
  paymentController.queryPaymentStatus.bind(paymentController)
);
// 微信支付回调（无需登录）
paymentRouter.post('/wechat/callback', paymentController.wechatCallback.bind(paymentController));
// 支付宝回调（无需登录）
paymentRouter.post('/alipay/callback', paymentController.alipayCallback.bind(paymentController));

// 退款路由（用户端）
const refundRouter = new Router({ prefix: '/refund' });
// 获取退款详情（需要登录）
refundRouter.get(
  '/:refundId',
  authMiddleware,
  refundController.getRefundDetail.bind(refundController)
);
// 查询退款状态（需要登录）
refundRouter.get(
  '/status/:refundNo',
  authMiddleware,
  refundController.queryRefundStatus.bind(refundController)
);
// 微信退款回调（无需登录）
refundRouter.post('/wechat/callback', refundController.wechatRefundCallback.bind(refundController));
// 支付宝退款回调（无需登录）
refundRouter.post('/alipay/callback', refundController.alipayRefundCallback.bind(refundController));

// 管理员路由（需要管理员权限）
const adminRouter = new Router({ prefix: '/admin' });

// 用户管理
adminRouter.get(
  '/users',
  adminAuthMiddleware,
  userManagementController.getUserList.bind(userManagementController)
);
adminRouter.get(
  '/users/export',
  adminAuthMiddleware,
  userManagementController.exportUsers.bind(userManagementController)
);
adminRouter.get(
  '/users/:id',
  adminAuthMiddleware,
  userManagementController.getUserDetail.bind(userManagementController)
);
adminRouter.put(
  '/users/:id',
  adminAuthMiddleware,
  userManagementController.updateUserInfo.bind(userManagementController)
);
adminRouter.put(
  '/users/:id/status',
  adminAuthMiddleware,
  userManagementController.updateUserStatus.bind(userManagementController)
);
adminRouter.post(
  '/users/:id/audit/realname',
  adminAuthMiddleware,
  userManagementController.auditRealName.bind(userManagementController)
);
adminRouter.post(
  '/users/:id/audit/driving-license',
  adminAuthMiddleware,
  userManagementController.auditDrivingLicense.bind(userManagementController)
);

// 用户标签管理
adminRouter.get(
  '/users/:id/tags',
  adminAuthMiddleware,
  userManagementController.getUserTags.bind(userManagementController)
);
adminRouter.post(
  '/users/:id/tags',
  adminAuthMiddleware,
  userManagementController.addUserTag.bind(userManagementController)
);
adminRouter.delete(
  '/users/:id/tags/:tagId',
  adminAuthMiddleware,
  userManagementController.removeUserTag.bind(userManagementController)
);
adminRouter.post(
  '/users/tags/batch',
  adminAuthMiddleware,
  userManagementController.batchAddTags.bind(userManagementController)
);

// 标签列表
adminRouter.get(
  '/tags',
  adminAuthMiddleware,
  userManagementController.getTagList.bind(userManagementController)
);

// ====== 车辆管理 ======
// 车型模板管理
adminRouter.get(
  '/vehicle-models',
  adminAuthMiddleware,
  vehicleModelController.getModelList.bind(vehicleModelController)
);
adminRouter.get(
  '/vehicle-models/active',
  adminAuthMiddleware,
  vehicleModelController.getActiveModels.bind(vehicleModelController)
);
adminRouter.get(
  '/vehicle-models/:id',
  adminAuthMiddleware,
  vehicleModelController.getModelDetail.bind(vehicleModelController)
);
adminRouter.post(
  '/vehicle-models',
  adminAuthMiddleware,
  vehicleModelController.createModel.bind(vehicleModelController)
);
adminRouter.put(
  '/vehicle-models/:id',
  adminAuthMiddleware,
  vehicleModelController.updateModel.bind(vehicleModelController)
);
adminRouter.delete(
  '/vehicle-models/:id',
  adminAuthMiddleware,
  vehicleModelController.deleteModel.bind(vehicleModelController)
);
adminRouter.put(
  '/vehicle-models/:id/toggle',
  adminAuthMiddleware,
  vehicleModelController.toggleActive.bind(vehicleModelController)
);

// 车辆管理
adminRouter.get(
  '/vehicles',
  adminAuthMiddleware,
  vehicleController.getVehicleList.bind(vehicleController)
);
adminRouter.get(
  '/vehicles/:id',
  adminAuthMiddleware,
  vehicleController.getVehicleDetail.bind(vehicleController)
);
adminRouter.post(
  '/vehicles',
  adminAuthMiddleware,
  vehicleController.createVehicle.bind(vehicleController)
);
adminRouter.put(
  '/vehicles/:id',
  adminAuthMiddleware,
  vehicleController.updateVehicle.bind(vehicleController)
);
adminRouter.delete(
  '/vehicles/:id',
  adminAuthMiddleware,
  vehicleController.deleteVehicle.bind(vehicleController)
);
adminRouter.put(
  '/vehicles/:id/status',
  adminAuthMiddleware,
  vehicleController.updateVehicleStatus.bind(vehicleController)
);

// 车辆维护记录
adminRouter.get(
  '/vehicles/:id/maintenance',
  adminAuthMiddleware,
  vehicleController.getMaintenanceRecords.bind(vehicleController)
);
adminRouter.post(
  '/vehicles/:id/maintenance',
  adminAuthMiddleware,
  vehicleController.addMaintenanceRecord.bind(vehicleController)
);

// 车辆调度记录
adminRouter.get(
  '/vehicles/:id/transfers',
  adminAuthMiddleware,
  vehicleController.getTransferRecords.bind(vehicleController)
);
adminRouter.post(
  '/vehicles/:id/transfers',
  adminAuthMiddleware,
  vehicleController.addTransferRecord.bind(vehicleController)
);

// 订单管理（管理端）
adminRouter.get(
  '/orders',
  adminAuthMiddleware,
  orderController.getAdminOrders.bind(orderController)
);
adminRouter.get(
  '/orders/:id',
  adminAuthMiddleware,
  orderController.getAdminOrderDetail.bind(orderController)
);
adminRouter.put(
  '/orders/:id/status',
  adminAuthMiddleware,
  orderController.updateOrderStatus.bind(orderController)
);
adminRouter.post(
  '/orders/:id/refund',
  adminAuthMiddleware,
  orderController.processRefund.bind(orderController)
);

// ====== 钱包和提现管理 ======
// 提现审核（管理端）
adminRouter.get(
  '/withdrawals',
  adminAuthMiddleware,
  withdrawalController.getWithdrawalList.bind(withdrawalController)
);
adminRouter.get(
  '/withdrawals/:id',
  adminAuthMiddleware,
  withdrawalController.getWithdrawalDetail.bind(withdrawalController)
);
adminRouter.post(
  '/withdrawals/:id/review',
  adminAuthMiddleware,
  withdrawalController.reviewWithdrawal.bind(withdrawalController)
);

// 余额调整（管理端）
adminRouter.post(
  '/wallet/adjust',
  adminAuthMiddleware,
  withdrawalController.adjustBalance.bind(withdrawalController)
);

// ====== 支付配置管理 ======
// 获取支付配置
adminRouter.get(
  '/payment/config/:platform',
  adminAuthMiddleware,
  paymentController.getPaymentConfig.bind(paymentController)
);
// 更新支付配置
adminRouter.post(
  '/payment/config/:platform',
  adminAuthMiddleware,
  paymentController.updatePaymentConfig.bind(paymentController)
);
// 测试支付配置
adminRouter.post(
  '/payment/config/:platform/test',
  adminAuthMiddleware,
  paymentController.testPaymentConfig.bind(paymentController)
);

// ====== 退款管理 ======
// 创建退款申请
adminRouter.post(
  '/refund/create',
  adminAuthMiddleware,
  refundController.createRefund.bind(refundController)
);
// 处理退款
adminRouter.post(
  '/refund/process/:refundId',
  adminAuthMiddleware,
  refundController.processRefund.bind(refundController)
);

// ====== 文件上传管理 ======
// 批量上传
adminRouter.post(
  '/upload/batch',
  adminAuthMiddleware,
  (ctx, next) => uploadMultiple('files', 20)(ctx as any, next),
  uploadController.batchUpload.bind(uploadController)
);
// 获取所有文件列表
adminRouter.get(
  '/upload/files',
  adminAuthMiddleware,
  uploadController.getAllFiles.bind(uploadController)
);
// 删除任意文件
adminRouter.delete(
  '/upload/:fileId',
  adminAuthMiddleware,
  uploadController.deleteAnyFile.bind(uploadController)
);
// 上传统计
adminRouter.get(
  '/upload/stats',
  adminAuthMiddleware,
  uploadController.getUploadStats.bind(uploadController)
);
// 清理未使用文件
adminRouter.post(
  '/upload/clean',
  adminAuthMiddleware,
  uploadController.cleanUnusedFiles.bind(uploadController)
);

// 文件上传路由（用户端，需要登录）
const uploadRouter = new Router({ prefix: '/upload' });
uploadRouter.post(
  '/image',
  authMiddleware,
  (ctx, next) => uploadSingle('file')(ctx as any, next),
  uploadController.uploadImage.bind(uploadController)
);
uploadRouter.post(
  '/avatar',
  authMiddleware,
  (ctx, next) => uploadSingle('file')(ctx as any, next),
  uploadController.uploadAvatar.bind(uploadController)
);
uploadRouter.post(
  '/idcard',
  authMiddleware,
  (ctx, next) => uploadSingle('file')(ctx as any, next),
  uploadController.uploadIDCard.bind(uploadController)
);
uploadRouter.post(
  '/license',
  authMiddleware,
  (ctx, next) => uploadSingle('file')(ctx as any, next),
  uploadController.uploadDrivingLicense.bind(uploadController)
);
uploadRouter.post(
  '/document',
  authMiddleware,
  (ctx, next) => uploadSingle('file')(ctx as any, next),
  uploadController.uploadDocument.bind(uploadController)
);
uploadRouter.get('/my-files', authMiddleware, uploadController.getMyFiles.bind(uploadController));
uploadRouter.delete('/:fileId', authMiddleware, uploadController.deleteFile.bind(uploadController));

// 众筹管理路由（用户端，需要登录）
const crowdfundingRouter = new Router({ prefix: '/crowdfunding' });
// 众筹项目
crowdfundingRouter.get(
  '/projects',
  authMiddleware,
  crowdfundingProjectController.getProjects.bind(crowdfundingProjectController)
);
crowdfundingRouter.get(
  '/projects/:id',
  authMiddleware,
  crowdfundingProjectController.getProjectById.bind(crowdfundingProjectController)
);
crowdfundingRouter.get(
  '/projects/:id/progress',
  authMiddleware,
  crowdfundingProjectController.getProjectProgress.bind(crowdfundingProjectController)
);
// 众筹份额
crowdfundingRouter.post(
  '/shares/purchase',
  authMiddleware,
  crowdfundingShareController.purchaseShares.bind(crowdfundingShareController)
);
crowdfundingRouter.get(
  '/shares/my',
  authMiddleware,
  crowdfundingShareController.getMyShares.bind(crowdfundingShareController)
);
crowdfundingRouter.get(
  '/shares/:id',
  authMiddleware,
  crowdfundingShareController.getShareById.bind(crowdfundingShareController)
);
crowdfundingRouter.post(
  '/shares/:id/sign-agreement',
  authMiddleware,
  crowdfundingShareController.signAgreement.bind(crowdfundingShareController)
);
// 分润记录
crowdfundingRouter.get(
  '/profit-sharings/my',
  authMiddleware,
  profitSharingController.getMyProfitSharings.bind(profitSharingController)
);
crowdfundingRouter.get(
  '/profit-sharings/:id',
  authMiddleware,
  profitSharingController.getProfitSharingById.bind(profitSharingController)
);
// 车主积分
crowdfundingRouter.get(
  '/points/my',
  authMiddleware,
  ownerPointsController.getMyPoints.bind(ownerPointsController)
);
crowdfundingRouter.get(
  '/points/transactions',
  authMiddleware,
  ownerPointsController.getPointsTransactions.bind(ownerPointsController)
);
crowdfundingRouter.post(
  '/points/use',
  authMiddleware,
  ownerPointsController.usePoints.bind(ownerPointsController)
);

// 众筹管理路由（管理端）
// 众筹项目管理
adminRouter.post(
  '/crowdfunding/projects',
  adminAuthMiddleware,
  crowdfundingProjectController.createProject.bind(crowdfundingProjectController)
);
adminRouter.put(
  '/crowdfunding/projects/:id',
  adminAuthMiddleware,
  crowdfundingProjectController.updateProject.bind(crowdfundingProjectController)
);
adminRouter.post(
  '/crowdfunding/projects/:id/publish',
  adminAuthMiddleware,
  crowdfundingProjectController.publishProject.bind(crowdfundingProjectController)
);
adminRouter.post(
  '/crowdfunding/projects/:id/close',
  adminAuthMiddleware,
  crowdfundingProjectController.closeProject.bind(crowdfundingProjectController)
);
adminRouter.get(
  '/crowdfunding/projects',
  adminAuthMiddleware,
  crowdfundingProjectController.getAllProjects.bind(crowdfundingProjectController)
);
adminRouter.get(
  '/crowdfunding/projects/stats',
  adminAuthMiddleware,
  crowdfundingProjectController.getProjectStats.bind(crowdfundingProjectController)
);
// 众筹份额管理
adminRouter.get(
  '/crowdfunding/shares',
  adminAuthMiddleware,
  crowdfundingShareController.getAllShares.bind(crowdfundingShareController)
);
adminRouter.get(
  '/crowdfunding/shares/:id',
  adminAuthMiddleware,
  crowdfundingShareController.getShareDetails.bind(crowdfundingShareController)
);
adminRouter.get(
  '/crowdfunding/shares/stats',
  adminAuthMiddleware,
  crowdfundingShareController.getShareStats.bind(crowdfundingShareController)
);
// 分润管理
adminRouter.post(
  '/crowdfunding/profit-sharings/calculate',
  adminAuthMiddleware,
  profitSharingController.calculateProfitSharing.bind(profitSharingController)
);
adminRouter.post(
  '/crowdfunding/profit-sharings/distribute',
  adminAuthMiddleware,
  profitSharingController.distributeProfitSharing.bind(profitSharingController)
);
adminRouter.get(
  '/crowdfunding/profit-sharings',
  adminAuthMiddleware,
  profitSharingController.getAllProfitSharings.bind(profitSharingController)
);
adminRouter.get(
  '/crowdfunding/profit-sharings/stats',
  adminAuthMiddleware,
  profitSharingController.getProfitSharingStats.bind(profitSharingController)
);
// 车主积分管理
adminRouter.get(
  '/crowdfunding/points',
  adminAuthMiddleware,
  ownerPointsController.getAllPoints.bind(ownerPointsController)
);
adminRouter.get(
  '/crowdfunding/points/stats',
  adminAuthMiddleware,
  ownerPointsController.getPointsStats.bind(ownerPointsController)
);
adminRouter.get(
  '/crowdfunding/points/:userId',
  adminAuthMiddleware,
  ownerPointsController.getUserPoints.bind(ownerPointsController)
);
adminRouter.get(
  '/crowdfunding/points/:userId/transactions',
  adminAuthMiddleware,
  ownerPointsController.getUserPointsTransactions.bind(ownerPointsController)
);
adminRouter.post(
  '/crowdfunding/points/grant',
  adminAuthMiddleware,
  ownerPointsController.grantPoints.bind(ownerPointsController)
);

// ==================== 营地管理路由 ====================

// 营地路由（用户端）
const campsiteRouter = new Router({ prefix: '/campsites' });

// 营地查询
campsiteRouter.get('/', campsiteController.getCampsites.bind(campsiteController));
campsiteRouter.get('/:id', campsiteController.getCampsiteById.bind(campsiteController));

// 营位查询
campsiteRouter.get(
  '/:campsiteId/spots',
  campsiteSpotController.getSpotsByCampsite.bind(campsiteSpotController)
);
campsiteRouter.post(
  '/spots/check-availability',
  campsiteSpotController.checkAvailability.bind(campsiteSpotController)
);

// 营地预订
campsiteRouter.post(
  '/bookings',
  authMiddleware,
  campsiteBookingController.createBooking.bind(campsiteBookingController)
);
campsiteRouter.get(
  '/bookings/my',
  authMiddleware,
  campsiteBookingController.getMyBookings.bind(campsiteBookingController)
);
campsiteRouter.get(
  '/bookings/:id',
  authMiddleware,
  campsiteBookingController.getBookingById.bind(campsiteBookingController)
);
campsiteRouter.post(
  '/bookings/:id/cancel',
  authMiddleware,
  campsiteBookingController.cancelBooking.bind(campsiteBookingController)
);

// 营地咨询
campsiteRouter.post(
  '/inquiries',
  authMiddleware,
  campsiteInquiryController.createInquiry.bind(campsiteInquiryController)
);
campsiteRouter.get(
  '/inquiries/my',
  authMiddleware,
  campsiteInquiryController.getMyInquiries.bind(campsiteInquiryController)
);

// 营地评价
campsiteRouter.post(
  '/reviews',
  authMiddleware,
  campsiteReviewController.createReview.bind(campsiteReviewController)
);
campsiteRouter.get(
  '/:campsiteId/reviews',
  campsiteReviewController.getReviewsByCampsite.bind(campsiteReviewController)
);

// 营地管理路由（管理端）
// 营地管理
adminRouter.post(
  '/campsites',
  adminAuthMiddleware,
  campsiteController.adminCreateCampsite.bind(campsiteController)
);
adminRouter.put(
  '/campsites/:id',
  adminAuthMiddleware,
  campsiteController.adminUpdateCampsite.bind(campsiteController)
);
adminRouter.put(
  '/campsites/:id/mode',
  adminAuthMiddleware,
  campsiteController.adminSwitchBookingMode.bind(campsiteController)
);
adminRouter.put(
  '/campsites/:id/status',
  adminAuthMiddleware,
  campsiteController.adminSwitchStatus.bind(campsiteController)
);
adminRouter.get(
  '/campsites',
  adminAuthMiddleware,
  campsiteController.adminGetCampsites.bind(campsiteController)
);
adminRouter.get(
  '/campsites/:id',
  adminAuthMiddleware,
  campsiteController.adminGetCampsiteById.bind(campsiteController)
);
adminRouter.delete(
  '/campsites/:id',
  adminAuthMiddleware,
  campsiteController.adminDeleteCampsite.bind(campsiteController)
);

// 营位管理
adminRouter.post(
  '/campsites/spots',
  adminAuthMiddleware,
  campsiteSpotController.adminCreateSpot.bind(campsiteSpotController)
);
adminRouter.put(
  '/campsites/spots/:id',
  adminAuthMiddleware,
  campsiteSpotController.adminUpdateSpot.bind(campsiteSpotController)
);
adminRouter.get(
  '/campsites/:campsiteId/spots',
  adminAuthMiddleware,
  campsiteSpotController.adminGetSpotsByCampsite.bind(campsiteSpotController)
);
adminRouter.get(
  '/campsites/spots/:id',
  adminAuthMiddleware,
  campsiteSpotController.adminGetSpotById.bind(campsiteSpotController)
);
adminRouter.delete(
  '/campsites/spots/:id',
  adminAuthMiddleware,
  campsiteSpotController.adminDeleteSpot.bind(campsiteSpotController)
);

// 预订管理
adminRouter.get(
  '/campsites/bookings',
  adminAuthMiddleware,
  campsiteBookingController.adminGetBookings.bind(campsiteBookingController)
);
adminRouter.get(
  '/campsites/bookings/:id',
  adminAuthMiddleware,
  campsiteBookingController.adminGetBookingById.bind(campsiteBookingController)
);
adminRouter.put(
  '/campsites/bookings/:id/status',
  adminAuthMiddleware,
  campsiteBookingController.adminUpdateBookingStatus.bind(campsiteBookingController)
);

// 咨询管理
adminRouter.get(
  '/campsites/inquiries',
  adminAuthMiddleware,
  campsiteInquiryController.adminGetInquiries.bind(campsiteInquiryController)
);
adminRouter.get(
  '/campsites/inquiries/:id',
  adminAuthMiddleware,
  campsiteInquiryController.adminGetInquiryById.bind(campsiteInquiryController)
);
adminRouter.put(
  '/campsites/inquiries/:id',
  adminAuthMiddleware,
  campsiteInquiryController.adminUpdateInquiry.bind(campsiteInquiryController)
);

// 评价管理
adminRouter.get(
  '/campsites/reviews',
  adminAuthMiddleware,
  campsiteReviewController.adminGetReviews.bind(campsiteReviewController)
);
adminRouter.delete(
  '/campsites/reviews/:id',
  adminAuthMiddleware,
  campsiteReviewController.adminDeleteReview.bind(campsiteReviewController)
);

// ==================== 定制旅游管理路由 ====================

// 定制旅游路由（用户端）
const tourRouter = new Router({ prefix: '/tours' });

// 旅游路线查询
tourRouter.get('/routes', tourRouteController.getRoutes.bind(tourRouteController));
tourRouter.get('/routes/:id', tourRouteController.getRouteById.bind(tourRouteController));

// 批次查询
tourRouter.get(
  '/routes/:routeId/batches',
  tourBatchController.getAvailableBatches.bind(tourBatchController)
);

// 旅游预订
tourRouter.post(
  '/bookings',
  authMiddleware,
  tourBookingController.createBooking.bind(tourBookingController)
);
tourRouter.get(
  '/bookings/my',
  authMiddleware,
  tourBookingController.getMyBookings.bind(tourBookingController)
);
tourRouter.get(
  '/bookings/:id',
  authMiddleware,
  tourBookingController.getBookingById.bind(tourBookingController)
);
tourRouter.post(
  '/bookings/:id/cancel',
  authMiddleware,
  tourBookingController.cancelBooking.bind(tourBookingController)
);

// 定制旅游管理路由（管理端）
// 旅游路线管理
adminRouter.post(
  '/tours/routes',
  adminAuthMiddleware,
  tourRouteController.adminCreateRoute.bind(tourRouteController)
);
adminRouter.put(
  '/tours/routes/:id',
  adminAuthMiddleware,
  tourRouteController.adminUpdateRoute.bind(tourRouteController)
);
adminRouter.put(
  '/tours/routes/:id/status',
  adminAuthMiddleware,
  tourRouteController.adminSwitchStatus.bind(tourRouteController)
);
adminRouter.put(
  '/tours/routes/:id/booking-mode',
  adminAuthMiddleware,
  tourRouteController.adminSwitchBookingMode.bind(tourRouteController)
);
adminRouter.get(
  '/tours/routes',
  adminAuthMiddleware,
  tourRouteController.adminGetRoutes.bind(tourRouteController)
);
adminRouter.get(
  '/tours/routes/:id',
  adminAuthMiddleware,
  tourRouteController.adminGetRouteById.bind(tourRouteController)
);
adminRouter.delete(
  '/tours/routes/:id',
  adminAuthMiddleware,
  tourRouteController.adminDeleteRoute.bind(tourRouteController)
);

// 出发批次管理
adminRouter.post(
  '/tours/batches',
  adminAuthMiddleware,
  tourBatchController.adminCreateBatch.bind(tourBatchController)
);
adminRouter.put(
  '/tours/batches/:id',
  adminAuthMiddleware,
  tourBatchController.adminUpdateBatch.bind(tourBatchController)
);
adminRouter.put(
  '/tours/batches/:id/status',
  adminAuthMiddleware,
  tourBatchController.adminUpdateBatchStatus.bind(tourBatchController)
);
adminRouter.get(
  '/tours/batches',
  adminAuthMiddleware,
  tourBatchController.adminGetBatches.bind(tourBatchController)
);
adminRouter.get(
  '/tours/batches/:id',
  adminAuthMiddleware,
  tourBatchController.adminGetBatchById.bind(tourBatchController)
);
adminRouter.delete(
  '/tours/batches/:id',
  adminAuthMiddleware,
  tourBatchController.adminDeleteBatch.bind(tourBatchController)
);

// 旅游预订管理
adminRouter.get(
  '/tours/bookings',
  adminAuthMiddleware,
  tourBookingController.adminGetBookings.bind(tourBookingController)
);
adminRouter.get(
  '/tours/bookings/:id',
  adminAuthMiddleware,
  tourBookingController.adminGetBookingById.bind(tourBookingController)
);
adminRouter.put(
  '/tours/bookings/:id/status',
  adminAuthMiddleware,
  tourBookingController.adminUpdateBookingStatus.bind(tourBookingController)
);

// ==================== 特惠租车管理路由 ====================

// 特惠租车路由（用户端）
const specialOfferRouter = new Router({ prefix: '/special-offers' });

// 特惠套餐查询
specialOfferRouter.get('/', specialOfferController.getOfferList.bind(specialOfferController));
specialOfferRouter.get('/:id', specialOfferController.getOfferDetail.bind(specialOfferController));

// 特惠订单管理
specialOfferRouter.post(
  '/bookings',
  authMiddleware,
  specialOfferBookingController.createBooking.bind(specialOfferBookingController)
);
specialOfferRouter.get(
  '/bookings',
  authMiddleware,
  specialOfferBookingController.getMyBookings.bind(specialOfferBookingController)
);
specialOfferRouter.get(
  '/bookings/:id',
  authMiddleware,
  specialOfferBookingController.getBookingDetail.bind(specialOfferBookingController)
);
specialOfferRouter.post(
  '/bookings/:id/cancel',
  authMiddleware,
  specialOfferBookingController.cancelBooking.bind(specialOfferBookingController)
);

// 特惠租车管理路由（管理端）
// 特惠套餐管理
adminRouter.post(
  '/special-offers',
  adminAuthMiddleware,
  specialOfferController.adminCreateOffer.bind(specialOfferController)
);
adminRouter.put(
  '/special-offers/:id',
  adminAuthMiddleware,
  specialOfferController.adminUpdateOffer.bind(specialOfferController)
);
adminRouter.get(
  '/special-offers',
  adminAuthMiddleware,
  specialOfferController.adminGetOfferList.bind(specialOfferController)
);
adminRouter.get(
  '/special-offers/:id',
  adminAuthMiddleware,
  specialOfferController.adminGetOfferDetail.bind(specialOfferController)
);
adminRouter.put(
  '/special-offers/:id/status',
  adminAuthMiddleware,
  specialOfferController.adminSwitchStatus.bind(specialOfferController)
);
adminRouter.delete(
  '/special-offers/:id',
  adminAuthMiddleware,
  specialOfferController.adminDeleteOffer.bind(specialOfferController)
);

// 特惠订单管理
adminRouter.get(
  '/special-offers/bookings',
  adminAuthMiddleware,
  specialOfferBookingController.adminGetBookingList.bind(specialOfferBookingController)
);
adminRouter.get(
  '/special-offers/bookings/:id',
  adminAuthMiddleware,
  specialOfferBookingController.adminGetBookingDetail.bind(specialOfferBookingController)
);
adminRouter.put(
  '/special-offers/bookings/:id/assign-vehicle',
  adminAuthMiddleware,
  specialOfferBookingController.adminAssignVehicle.bind(specialOfferBookingController)
);
adminRouter.put(
  '/special-offers/bookings/:id/complete',
  adminAuthMiddleware,
  specialOfferBookingController.adminCompleteBooking.bind(specialOfferBookingController)
);

// ==================== 客服系统路由 ====================
const customerServiceRouter = new Router({ prefix: '/customer-service' });

// 用户端 - 会话管理
customerServiceRouter.post(
  '/sessions',
  authMiddleware,
  customerServiceController.createSession.bind(customerServiceController)
);
customerServiceRouter.get(
  '/sessions',
  authMiddleware,
  customerServiceController.getMySessions.bind(customerServiceController)
);
customerServiceRouter.get(
  '/sessions/:id',
  authMiddleware,
  customerServiceController.getSessionDetail.bind(customerServiceController)
);
customerServiceRouter.post(
  '/sessions/:id/messages',
  authMiddleware,
  customerServiceController.sendMessage.bind(customerServiceController)
);
customerServiceRouter.get(
  '/sessions/:id/messages',
  authMiddleware,
  customerServiceController.getMessages.bind(customerServiceController)
);
customerServiceRouter.put(
  '/sessions/:id/close',
  authMiddleware,
  customerServiceController.closeSession.bind(customerServiceController)
);
customerServiceRouter.post(
  '/sessions/:id/rate',
  authMiddleware,
  customerServiceController.rateSession.bind(customerServiceController)
);

// 用户端 - 工单管理
customerServiceRouter.post(
  '/tickets',
  authMiddleware,
  customerServiceController.createTicket.bind(customerServiceController)
);
customerServiceRouter.get(
  '/tickets',
  authMiddleware,
  customerServiceController.getMyTickets.bind(customerServiceController)
);
customerServiceRouter.get(
  '/tickets/:id',
  authMiddleware,
  customerServiceController.getTicketDetail.bind(customerServiceController)
);

// 客服端路由
const staffCustomerServiceRouter = new Router({ prefix: '/staff/customer-service' });

staffCustomerServiceRouter.get(
  '/sessions',
  authMiddleware,
  staffCustomerServiceController.getSessionList.bind(staffCustomerServiceController)
);
staffCustomerServiceRouter.post(
  '/sessions/:id/accept',
  authMiddleware,
  staffCustomerServiceController.acceptSession.bind(staffCustomerServiceController)
);
staffCustomerServiceRouter.post(
  '/sessions/:id/transfer',
  authMiddleware,
  staffCustomerServiceController.transferSession.bind(staffCustomerServiceController)
);
staffCustomerServiceRouter.get(
  '/quick-replies',
  authMiddleware,
  staffCustomerServiceController.getQuickReplies.bind(staffCustomerServiceController)
);

// 管理端 - 客服系统管理
adminRouter.get(
  '/customer-service/sessions',
  adminAuthMiddleware,
  customerServiceAdminController.getAllSessions.bind(customerServiceAdminController)
);
adminRouter.get(
  '/customer-service/tickets',
  adminAuthMiddleware,
  customerServiceAdminController.getAllTickets.bind(customerServiceAdminController)
);
adminRouter.put(
  '/customer-service/tickets/:id/assign',
  adminAuthMiddleware,
  customerServiceAdminController.assignTicket.bind(customerServiceAdminController)
);
adminRouter.get(
  '/customer-service/statistics',
  adminAuthMiddleware,
  customerServiceAdminController.getStatistics.bind(customerServiceAdminController)
);

// 管理端 - 快捷回复管理
adminRouter.post(
  '/customer-service/quick-replies',
  adminAuthMiddleware,
  customerServiceAdminController.createQuickReply.bind(customerServiceAdminController)
);
adminRouter.put(
  '/customer-service/quick-replies/:id',
  adminAuthMiddleware,
  customerServiceAdminController.updateQuickReply.bind(customerServiceAdminController)
);
adminRouter.delete(
  '/customer-service/quick-replies/:id',
  adminAuthMiddleware,
  customerServiceAdminController.deleteQuickReply.bind(customerServiceAdminController)
);
adminRouter.get(
  '/customer-service/quick-replies',
  adminAuthMiddleware,
  customerServiceAdminController.getQuickReplies.bind(customerServiceAdminController)
);

// ==================== 优惠券路由 ====================
const couponRouter = new Router({ prefix: '/coupons' });

// 用户端 - 优惠券商城
couponRouter.get('/templates', couponController.getTemplateList.bind(couponController));

// 用户端 - 购买优惠券
couponRouter.post(
  '/purchase',
  authMiddleware,
  couponController.purchaseCoupon.bind(couponController)
);

// 用户端 - 我的优惠券
couponRouter.get('/my', authMiddleware, couponController.getMyCoupons.bind(couponController));

// 用户端 - 优惠券详情
couponRouter.get('/:id', authMiddleware, couponController.getCouponDetail.bind(couponController));

// 用户端 - 转赠优惠券
couponRouter.post(
  '/:id/transfer',
  authMiddleware,
  couponController.transferCoupon.bind(couponController)
);

// 用户端 - 获取可用优惠券（下单时）
couponRouter.get(
  '/available',
  authMiddleware,
  couponController.getAvailableCoupons.bind(couponController)
);

// 用户收藏路由
const favoriteRouter = new Router({ prefix: '/user/favorites' });

// 收藏管理
favoriteRouter.post('/', authMiddleware, userFavoriteController.addFavorite.bind(userFavoriteController));
favoriteRouter.delete('/:id', authMiddleware, userFavoriteController.removeFavoriteById.bind(userFavoriteController));
favoriteRouter.get('/', authMiddleware, userFavoriteController.getFavoriteList.bind(userFavoriteController));
favoriteRouter.get('/status', authMiddleware, userFavoriteController.checkFavoriteStatus.bind(userFavoriteController));
favoriteRouter.post('/batch-check', authMiddleware, userFavoriteController.batchCheckFavoriteStatus.bind(userFavoriteController));
favoriteRouter.get('/count', authMiddleware, userFavoriteController.getFavoriteCount.bind(userFavoriteController));

// 兼容旧API
apiRouter.post('/user/favorites', authMiddleware, userFavoriteController.addFavorite.bind(userFavoriteController));
apiRouter.delete('/user/favorites/:id', authMiddleware, userFavoriteController.removeFavoriteById.bind(userFavoriteController));

// 管理端 - 优惠券模板管理
adminRouter.post(
  '/coupons/templates',
  adminAuthMiddleware,
  couponAdminController.createTemplate.bind(couponAdminController)
);
adminRouter.put(
  '/coupons/templates/:id',
  adminAuthMiddleware,
  couponAdminController.updateTemplate.bind(couponAdminController)
);
adminRouter.delete(
  '/coupons/templates/:id',
  adminAuthMiddleware,
  couponAdminController.deleteTemplate.bind(couponAdminController)
);
adminRouter.get(
  '/coupons/templates',
  adminAuthMiddleware,
  couponAdminController.getTemplateList.bind(couponAdminController)
);
adminRouter.get(
  '/coupons/templates/:id',
  adminAuthMiddleware,
  couponAdminController.getTemplateDetail.bind(couponAdminController)
);
adminRouter.put(
  '/coupons/templates/:id/toggle',
  adminAuthMiddleware,
  couponAdminController.toggleActive.bind(couponAdminController)
);

// 管理端 - 优惠券发放管理
adminRouter.post(
  '/coupons/distribute',
  adminAuthMiddleware,
  couponAdminController.distributeCoupons.bind(couponAdminController)
);
adminRouter.get(
  '/coupons/distributions',
  adminAuthMiddleware,
  couponAdminController.getDistributionList.bind(couponAdminController)
);

// 管理端 - 优惠券统计
adminRouter.get(
  '/coupons/statistics',
  adminAuthMiddleware,
  couponAdminController.getStatistics.bind(couponAdminController)
);

// 管理端 - 用户优惠券查询
adminRouter.get(
  '/coupons/users',
  adminAuthMiddleware,
  couponAdminController.getUserCoupons.bind(couponAdminController)
);

// ==================== 社区管理路由 ====================

// 用户端 - 社区路由
const communityRouter = new Router({ prefix: '/community' });

// 帖子管理
communityRouter.post(
  '/posts',
  authMiddleware,
  communityController.createPost.bind(communityController)
);
communityRouter.get('/posts', communityController.getPostList.bind(communityController));
communityRouter.get('/posts/:id', communityController.getPostDetail.bind(communityController));
communityRouter.delete(
  '/posts/:id',
  authMiddleware,
  communityController.deletePost.bind(communityController)
);

// 评论管理
communityRouter.post(
  '/posts/:id/comments',
  authMiddleware,
  communityController.createComment.bind(communityController)
);
communityRouter.get(
  '/posts/:id/comments',
  communityController.getCommentList.bind(communityController)
);
communityRouter.delete(
  '/comments/:id',
  authMiddleware,
  communityController.deleteComment.bind(communityController)
);

// 互动功能
communityRouter.post(
  '/posts/:id/like',
  authMiddleware,
  communityController.toggleLikePost.bind(communityController)
);
communityRouter.post(
  '/posts/:id/collect',
  authMiddleware,
  communityController.toggleCollectPost.bind(communityController)
);
communityRouter.post(
  '/posts/:id/share',
  authMiddleware,
  communityController.sharePost.bind(communityController)
);

// 话题功能
communityRouter.get('/topics', communityController.getTopicList.bind(communityController));
communityRouter.get(
  '/topics/:id/posts',
  communityController.getTopicPosts.bind(communityController)
);

// 举报功能
communityRouter.post(
  '/reports',
  authMiddleware,
  communityController.createReport.bind(communityController)
);

// 管理端 - 帖子审核
adminRouter.get(
  '/community/posts',
  adminAuthMiddleware,
  communityAdminController.getPostList.bind(communityAdminController)
);
adminRouter.get(
  '/community/posts/:id',
  adminAuthMiddleware,
  communityAdminController.getPostDetail.bind(communityAdminController)
);
adminRouter.put(
  '/community/posts/:id/audit',
  adminAuthMiddleware,
  communityAdminController.auditPost.bind(communityAdminController)
);
adminRouter.delete(
  '/community/posts/:id',
  adminAuthMiddleware,
  communityAdminController.deletePost.bind(communityAdminController)
);
adminRouter.put(
  '/community/posts/:id/top',
  adminAuthMiddleware,
  communityAdminController.toggleTopPost.bind(communityAdminController)
);

// 管理端 - 评论审核
adminRouter.get(
  '/community/comments',
  adminAuthMiddleware,
  communityAdminController.getCommentList.bind(communityAdminController)
);
adminRouter.put(
  '/community/comments/:id/audit',
  adminAuthMiddleware,
  communityAdminController.auditComment.bind(communityAdminController)
);
adminRouter.delete(
  '/community/comments/:id',
  adminAuthMiddleware,
  communityAdminController.deleteComment.bind(communityAdminController)
);

// 管理端 - 话题管理
adminRouter.post(
  '/community/topics',
  adminAuthMiddleware,
  communityAdminController.createTopic.bind(communityAdminController)
);
adminRouter.put(
  '/community/topics/:id',
  adminAuthMiddleware,
  communityAdminController.updateTopic.bind(communityAdminController)
);
adminRouter.delete(
  '/community/topics/:id',
  adminAuthMiddleware,
  communityAdminController.deleteTopic.bind(communityAdminController)
);
adminRouter.get(
  '/community/topics',
  adminAuthMiddleware,
  communityAdminController.getTopicList.bind(communityAdminController)
);

// 管理端 - 举报处理
adminRouter.get(
  '/community/reports',
  adminAuthMiddleware,
  communityAdminController.getReportList.bind(communityAdminController)
);
adminRouter.put(
  '/community/reports/:id/handle',
  adminAuthMiddleware,
  communityAdminController.handleReport.bind(communityAdminController)
);

// 管理端 - 社区统计
adminRouter.get(
  '/community/statistics',
  adminAuthMiddleware,
  communityAdminController.getStatistics.bind(communityAdminController)
);

// ====== 数据统计 API ======
// 实时数据概览
adminRouter.get(
  '/statistics/overview',
  adminAuthMiddleware,
  statisticsAdminController.getOverview.bind(statisticsAdminController)
);

// 订单统计
adminRouter.get(
  '/statistics/orders',
  adminAuthMiddleware,
  statisticsAdminController.getOrderStatistics.bind(statisticsAdminController)
);
adminRouter.get(
  '/statistics/orders/trend',
  adminAuthMiddleware,
  statisticsAdminController.getOrderTrend.bind(statisticsAdminController)
);
adminRouter.get(
  '/statistics/orders/by-product',
  adminAuthMiddleware,
  statisticsAdminController.getOrdersByProduct.bind(statisticsAdminController)
);

// 用户统计
adminRouter.get(
  '/statistics/users',
  adminAuthMiddleware,
  statisticsAdminController.getUserStatistics.bind(statisticsAdminController)
);
adminRouter.get(
  '/statistics/users/growth',
  adminAuthMiddleware,
  statisticsAdminController.getUserGrowthTrend.bind(statisticsAdminController)
);
adminRouter.get(
  '/statistics/users/behavior',
  adminAuthMiddleware,
  statisticsAdminController.getUserBehavior.bind(statisticsAdminController)
);

// 收入统计
adminRouter.get(
  '/statistics/revenue',
  adminAuthMiddleware,
  statisticsAdminController.getRevenueStatistics.bind(statisticsAdminController)
);
adminRouter.get(
  '/statistics/revenue/trend',
  adminAuthMiddleware,
  statisticsAdminController.getRevenueTrend.bind(statisticsAdminController)
);

// 车辆统计
adminRouter.get(
  '/statistics/vehicles',
  adminAuthMiddleware,
  statisticsAdminController.getVehicleStatistics.bind(statisticsAdminController)
);
adminRouter.get(
  '/statistics/vehicles/utilization',
  adminAuthMiddleware,
  statisticsAdminController.getVehicleUtilizationTrend.bind(statisticsAdminController)
);
adminRouter.get(
  '/statistics/vehicles/revenue-ranking',
  adminAuthMiddleware,
  statisticsAdminController.getVehicleRevenueRanking.bind(statisticsAdminController)
);

// 财务统计
adminRouter.get(
  '/statistics/finance',
  adminAuthMiddleware,
  statisticsAdminController.getFinanceStatistics.bind(statisticsAdminController)
);
adminRouter.get(
  '/statistics/finance/wallet',
  adminAuthMiddleware,
  statisticsAdminController.getWalletStatistics.bind(statisticsAdminController)
);
adminRouter.get(
  '/statistics/finance/withdrawal',
  adminAuthMiddleware,
  statisticsAdminController.getWithdrawalStatistics.bind(statisticsAdminController)
);

// 注册子路由
apiRouter.use(authRouter.routes());
apiRouter.use(testRouter.routes());
apiRouter.use(orderRouter.routes());
apiRouter.use(walletRouter.routes());
apiRouter.use(paymentRouter.routes());
apiRouter.use(refundRouter.routes());
apiRouter.use(uploadRouter.routes());
apiRouter.use(crowdfundingRouter.routes());
apiRouter.use(campsiteRouter.routes());
apiRouter.use(tourRouter.routes());
apiRouter.use(specialOfferRouter.routes());
apiRouter.use(customerServiceRouter.routes());
apiRouter.use(staffCustomerServiceRouter.routes());
apiRouter.use(couponRouter.routes());
apiRouter.use(favoriteRouter.routes());
apiRouter.use(communityRouter.routes());
apiRouter.use(depositRouter.routes());
apiRouter.use(adminRouter.routes());

// 注册API路由
router.use(apiRouter.routes());

export default router;

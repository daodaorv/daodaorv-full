import { DataSource } from 'typeorm';
import { config } from './index';
import { User } from '../entities/User';
import { Vehicle } from '../entities/Vehicle';
import { UserTag } from '../entities/UserTag';
import { UserAuditLog } from '../entities/UserAuditLog';
import { VehicleModel } from '../entities/VehicleModel';
import { VehicleMaintenanceRecord } from '../entities/VehicleMaintenanceRecord';
import { VehicleTransfer } from '../entities/VehicleTransfer';
import { Order } from '../entities/Order';
import { Wallet } from '../entities/Wallet';
import { WalletTransaction } from '../entities/WalletTransaction';
import { WithdrawalRecord } from '../entities/WithdrawalRecord';
import { PaymentConfig } from '../entities/PaymentConfig';
import { PaymentRecord } from '../entities/PaymentRecord';
import { RefundRecord } from '../entities/RefundRecord';
import { UploadFile } from '../entities/UploadFile';
import { CrowdfundingProject } from '../entities/CrowdfundingProject';
import { CrowdfundingShare } from '../entities/CrowdfundingShare';
import { ProfitSharing } from '../entities/ProfitSharing';
import { OwnerPoints } from '../entities/OwnerPoints';
import { PointsTransaction } from '../entities/PointsTransaction';
import { Campsite } from '../entities/Campsite';
import { CampsiteSpot } from '../entities/CampsiteSpot';
import { CampsiteFacility } from '../entities/CampsiteFacility';
import { CampsiteBooking } from '../entities/CampsiteBooking';
import { CampsiteInquiry } from '../entities/CampsiteInquiry';
import { CampsiteReview } from '../entities/CampsiteReview';
import { TourRoute } from '../entities/TourRoute';
import { TourBatch } from '../entities/TourBatch';
import { TourBooking } from '../entities/TourBooking';
import { SpecialOffer } from '../entities/SpecialOffer';
import { SpecialOfferBooking } from '../entities/SpecialOfferBooking';
import { CommunityTopic } from '../entities/CommunityTopic';
import { CommunityPost } from '../entities/CommunityPost';
import { CommunityComment } from '../entities/CommunityComment';
import { CommunityInteraction } from '../entities/CommunityInteraction';
import { CommunityReport } from '../entities/CommunityReport';
import { CouponTemplate } from '../entities/CouponTemplate';
import { UserCoupon } from '../entities/UserCoupon';
import { CouponDistribution } from '../entities/CouponDistribution';
import { CustomerServiceSession } from '../entities/CustomerServiceSession';
import { CustomerServiceMessage } from '../entities/CustomerServiceMessage';
import { CustomerServiceTicket } from '../entities/CustomerServiceTicket';
import { CustomerServiceConfig } from '../entities/CustomerServiceConfig';
import { QuickReply } from '../entities/QuickReply';
import { UserFavorite } from '../entities/UserFavorite';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  entities: [
    User,
    Vehicle,
    UserTag,
    UserAuditLog,
    VehicleModel,
    VehicleMaintenanceRecord,
    VehicleTransfer,
    Order,
    Wallet,
    WalletTransaction,
    WithdrawalRecord,
    PaymentConfig,
    PaymentRecord,
    RefundRecord,
    UploadFile,
    CrowdfundingProject,
    CrowdfundingShare,
    ProfitSharing,
    OwnerPoints,
    PointsTransaction,
    Campsite,
    CampsiteSpot,
    CampsiteFacility,
    CampsiteBooking,
    CampsiteInquiry,
    CampsiteReview,
    TourRoute,
    TourBatch,
    TourBooking,
    SpecialOffer,
    SpecialOfferBooking,
    CommunityTopic,
    CommunityPost,
    CommunityComment,
    CommunityInteraction,
    CommunityReport,
    CouponTemplate,
    UserCoupon,
    CouponDistribution,
    CustomerServiceSession,
    CustomerServiceMessage,
    CustomerServiceTicket,
    CustomerServiceConfig,
    QuickReply,
    UserFavorite,
  ],
  synchronize: config.database.synchronize,
  logging: config.database.logging,
  charset: 'utf8mb4',
});

export async function initializeDatabase(): Promise<void> {
  try {
    // 避免重复初始化
    if (AppDataSource.isInitialized) {
      console.log('ℹ️  Database already initialized');
      return;
    }

    console.log('🔌 Connecting to database...');
    console.log(`   Host: ${config.database.host}`);
    console.log(`   Port: ${config.database.port}`);
    console.log(`   Database: ${config.database.database}`);

    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

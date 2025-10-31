/**
 * Mock 数据种子脚本
 * 用于前后端联调时创建测试数据
 *
 * 特点:
 * 1. 所有测试数据的标识字段使用 test_ 前缀，便于后期批量清理
 * 2. 数据符合数据字典中的字段定义和枚举值
 * 3. 包含足够的测试数据覆盖各种业务场景
 * 4. 脚本是幂等的（可重复运行，不会产生重复数据）
 */

import { AppDataSource } from '../config/database';
import { User, MemberType, AuthStatus, UserStatus } from '../entities/User';
import { VehicleModel, VehicleCategory } from '../entities/VehicleModel';
import { Vehicle, VehicleStatus, OwnershipType } from '../entities/Vehicle';
import { Order, OrderStatus, PaymentStatus, OrderType } from '../entities/Order';
import { CrowdfundingProject, ProjectStatus } from '../entities/CrowdfundingProject';
import { CrowdfundingShare, ShareStatus } from '../entities/CrowdfundingShare';
import { Wallet } from '../entities/Wallet';
import { OwnerPoints, PointsStatus } from '../entities/OwnerPoints';
import { Campsite, CampsiteStatus, BookingMode } from '../entities/Campsite';
import { CampsiteSpot, SpotType } from '../entities/CampsiteSpot';
import {
  TourRoute,
  TourStatus,
  TourDestination,
  ServiceMode,
  BookingMode as TourBookingMode,
} from '../entities/TourRoute';
import { SpecialOffer, SpecialOfferStatus } from '../entities/SpecialOffer';
import { CommunityTopic } from '../entities/CommunityTopic';
import { CommunityPost, PostStatus } from '../entities/CommunityPost';
import { CouponTemplate, CouponType, CouponScene } from '../entities/CouponTemplate';
import bcrypt from 'bcrypt';
import { Like } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

/**
 * 清理所有测试数据
 */
async function cleanTestData() {
  console.log('🧹 清理旧的测试数据...');

  const userRepo = AppDataSource.getRepository(User);
  const vehicleModelRepo = AppDataSource.getRepository(VehicleModel);
  const vehicleRepo = AppDataSource.getRepository(Vehicle);
  const orderRepo = AppDataSource.getRepository(Order);
  const projectRepo = AppDataSource.getRepository(CrowdfundingProject);
  const shareRepo = AppDataSource.getRepository(CrowdfundingShare);
  const walletRepo = AppDataSource.getRepository(Wallet);
  const pointsRepo = AppDataSource.getRepository(OwnerPoints);
  const campsiteRepo = AppDataSource.getRepository(Campsite);
  const spotRepo = AppDataSource.getRepository(CampsiteSpot);
  const tourRepo = AppDataSource.getRepository(TourRoute);
  const offerRepo = AppDataSource.getRepository(SpecialOffer);
  const topicRepo = AppDataSource.getRepository(CommunityTopic);
  const postRepo = AppDataSource.getRepository(CommunityPost);
  const couponRepo = AppDataSource.getRepository(CouponTemplate);

  // 先获取所有测试用户的 ID
  const testUsers = await userRepo.find({ where: { phone: Like('199%') } as any });
  const testUserIds = testUsers.map(u => u.id);

  // 删除所有 test_ 前缀的数据（按照外键依赖顺序）
  if (testUserIds.length > 0) {
    // 删除用户相关的子表数据
    await orderRepo.delete({ orderNo: Like('test_%') } as any);
    await shareRepo
      .createQueryBuilder()
      .delete()
      .where('userId IN (:...ids)', { ids: testUserIds })
      .execute();
    await postRepo
      .createQueryBuilder()
      .delete()
      .where('userId IN (:...ids)', { ids: testUserIds })
      .execute();
    await pointsRepo
      .createQueryBuilder()
      .delete()
      .where('userId IN (:...ids)', { ids: testUserIds })
      .execute();
    await walletRepo
      .createQueryBuilder()
      .delete()
      .where('userId IN (:...ids)', { ids: testUserIds })
      .execute();
  }

  // 删除其他测试数据
  await projectRepo.delete({ projectNo: Like('test_%') } as any);
  await vehicleRepo.delete({ licensePlate: Like('test_%') } as any);
  await vehicleModelRepo.delete({ brand: Like('test_%') } as any);
  await topicRepo.delete({ name: Like('test_%') } as any);
  await couponRepo.delete({ name: Like('test_%') } as any);
  await offerRepo.delete({ name: Like('test_%') } as any);
  await tourRepo.delete({ name: Like('test_%') } as any);
  await spotRepo.delete({ name: Like('test_%') } as any);
  await campsiteRepo.delete({ name: Like('test_%') } as any);

  // 最后删除用户
  if (testUserIds.length > 0) {
    await userRepo.delete({ phone: Like('199%') } as any);
  }

  console.log('✅ 清理完成');
}

/**
 * 创建测试用户
 */
async function createTestUsers() {
  console.log('👤 创建测试用户...');

  const userRepo = AppDataSource.getRepository(User);
  const walletRepo = AppDataSource.getRepository(Wallet);
  const pointsRepo = AppDataSource.getRepository(OwnerPoints);

  const hashedPassword = await bcrypt.hash('test123456', 10);

  const users = [
    {
      phone: '19900000001',
      password: hashedPassword,
      nickname: 'test_普通用户张三',
      avatar: 'https://picsum.photos/150/150?random=10',
      realName: '张三',
      idCard: '110101199001011234',
      drivingLicense: '110101199001011234',
      memberType: MemberType.NORMAL,
      realNameStatus: AuthStatus.APPROVED,
      drivingLicenseStatus: AuthStatus.APPROVED,
      status: UserStatus.NORMAL,
    },
    {
      phone: '19900000002',
      password: hashedPassword,
      nickname: 'test_PLUS会员李四',
      avatar: 'https://picsum.photos/150/150?random=10',
      realName: '李四',
      idCard: '110101199002021234',
      drivingLicense: '110101199002021234',
      memberType: MemberType.PLUS,
      realNameStatus: AuthStatus.APPROVED,
      drivingLicenseStatus: AuthStatus.APPROVED,
      status: UserStatus.NORMAL,
    },
    {
      phone: '19900000003',
      password: hashedPassword,
      nickname: 'test_众筹车主王五',
      avatar: 'https://picsum.photos/150/150?random=10',
      realName: '王五',
      idCard: '110101199003031234',
      drivingLicense: '110101199003031234',
      memberType: MemberType.CROWDFUNDING,
      realNameStatus: AuthStatus.APPROVED,
      drivingLicenseStatus: AuthStatus.APPROVED,
      status: UserStatus.NORMAL,
    },
    {
      phone: '19900000004',
      password: hashedPassword,
      nickname: 'test_待审核用户赵六',
      avatar: 'https://picsum.photos/150/150?random=10',
      realName: '赵六',
      idCard: '110101199004041234',
      memberType: MemberType.NORMAL,
      realNameStatus: AuthStatus.PENDING,
      drivingLicenseStatus: AuthStatus.PENDING,
      status: UserStatus.NORMAL,
    },
    {
      phone: '19900000005',
      password: hashedPassword,
      nickname: 'test_冻结用户孙七',
      avatar: 'https://picsum.photos/150/150?random=10',
      memberType: MemberType.NORMAL,
      realNameStatus: AuthStatus.NOT_SUBMITTED,
      drivingLicenseStatus: AuthStatus.NOT_SUBMITTED,
      status: UserStatus.FROZEN,
    },
  ];

  const createdUsers = await userRepo.save(users);

  // 为每个用户创建钱包
  for (const user of createdUsers) {
    await walletRepo.save({
      userId: user.id,
      balance: user.memberType === MemberType.PLUS ? 1000 : 0,
      frozenAmount: 0,
    });

    // 为众筹车主创建积分账户
    if (user.memberType === MemberType.CROWDFUNDING) {
      await pointsRepo.save({
        id: user.id,
        userId: user.id,
        balance: 500,
        totalEarned: 1000,
        totalUsed: 500,
        status: PointsStatus.ACTIVE,
      });
    }
  }

  console.log(`✅ 创建了 ${createdUsers.length} 个测试用户`);
  return createdUsers;
}

/**
 * 创建测试车型模板
 */
async function createTestVehicleModels() {
  console.log('🚗 创建测试车型模板...');

  const modelRepo = AppDataSource.getRepository(VehicleModel);

  const models = [
    {
      modelName: 'test_宇通T20豪华房车',
      brand: 'test_宇通',
      model: 'T20',
      category: VehicleCategory.TYPE_B,
      seatCount: 4,
      bedCount: 2,
      length: '5.99',
      width: '2.3',
      height: '3.2',
      weight: '3500',
      facilities: ['WiFi', '空调', '厨房', '卫生间', '冰箱', '电视'],
      images: ['https://picsum.photos/800/600?random=1', 'https://picsum.photos/800/600?random=2'],
      dailyPrice: 599,
      vehicleDeposit: 5000,
      violationDeposit: 2000,
      supportDepositFree: false,
      description: 'test_豪华B型房车，适合家庭出游',
    },
    {
      modelName: 'test_上汽大通RV80',
      brand: 'test_上汽大通',
      model: 'RV80',
      category: VehicleCategory.TYPE_B,
      seatCount: 2,
      bedCount: 2,
      length: '5.4',
      width: '2.0',
      height: '2.8',
      weight: '2800',
      facilities: ['WiFi', '空调', '简易厨房', '卫生间'],
      images: ['https://picsum.photos/800/600?random=3'],
      dailyPrice: 399,
      vehicleDeposit: 3000,
      violationDeposit: 1500,
      supportDepositFree: false,
      description: 'test_紧凑B型房车，适合情侣出行',
    },
    {
      modelName: 'test_福特Transit房车',
      brand: 'test_福特',
      model: 'Transit',
      category: VehicleCategory.TYPE_C,
      seatCount: 6,
      bedCount: 4,
      length: '6.5',
      width: '2.4',
      height: '3.5',
      weight: '4200',
      facilities: ['WiFi', '空调', '厨房', '卫生间', '冰箱', '电视', '微波炉'],
      images: ['https://picsum.photos/800/600?random=1', 'https://picsum.photos/800/600?random=2'],
      dailyPrice: 799,
      vehicleDeposit: 8000,
      violationDeposit: 3000,
      supportDepositFree: false,
      description: 'test_超大C型房车，适合多人团队',
    },
  ];

  const createdModels = await modelRepo.save(models);
  console.log(`✅ 创建了 ${createdModels.length} 个测试车型模板`);
  return createdModels;
}

/**
 * 创建测试车辆
 */
async function createTestVehicles(models: VehicleModel[]) {
  console.log('🚙 创建测试车辆...');

  const vehicleRepo = AppDataSource.getRepository(Vehicle);

  const vehicles = [
    {
      licensePlate: 'test_京A12345',
      vin: 'test_VIN001',
      vehicleModelId: models[0].id,
      ownershipType: OwnershipType.PLATFORM,
      status: VehicleStatus.AVAILABLE,
      actualFacilities: models[0].facilities,
      images: models[0].images,
      year: 2023,
      mileage: 5000,
      remarks: 'test_车况良好',
    },
    {
      licensePlate: 'test_京B23456',
      vin: 'test_VIN002',
      vehicleModelId: models[1].id,
      ownershipType: OwnershipType.PLATFORM,
      status: VehicleStatus.AVAILABLE,
      actualFacilities: models[1].facilities,
      images: models[1].images,
      year: 2024,
      mileage: 1000,
      remarks: 'test_新车',
    },
    {
      licensePlate: 'test_京C34567',
      vin: 'test_VIN003',
      vehicleModelId: models[2].id,
      ownershipType: OwnershipType.CROWDFUNDING,
      status: VehicleStatus.AVAILABLE,
      actualFacilities: models[2].facilities,
      images: models[2].images,
      year: 2023,
      mileage: 8000,
      remarks: 'test_众筹房车',
    },
    {
      licensePlate: 'test_京D45678',
      vin: 'test_VIN004',
      vehicleModelId: models[0].id,
      ownershipType: OwnershipType.PLATFORM,
      status: VehicleStatus.RENTED,
      actualFacilities: models[0].facilities,
      images: models[0].images,
      year: 2022,
      mileage: 15000,
      remarks: 'test_已租赁',
    },
    {
      licensePlate: 'test_京E56789',
      vin: 'test_VIN005',
      vehicleModelId: models[1].id,
      ownershipType: OwnershipType.PLATFORM,
      status: VehicleStatus.MAINTENANCE,
      actualFacilities: models[1].facilities,
      images: models[1].images,
      year: 2021,
      mileage: 25000,
      remarks: 'test_维护中',
    },
  ];

  const createdVehicles = await vehicleRepo.save(vehicles);
  console.log(`✅ 创建了 ${createdVehicles.length} 个测试车辆`);
  return createdVehicles;
}

/**
 * 创建测试订单
 */
async function createTestOrders(users: User[], vehicles: Vehicle[]) {
  console.log('📦 创建测试订单...');

  const orderRepo = AppDataSource.getRepository(Order);

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const orders = [
    {
      orderNo: 'test_ORD20251028001',
      userId: users[0].id,
      vehicleId: vehicles[0].id,
      orderType: OrderType.RV_RENTAL,
      startDate: tomorrow,
      endDate: nextWeek,
      rentalDays: 7,
      rentalPrice: 599 * 7,
      insurancePrice: 100,
      totalPrice: 599 * 7 + 100,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
    },
    {
      orderNo: 'test_ORD20251028002',
      userId: users[1].id,
      vehicleId: vehicles[1].id,
      orderType: OrderType.RV_RENTAL,
      startDate: tomorrow,
      endDate: new Date(tomorrow.getTime() + 3 * 24 * 60 * 60 * 1000),
      rentalDays: 3,
      rentalPrice: 399 * 3,
      insurancePrice: 50,
      totalPrice: 399 * 3 + 50,
      status: OrderStatus.PAID,
      paymentStatus: PaymentStatus.PAID,
      paidAt: now,
    },
    {
      orderNo: 'test_ORD20251028003',
      userId: users[2].id,
      vehicleId: vehicles[3].id,
      orderType: OrderType.RV_RENTAL,
      startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      rentalDays: 7,
      rentalPrice: 599 * 7,
      insurancePrice: 100,
      totalPrice: 599 * 7 + 100,
      status: OrderStatus.USING,
      paymentStatus: PaymentStatus.PAID,
      paidAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      orderNo: 'test_ORD20251028004',
      userId: users[0].id,
      vehicleId: vehicles[2].id,
      orderType: OrderType.SPECIAL_OFFER,
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      rentalDays: 7,
      rentalPrice: 799 * 7 * 0.8,
      insurancePrice: 100,
      totalPrice: 799 * 7 * 0.8 + 100,
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      paidAt: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  ];

  const createdOrders = await orderRepo.save(orders);
  console.log(`✅ 创建了 ${createdOrders.length} 个测试订单`);
  return createdOrders;
}

/**
 * 创建测试众筹项目
 */
async function createTestCrowdfundingProjects(vehicles: Vehicle[]) {
  console.log('💰 创建测试众筹项目...');

  const projectRepo = AppDataSource.getRepository(CrowdfundingProject);

  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const projects = [
    {
      id: uuidv4(),
      projectNo: 'test_CF20251028001',
      projectName: 'test_豪华房车众筹项目001',
      vehicleId: vehicles[2].id,
      totalShares: 100,
      sharePrice: 3000,
      targetAmount: 300000,
      raisedAmount: 150000,
      soldShares: 50,
      annualYield: 15,
      status: ProjectStatus.ACTIVE,
      startDate: now,
      endDate: nextMonth,
      description: 'test_高收益房车众筹项目',
      riskWarning: 'test_投资有风险，请谨慎决策',
    },
    {
      id: uuidv4(),
      projectNo: 'test_CF20251028002',
      projectName: 'test_经济型房车众筹项目002',
      vehicleId: vehicles[1].id,
      totalShares: 50,
      sharePrice: 2000,
      targetAmount: 100000,
      raisedAmount: 100000,
      soldShares: 50,
      annualYield: 12,
      status: ProjectStatus.SUCCESS,
      startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      description: 'test_稳健收益房车众筹项目',
      riskWarning: 'test_投资有风险，请谨慎决策',
    },
  ];

  const createdProjects = await projectRepo.save(projects);
  console.log(`✅ 创建了 ${createdProjects.length} 个测试众筹项目`);
  return createdProjects;
}

/**
 * 创建测试众筹份额
 */
async function createTestCrowdfundingShares(users: User[], projects: CrowdfundingProject[]) {
  console.log('📊 创建测试众筹份额...');

  const shareRepo = AppDataSource.getRepository(CrowdfundingShare);

  const now = new Date();

  const shares = [
    {
      id: uuidv4(),
      shareNo: 'test_SH20251028001',
      projectId: projects[0].id,
      userId: users[2].id,
      shareCount: 30,
      purchasePrice: 90000,
      status: ShareStatus.ACTIVE,
      purchaseDate: now,
    },
    {
      id: uuidv4(),
      shareNo: 'test_SH20251028002',
      projectId: projects[0].id,
      userId: users[1].id,
      shareCount: 20,
      purchasePrice: 60000,
      status: ShareStatus.ACTIVE,
      purchaseDate: now,
    },
    {
      id: uuidv4(),
      shareNo: 'test_SH20251028003',
      projectId: projects[1].id,
      userId: users[2].id,
      shareCount: 50,
      purchasePrice: 100000,
      status: ShareStatus.ACTIVE,
      purchaseDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
    },
  ];

  const createdShares = await shareRepo.save(shares);
  console.log(`✅ 创建了 ${createdShares.length} 个测试众筹份额`);
  return createdShares;
}

/**
 * 创建测试营地
 */
async function createTestCampsites() {
  console.log('🏕️ 创建测试营地...');

  const campsiteRepo = AppDataSource.getRepository(Campsite);
  const spotRepo = AppDataSource.getRepository(CampsiteSpot);

  const campsites = [
    {
      name: 'test_北京密云水库营地',
      city: '北京',
      address: '密云区水库路123号',
      latitude: 40.3769,
      longitude: 116.8419,
      contactPhone: '010-12345678',
      contactPerson: '张经理',
      description: 'test_风景优美的水库营地，设施齐全，环境优美',
      images: ['https://picsum.photos/800/600?random=3'],
      status: CampsiteStatus.ENABLED,
      bookingMode: BookingMode.REALTIME,
    },
    {
      name: 'test_杭州西湖营地',
      city: '杭州',
      address: '西湖区西湖路456号',
      latitude: 30.2489,
      longitude: 120.1363,
      contactPhone: '0571-12345678',
      contactPerson: '李经理',
      description: 'test_西湖边的浪漫营地，风景秀丽',
      images: ['https://picsum.photos/800/600?random=3'],
      status: CampsiteStatus.ENABLED,
      bookingMode: BookingMode.CONSULTATION,
      servicePhone: '0571-88888888',
      serviceWechat: 'test_xihu_camp',
      consultationTip: 'test_请联系客服咨询预订详情',
    },
  ];

  const createdCampsites = await campsiteRepo.save(campsites);

  // 为每个营地创建营位类型
  for (const campsite of createdCampsites) {
    const spots = [
      {
        campsiteId: campsite.id,
        spotType: SpotType.STANDARD,
        name: 'test_标准营位',
        description: 'test_基础设施齐全的标准营位',
        quantity: 12,
        pricePerNight: 200,
        weekendPrice: 240,
        isAvailable: true,
        sortOrder: 1,
      },
      {
        campsiteId: campsite.id,
        spotType: SpotType.WATER_ELECTRIC,
        name: 'test_水电营位',
        description: 'test_配备水电接口的营位',
        quantity: 6,
        pricePerNight: 260,
        weekendPrice: 300,
        isAvailable: true,
        sortOrder: 2,
      },
      {
        campsiteId: campsite.id,
        spotType: SpotType.LUXURY,
        name: 'test_豪华营位',
        description: 'test_设施完善的豪华营位',
        quantity: 2,
        pricePerNight: 360,
        weekendPrice: 400,
        isAvailable: true,
        sortOrder: 3,
      },
    ];
    await spotRepo.save(spots);
  }

  console.log(`✅ 创建了 ${createdCampsites.length} 个测试营地`);
  return createdCampsites;
}

/**
 * 创建测试定制旅游路线
 */
async function createTestTourRoutes() {
  console.log('🗺️ 创建测试定制旅游路线...');

  const tourRepo = AppDataSource.getRepository(TourRoute);

  const routes = [
    {
      name: 'test_川藏线经典7日游',
      summary: 'test_穿越川藏线，体验高原风光',
      destination: TourDestination.SOUTHWEST,
      days: 7,
      nights: 6,
      itinerary: JSON.stringify([
        {
          day: 1,
          title: '成都出发',
          content: 'test_从成都出发前往康定',
          meals: '早餐',
          accommodation: '康定酒店',
        },
        {
          day: 2,
          title: '康定-理塘',
          content: 'test_翻越折多山，抵达理塘',
          meals: '早餐',
          accommodation: '理塘酒店',
        },
        {
          day: 3,
          title: '理塘-稻城',
          content: 'test_前往稻城亚丁',
          meals: '早餐',
          accommodation: '稻城酒店',
        },
      ]),
      included: JSON.stringify(['车辆租赁', '住宿', '早餐', '导游', '保险']),
      excluded: JSON.stringify(['午餐', '晚餐', '个人消费', '门票']),
      adultPrice: 5999,
      childPrice: 3999,
      serviceMode: ServiceMode.SELF_DRIVE,
      minGroupSize: 10,
      maxGroupSize: 20,
      bookingMode: TourBookingMode.INQUIRY,
      status: TourStatus.ENABLED,
      images: JSON.stringify(['https://picsum.photos/800/600?random=4']),
      sortOrder: 100,
    },
    {
      name: 'test_西北大环线8日游',
      summary: 'test_探索西北壮美风光',
      destination: TourDestination.NORTHWEST,
      days: 8,
      nights: 7,
      itinerary: JSON.stringify([
        {
          day: 1,
          title: '西宁出发',
          content: 'test_从西宁出发前往青海湖',
          meals: '早餐',
          accommodation: '青海湖酒店',
        },
        {
          day: 2,
          title: '青海湖-茶卡',
          content: 'test_游览茶卡盐湖',
          meals: '早餐',
          accommodation: '茶卡酒店',
        },
      ]),
      included: JSON.stringify(['车辆租赁', '住宿', '早餐', '导游', '保险', '部分门票']),
      excluded: JSON.stringify(['午餐', '晚餐', '个人消费']),
      adultPrice: 4999,
      childPrice: 2999,
      serviceMode: ServiceMode.SELF_DRIVE,
      minGroupSize: 15,
      maxGroupSize: 30,
      bookingMode: TourBookingMode.INQUIRY,
      status: TourStatus.ENABLED,
      images: JSON.stringify(['https://picsum.photos/800/600?random=4']),
      sortOrder: 90,
    },
  ];

  const createdRoutes = await tourRepo.save(routes);
  console.log(`✅ 创建了 ${createdRoutes.length} 个测试定制旅游路线`);
  return createdRoutes;
}

/**
 * 创建测试特惠活动
 */
async function createTestSpecialOffers(vehicleModels: VehicleModel[]) {
  console.log('🎉 创建测试特惠活动...');

  const offerRepo = AppDataSource.getRepository(SpecialOffer);

  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const offers = [
    {
      name: 'test_双十一特惠租车',
      pickupCity: '北京',
      returnCity: '北京',
      fixedDays: 7,
      originalPrice: 5000,
      offerPrice: 4000,
      vehicleModelIds: [vehicleModels[0].id, vehicleModels[1].id],
      startDate: now,
      endDate: nextMonth,
      totalStock: 100,
      remainingStock: 70,
      description: 'test_全场8折优惠，限时抢购',
      highlights: ['8折优惠', '免费保险', '免费WiFi'],
      includedServices: ['基础保险', 'WiFi', '24小时道路救援'],
      excludedServices: ['油费', '过路费', '停车费'],
      coverImage: 'https://picsum.photos/800/600?random=5',
      images: ['https://picsum.photos/800/600?random=3'],
      status: SpecialOfferStatus.ACTIVE,
    },
    {
      name: 'test_周末特价房车',
      pickupCity: '杭州',
      returnCity: '杭州',
      fixedDays: 3,
      originalPrice: 1500,
      offerPrice: 1000,
      vehicleModelIds: [vehicleModels[2].id],
      startDate: now,
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      totalStock: 50,
      remainingStock: 40,
      description: 'test_周末租车立减500元',
      highlights: ['立减500元', '周末专享', '免费升级'],
      includedServices: ['基础保险', 'WiFi'],
      excludedServices: ['油费', '过路费'],
      coverImage: 'https://picsum.photos/800/600?random=5',
      images: ['https://picsum.photos/800/600?random=3'],
      status: SpecialOfferStatus.ACTIVE,
    },
  ];

  const createdOffers = await offerRepo.save(offers);
  console.log(`✅ 创建了 ${createdOffers.length} 个测试特惠活动`);
  return createdOffers;
}

/**
 * 创建测试社区话题和帖子
 */
async function createTestCommunityContent(users: User[]) {
  console.log('💬 创建测试社区话题和帖子...');

  const topicRepo = AppDataSource.getRepository(CommunityTopic);
  const postRepo = AppDataSource.getRepository(CommunityPost);

  const topics = [
    {
      name: 'test_房车旅行攻略',
      description: 'test_分享你的房车旅行经验',
      coverImage: 'https://picsum.photos/800/600?random=5',
      postCount: 0,
      followCount: 0,
      isHot: true,
      sortOrder: 100,
    },
    {
      name: 'test_营地推荐',
      description: 'test_推荐好的房车营地',
      coverImage: 'https://picsum.photos/800/600?random=5',
      postCount: 0,
      followCount: 0,
      isHot: false,
      sortOrder: 90,
    },
  ];

  const createdTopics = await topicRepo.save(topics);

  const posts = [
    {
      userId: users[0].id,
      topicId: createdTopics[0].id,
      title: 'test_我的川藏线房车之旅',
      content: 'test_分享我的川藏线房车旅行经历，风景太美了！',
      images: ['https://picsum.photos/800/600?random=1', 'https://picsum.photos/800/600?random=2'],
      viewCount: 1000,
      likeCount: 50,
      commentCount: 10,
      status: PostStatus.APPROVED,
      isTop: true,
      isEssence: true,
    },
    {
      userId: users[1].id,
      topicId: createdTopics[1].id,
      title: 'test_推荐一个超棒的营地',
      content: 'test_在密云水库发现了一个很棒的营地，环境优美，设施齐全',
      images: ['https://picsum.photos/800/600?random=3'],
      viewCount: 500,
      likeCount: 20,
      commentCount: 5,
      status: PostStatus.APPROVED,
      isTop: false,
      isEssence: false,
    },
  ];

  const createdPosts = await postRepo.save(posts);
  console.log(`✅ 创建了 ${createdTopics.length} 个测试话题和 ${createdPosts.length} 个测试帖子`);
  return { topics: createdTopics, posts: createdPosts };
}

/**
 * 创建测试优惠券
 */
async function createTestCoupons() {
  console.log('🎫  创建测试优惠券...');

  const couponRepo = AppDataSource.getRepository(CouponTemplate);

  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const coupons = [
    {
      name: 'test_新用户专享券',
      type: CouponType.CASH,
      amount: 100,
      minAmount: 500,
      scene: CouponScene.RENTAL,
      validDays: 30,
      price: 0,
      stock: 1000,
      limitPerUser: 1,
      canStack: false,
      canTransfer: false,
      description: 'test_新用户首单立减100元',
      isActive: true,
      startTime: now,
      endTime: nextMonth,
    },
    {
      name: 'test_PLUS会员专享券',
      type: CouponType.DISCOUNT,
      discountRate: 0.8,
      minAmount: 1000,
      scene: CouponScene.ALL,
      validDays: 30,
      price: 0,
      stock: 500,
      limitPerUser: 2,
      canStack: false,
      canTransfer: true,
      description: 'test_PLUS会员专享8折优惠',
      isActive: true,
      startTime: now,
      endTime: nextMonth,
    },
    {
      name: 'test_满减券',
      type: CouponType.FULL_REDUCTION,
      amount: 200,
      minAmount: 2000,
      scene: CouponScene.RENTAL,
      validDays: 15,
      price: 0,
      stock: 300,
      limitPerUser: 3,
      canStack: true,
      canTransfer: false,
      description: 'test_满2000减200',
      isActive: true,
      startTime: now,
      endTime: nextMonth,
    },
  ];

  const createdCoupons = await couponRepo.save(coupons);
  console.log(`✅ 创建了 ${createdCoupons.length} 个测试优惠券`);
  return createdCoupons;
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🚀 开始创建 Mock 数据...\n');

    // 初始化数据库连接
    await AppDataSource.initialize();
    console.log('✅ 数据库连接成功\n');

    // 清理旧数据
    await cleanTestData();
    console.log('');

    // 创建测试数据
    const users = await createTestUsers();
    console.log('');

    const vehicleModels = await createTestVehicleModels();
    console.log('');

    const vehicles = await createTestVehicles(vehicleModels);
    console.log('');

    const orders = await createTestOrders(users, vehicles);
    console.log('');

    const projects = await createTestCrowdfundingProjects(vehicles);
    console.log('');

    const shares = await createTestCrowdfundingShares(users, projects);
    console.log('');

    const campsites = await createTestCampsites();
    console.log('');

    const tours = await createTestTourRoutes();
    console.log('');

    const offers = await createTestSpecialOffers(vehicleModels);
    console.log('');

    const community = await createTestCommunityContent(users);
    console.log('');

    const coupons = await createTestCoupons();
    console.log('');

    console.log('🎉 Mock 数据创建完成！\n');
    console.log('📊 数据统计:');
    console.log(`  - 用户: ${users.length}`);
    console.log(`  - 车型模板: ${vehicleModels.length}`);
    console.log(`  - 车辆: ${vehicles.length}`);
    console.log(`  - 订单: ${orders.length}`);
    console.log(`  - 众筹项目: ${projects.length}`);
    console.log(`  - 众筹份额: ${shares.length}`);
    console.log(`  - 营地: ${campsites.length}`);
    console.log(`  - 定制旅游路线: ${tours.length}`);
    console.log(`  - 特惠活动: ${offers.length}`);
    console.log(`  - 社区话题: ${community.topics.length}`);
    console.log(`  - 社区帖子: ${community.posts.length}`);
    console.log(`  - 优惠券: ${coupons.length}`);
    console.log('\n✅ 所有测试数据已准备就绪，可以开始前端开发！');
  } catch (error) {
    console.error('❌ 创建 Mock 数据失败:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

// 运行主函数
main().catch(console.error);

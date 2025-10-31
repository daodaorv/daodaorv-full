/**
 * 测试数据工厂
 */

export const testUsers = {
  admin: {
    phone: '13800000000',
    password: 'Admin@123',
    nickname: '测试管理员',
    userType: 'admin',
  },
  normalUser: {
    phone: '13800000001',
    password: 'User@123',
    nickname: '测试普通用户',
    userType: 'normal',
  },
  plusMember: {
    phone: '13800000002',
    password: 'Plus@123',
    nickname: '测试PLUS会员',
    userType: 'normal',
    memberType: 'plus',
  },
};

export const testVehicleModel = {
  modelName: '测试大通RV80',
  brand: '上汽大通',
  model: 'RV80',
  category: 'type_b',
  seatCount: 4,
  bedCount: 2,
  length: '5.99',
  width: '2.03',
  height: '2.78',
  weight: '3500',
  facilities: ['厨房', '卫浴', '空调', '冰箱', '电视'],
  images: ['https://example.com/test-image1.jpg'],
  description: '<p>测试车型描述</p>',
  dailyPrice: 599.0,
  weeklyPrice: 3990.0,
  monthlyPrice: 14990.0,
  deposit: 5000.0,
};

export const testVehicle = {
  licensePlate: '测A12345',
  vin: 'TEST123456789ABCD',
  year: 2024,
  mileage: 0,
  ownershipType: 'platform',
  actualFacilities: ['厨房', '卫浴', '空调', '冰箱'],
  remarks: '测试车辆',
};

export const generateUniquePhone = (): string => {
  const timestamp = Date.now().toString().slice(-8);
  return `138${timestamp}`;
};

export const generateUniqueLicensePlate = (): string => {
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `测${random}`;
};

export const generateUniqueVin = (): string => {
  const random = Math.random().toString(36).substring(2, 17).toUpperCase();
  return `TEST${random}`;
};

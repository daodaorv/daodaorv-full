import { AppDataSource } from '../config/database';
import { Vehicle, VehicleStatus } from '../entities/Vehicle';

export class TestService {
  private vehicleRepository = AppDataSource.getRepository(Vehicle);

  /**
   * 获取车辆列表
   */
  async getVehicles(page = 1, pageSize = 10) {
    // 参数验证
    if (page < 1) page = 1;
    if (pageSize < 1 || pageSize > 100) pageSize = 10;

    const [vehicles, total] = await this.vehicleRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: {
        created_at: 'DESC',
      },
    });

    return {
      list: vehicles,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 创建测试车辆数据
   */
  async createTestVehicles() {
    const testVehicles = [
      {
        license_plate: '京A12345',
        brand: '大通',
        model: 'RV80',
        year: 2023,
        status: VehicleStatus.AVAILABLE,
        daily_price: 800,
        deposit: 5000,
        images: [
          'https://example.com/rv1.jpg',
          'https://example.com/rv2.jpg',
        ],
        features: ['自动挡', '4人座', '独立卫浴', '太阳能板'],
        description: '豪华房车,配备齐全,适合家庭出游',
      },
      {
        license_plate: '沪B67890',
        brand: '依维柯',
        model: 'Daily',
        year: 2022,
        status: VehicleStatus.AVAILABLE,
        daily_price: 600,
        deposit: 4000,
        images: ['https://example.com/rv3.jpg'],
        features: ['手动挡', '2人座', '简易厨房'],
        description: '经济型房车,适合情侣出行',
      },
      {
        license_plate: '粤C11111',
        brand: '福特',
        model: 'Transit',
        year: 2024,
        status: VehicleStatus.AVAILABLE,
        daily_price: 1000,
        deposit: 6000,
        images: ['https://example.com/rv4.jpg'],
        features: ['自动挡', '6人座', '全套家电', '独立卫浴', '太阳能板'],
        description: '顶配房车,豪华舒适,适合多人出游',
      },
    ];

    const vehicles = this.vehicleRepository.create(testVehicles);
    await this.vehicleRepository.save(vehicles);

    return vehicles;
  }
}


import { AppDataSource } from '../config/database';
import { CampsiteInquiry, InquiryStatus } from '../entities/CampsiteInquiry';
import { Campsite } from '../entities/Campsite';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * 咨询DTO接口
 */
export interface CreateInquiryDTO {
  userId: string;
  campsiteId: string;
  contactName: string;
  contactPhone: string;
  plannedCheckInDate?: Date;
  plannedCheckOutDate?: Date;
  spotQuantity: number;
  content: string;
}

export interface UpdateInquiryDTO {
  status?: InquiryStatus;
  processingNote?: string;
  processedBy?: string;
}

export interface InquiryListDTO {
  page?: number;
  pageSize?: number;
  userId?: string;
  campsiteId?: string;
  status?: InquiryStatus;
  keyword?: string;
  sortBy?: 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 营地咨询服务
 */
export class CampsiteInquiryService {
  private inquiryRepository = AppDataSource.getRepository(CampsiteInquiry);
  private campsiteRepository = AppDataSource.getRepository(Campsite);

  /**
   * 创建咨询
   */
  async createInquiry(data: CreateInquiryDTO): Promise<CampsiteInquiry> {
    try {
      // 验证营地
      const campsite = await this.campsiteRepository.findOne({
        where: { id: data.campsiteId },
      });

      if (!campsite) {
        throw new Error('营地不存在');
      }

      // 计算计划入住天数
      let plannedNights: number | undefined;
      if (data.plannedCheckInDate && data.plannedCheckOutDate) {
        const checkIn = new Date(data.plannedCheckInDate);
        const checkOut = new Date(data.plannedCheckOutDate);
        plannedNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      }

      // 生成咨询编号
      const inquiryNo = await this.generateInquiryNo();

      // 创建咨询记录
      const inquiry = this.inquiryRepository.create({
        id: uuidv4(),
        inquiryNo,
        userId: data.userId,
        campsiteId: data.campsiteId,
        status: InquiryStatus.PENDING,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        plannedCheckInDate: data.plannedCheckInDate,
        plannedCheckOutDate: data.plannedCheckOutDate,
        plannedNights,
        spotQuantity: data.spotQuantity,
        content: data.content,
      });

      await this.inquiryRepository.save(inquiry);

      logger.info(`营地咨询创建成功: ${inquiry.id} - ${inquiry.inquiryNo}`);
      return inquiry;
    } catch (error) {
      logger.error('创建营地咨询失败:', error);
      throw error;
    }
  }

  /**
   * 更新咨询状态
   */
  async updateInquiry(id: string, data: UpdateInquiryDTO): Promise<CampsiteInquiry> {
    try {
      const inquiry = await this.inquiryRepository.findOne({ where: { id } });

      if (!inquiry) {
        throw new Error('咨询不存在');
      }

      // 更新字段
      Object.assign(inquiry, data);

      if (data.status === InquiryStatus.PROCESSING || data.status === InquiryStatus.COMPLETED) {
        inquiry.processedAt = new Date();
      }

      await this.inquiryRepository.save(inquiry);

      logger.info(`营地咨询更新成功: ${id}`);
      return inquiry;
    } catch (error) {
      logger.error('更新营地咨询失败:', error);
      throw error;
    }
  }

  /**
   * 获取咨询列表
   */
  async getInquiryList(params: InquiryListDTO): Promise<{
    list: CampsiteInquiry[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const skip = (page - 1) * pageSize;

      const queryBuilder = this.inquiryRepository
        .createQueryBuilder('inquiry')
        .leftJoinAndSelect('inquiry.campsite', 'campsite');

      // 筛选条件
      if (params.userId) {
        queryBuilder.andWhere('inquiry.userId = :userId', { userId: params.userId });
      }

      if (params.campsiteId) {
        queryBuilder.andWhere('inquiry.campsiteId = :campsiteId', {
          campsiteId: params.campsiteId,
        });
      }

      if (params.status) {
        queryBuilder.andWhere('inquiry.status = :status', { status: params.status });
      }

      if (params.keyword) {
        queryBuilder.andWhere('inquiry.inquiryNo LIKE :keyword OR campsite.name LIKE :keyword', {
          keyword: `%${params.keyword}%`,
        });
      }

      // 排序
      const sortBy = params.sortBy || 'createdAt';
      const sortOrder = params.sortOrder || 'DESC';
      queryBuilder.orderBy(`inquiry.${sortBy}`, sortOrder);

      // 分页
      queryBuilder.skip(skip).take(pageSize);

      const [list, total] = await queryBuilder.getManyAndCount();

      return { list, total, page, pageSize };
    } catch (error) {
      logger.error('获取咨询列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取咨询详情
   */
  async getInquiryById(id: string): Promise<CampsiteInquiry> {
    try {
      const inquiry = await this.inquiryRepository.findOne({
        where: { id },
        relations: ['campsite', 'user'],
      });

      if (!inquiry) {
        throw new Error('咨询不存在');
      }

      return inquiry;
    } catch (error) {
      logger.error('获取咨询详情失败:', error);
      throw error;
    }
  }

  /**
   * 生成咨询编号
   */
  private async generateInquiryNo(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');

    return `CI${year}${month}${day}${random}`;
  }
}


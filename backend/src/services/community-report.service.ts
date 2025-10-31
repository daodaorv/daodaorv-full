import { AppDataSource } from '../config/database';
import {
  CommunityReport,
  ReportType,
  ReportStatus,
} from '../entities/CommunityReport';
import { TargetType } from '../entities/CommunityInteraction';
import { logger } from '../utils/logger';
import { Repository } from 'typeorm';

/**
 * 创建举报 DTO
 */
export interface CreateReportDTO {
  reporterId: string;
  targetType: TargetType;
  targetId: string;
  reportType: ReportType;
  reason: string;
}

/**
 * 处理举报 DTO
 */
export interface HandleReportDTO {
  reportId: string;
  status: ReportStatus;
  handleResult: string;
  handlerId: string;
}

/**
 * 举报列表查询 DTO
 */
export interface ReportListDTO {
  targetType?: TargetType;
  reportType?: ReportType;
  status?: ReportStatus;
  page?: number;
  pageSize?: number;
}

/**
 * 社区举报服务
 */
export class CommunityReportService {
  private reportRepository: Repository<CommunityReport>;

  constructor() {
    this.reportRepository = AppDataSource.getRepository(CommunityReport);
  }

  /**
   * 创建举报
   */
  async createReport(data: CreateReportDTO): Promise<CommunityReport> {
    // 验证数据
    if (!data.reason || data.reason.length < 5 || data.reason.length > 500) {
      throw new Error('举报原因长度必须在 5-500 字符之间');
    }

    // 检查是否已举报过
    const existing = await this.reportRepository.findOne({
      where: {
        reporterId: data.reporterId,
        targetType: data.targetType,
        targetId: data.targetId,
        status: ReportStatus.PENDING,
      },
    });

    if (existing) {
      throw new Error('您已举报过该内容，请等待处理');
    }

    const report = this.reportRepository.create({
      ...data,
      status: ReportStatus.PENDING,
    });

    await this.reportRepository.save(report);

    logger.info(`创建举报成功: ${report.id} - ${data.targetType} ${data.targetId}`);
    return report;
  }

  /**
   * 处理举报
   */
  async handleReport(data: HandleReportDTO): Promise<CommunityReport> {
    const report = await this.getReportById(data.reportId);

    if (report.status !== ReportStatus.PENDING && report.status !== ReportStatus.PROCESSING) {
      throw new Error('该举报已处理');
    }

    report.status = data.status;
    report.handleResult = data.handleResult;
    report.handleTime = new Date();
    report.handlerId = data.handlerId;

    await this.reportRepository.save(report);

    logger.info(`处理举报成功: ${data.reportId} - ${data.status}`);
    return report;
  }

  /**
   * 获取举报列表
   */
  async getReportList(query: ReportListDTO) {
    const { targetType, reportType, status, page = 1, pageSize = 20 } = query;

    const queryBuilder = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.handler', 'handler');

    if (targetType) {
      queryBuilder.andWhere('report.targetType = :targetType', { targetType });
    }

    if (reportType) {
      queryBuilder.andWhere('report.reportType = :reportType', { reportType });
    }

    if (status) {
      queryBuilder.andWhere('report.status = :status', { status });
    }

    // 排序：待处理优先，然后按创建时间倒序
    queryBuilder.orderBy('report.status', 'ASC');
    queryBuilder.addOrderBy('report.createdAt', 'DESC');

    const [list, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取举报详情
   */
  async getReportById(reportId: string): Promise<CommunityReport> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
      relations: ['reporter', 'handler'],
    });

    if (!report) {
      throw new Error('举报记录不存在');
    }

    return report;
  }

  /**
   * 获取举报统计
   */
  async getReportStatistics() {
    const total = await this.reportRepository.count();
    const pending = await this.reportRepository.count({
      where: { status: ReportStatus.PENDING },
    });
    const processing = await this.reportRepository.count({
      where: { status: ReportStatus.PROCESSING },
    });
    const resolved = await this.reportRepository.count({
      where: { status: ReportStatus.RESOLVED },
    });
    const rejected = await this.reportRepository.count({
      where: { status: ReportStatus.REJECTED },
    });

    return {
      total,
      pending,
      processing,
      resolved,
      rejected,
    };
  }
}


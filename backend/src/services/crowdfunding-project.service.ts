import { AppDataSource } from '../config/database';
import { CrowdfundingProject, ProjectStatus } from '../entities/CrowdfundingProject';
import { Vehicle } from '../entities/Vehicle';
import { logger } from '../utils/logger';
import { generateNextProjectNo } from '../utils/crowdfunding-number';
import { v4 as uuidv4 } from 'uuid';

/**
 * 众筹项目DTO接口
 */
export interface CreateProjectDTO {
  projectName: string;
  vehicleId: string;
  totalShares?: number; // 默认100
  sharePrice: number;
  minSuccessShares?: number; // 默认80
  annualYield: number;
  monthlyIncome?: number;
  description?: string;
  riskWarning?: string;
}

export interface UpdateProjectDTO {
  projectName?: string;
  sharePrice?: number;
  minSuccessShares?: number;
  annualYield?: number;
  monthlyIncome?: number;
  description?: string;
  riskWarning?: string;
}

export interface PublishProjectDTO {
  startDate: Date;
  endDate: Date;
}

export interface ProjectListDTO {
  page?: number;
  pageSize?: number;
  status?: ProjectStatus;
  vehicleType?: string;
  keyword?: string;
  sortBy?: 'createdAt' | 'progress' | 'startDate';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 众筹项目服务
 */
export class CrowdfundingProjectService {
  private projectRepository = AppDataSource.getRepository(CrowdfundingProject);
  private vehicleRepository = AppDataSource.getRepository(Vehicle);

  /**
   * 创建众筹项目
   */
  async createProject(data: CreateProjectDTO): Promise<CrowdfundingProject> {
    try {
      // 1. 验证车辆是否存在
      const vehicle = await this.vehicleRepository.findOne({
        where: { id: data.vehicleId },
      });

      if (!vehicle) {
        throw new Error('车辆不存在');
      }

      // 2. 验证车辆是否已有众筹项目
      const existingProject = await this.projectRepository.findOne({
        where: { vehicleId: data.vehicleId },
      });

      if (existingProject) {
        throw new Error('该车辆已有众筹项目');
      }

      // 3. 生成项目编号
      const projectNo = await this.generateProjectNo();

      // 4. 计算目标金额
      const totalShares = data.totalShares || 100;
      const targetAmount = data.sharePrice * totalShares;

      // 5. 创建项目记录
      const project = this.projectRepository.create({
        id: uuidv4(),
        projectNo,
        projectName: data.projectName,
        vehicleId: data.vehicleId,
        totalShares,
        sharePrice: data.sharePrice,
        minSuccessShares: data.minSuccessShares || 80,
        soldShares: 0,
        targetAmount,
        raisedAmount: 0,
        annualYield: data.annualYield,
        monthlyIncome: data.monthlyIncome,
        status: ProjectStatus.DRAFT,
        description: data.description,
        riskWarning: data.riskWarning,
      });

      await this.projectRepository.save(project);

      logger.info(`众筹项目创建成功: ${projectNo}`);
      return project;
    } catch (error) {
      logger.error('创建众筹项目失败:', error);
      throw error;
    }
  }

  /**
   * 发布项目
   */
  async publishProject(projectId: string, data: PublishProjectDTO): Promise<CrowdfundingProject> {
    try {
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error('项目不存在');
      }

      if (project.status !== ProjectStatus.DRAFT) {
        throw new Error('只能发布草稿状态的项目');
      }

      // 验证日期
      if (data.startDate >= data.endDate) {
        throw new Error('结束时间必须晚于开始时间');
      }

      // 更新项目状态
      project.status = ProjectStatus.ACTIVE;
      project.startDate = data.startDate;
      project.endDate = data.endDate;

      await this.projectRepository.save(project);

      logger.info(`众筹项目发布成功: ${project.projectNo}`);
      return project;
    } catch (error) {
      logger.error('发布众筹项目失败:', error);
      throw error;
    }
  }

  /**
   * 获取项目详情
   */
  async getProjectById(projectId: string): Promise<CrowdfundingProject | null> {
    try {
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
        relations: ['vehicle', 'vehicle.vehicleModel'],
      });

      return project;
    } catch (error) {
      logger.error('获取项目详情失败:', error);
      throw error;
    }
  }

  /**
   * 获取项目列表
   */
  async getProjectList(params: ProjectListDTO): Promise<{
    projects: CrowdfundingProject[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      const skip = (page - 1) * pageSize;

      const queryBuilder = this.projectRepository
        .createQueryBuilder('project')
        .leftJoinAndSelect('project.vehicle', 'vehicle')
        .leftJoinAndSelect('vehicle.vehicleModel', 'vehicleModel');

      // 筛选条件
      if (params.status) {
        queryBuilder.andWhere('project.status = :status', { status: params.status });
      }

      if (params.vehicleType) {
        queryBuilder.andWhere('vehicleModel.type = :vehicleType', {
          vehicleType: params.vehicleType,
        });
      }

      if (params.keyword) {
        queryBuilder.andWhere(
          '(project.projectName LIKE :keyword OR project.projectNo LIKE :keyword)',
          { keyword: `%${params.keyword}%` }
        );
      }

      // 排序
      const sortBy = params.sortBy || 'createdAt';
      const sortOrder = params.sortOrder || 'DESC';
      queryBuilder.orderBy(`project.${sortBy}`, sortOrder);

      // 分页
      queryBuilder.skip(skip).take(pageSize);

      const [projects, total] = await queryBuilder.getManyAndCount();

      return {
        projects,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error('获取项目列表失败:', error);
      throw error;
    }
  }

  /**
   * 更新项目信息
   */
  async updateProject(projectId: string, data: UpdateProjectDTO): Promise<CrowdfundingProject> {
    try {
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error('项目不存在');
      }

      if (project.status !== ProjectStatus.DRAFT) {
        throw new Error('只能更新草稿状态的项目');
      }

      // 更新字段
      Object.assign(project, data);

      // 如果更新了份额价格，重新计算目标金额
      if (data.sharePrice) {
        project.targetAmount = data.sharePrice * project.totalShares;
      }

      await this.projectRepository.save(project);

      logger.info(`众筹项目更新成功: ${project.projectNo}`);
      return project;
    } catch (error) {
      logger.error('更新众筹项目失败:', error);
      throw error;
    }
  }

  /**
   * 关闭项目
   */
  async closeProject(projectId: string): Promise<CrowdfundingProject> {
    try {
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error('项目不存在');
      }

      if (project.status === ProjectStatus.CLOSED) {
        throw new Error('项目已关闭');
      }

      project.status = ProjectStatus.CLOSED;
      await this.projectRepository.save(project);

      logger.info(`众筹项目关闭成功: ${project.projectNo}`);
      return project;
    } catch (error) {
      logger.error('关闭众筹项目失败:', error);
      throw error;
    }
  }

  /**
   * 检查项目状态（定时任务调用）
   */
  async checkProjectStatus(projectId: string): Promise<void> {
    try {
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
      });

      if (!project || project.status !== ProjectStatus.ACTIVE) {
        return;
      }

      const now = new Date();

      // 检查是否售罄
      if (project.isSoldOut) {
        project.status = ProjectStatus.SUCCESS;
        await this.projectRepository.save(project);
        logger.info(`众筹项目售罄成功: ${project.projectNo}`);
        return;
      }

      // 检查是否到期
      if (project.endDate && now > project.endDate) {
        if (project.isMinSuccessReached) {
          project.status = ProjectStatus.SUCCESS;
          logger.info(`众筹项目到期成功: ${project.projectNo}`);
        } else {
          project.status = ProjectStatus.FAILED;
          logger.info(`众筹项目到期失败: ${project.projectNo}`);
        }
        await this.projectRepository.save(project);
      }
    } catch (error) {
      logger.error('检查项目状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取项目统计
   */
  async getProjectStats(): Promise<{
    totalProjects: number;
    draftProjects: number;
    activeProjects: number;
    successProjects: number;
    failedProjects: number;
    closedProjects: number;
    totalRaisedAmount: number;
  }> {
    try {
      const [
        totalProjects,
        draftProjects,
        activeProjects,
        successProjects,
        failedProjects,
        closedProjects,
      ] = await Promise.all([
        this.projectRepository.count(),
        this.projectRepository.count({ where: { status: ProjectStatus.DRAFT } }),
        this.projectRepository.count({ where: { status: ProjectStatus.ACTIVE } }),
        this.projectRepository.count({ where: { status: ProjectStatus.SUCCESS } }),
        this.projectRepository.count({ where: { status: ProjectStatus.FAILED } }),
        this.projectRepository.count({ where: { status: ProjectStatus.CLOSED } }),
      ]);

      // 计算总筹资金额
      const result = await this.projectRepository
        .createQueryBuilder('project')
        .select('SUM(project.raisedAmount)', 'total')
        .getRawOne();

      const totalRaisedAmount = parseFloat(result?.total || '0');

      return {
        totalProjects,
        draftProjects,
        activeProjects,
        successProjects,
        failedProjects,
        closedProjects,
        totalRaisedAmount,
      };
    } catch (error) {
      logger.error('获取项目统计失败:', error);
      throw error;
    }
  }

  /**
   * 生成项目编号
   */
  private async generateProjectNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const maxProject = await this.projectRepository
      .createQueryBuilder('project')
      .where('project.projectNo LIKE :prefix', { prefix: `CF${dateStr}%` })
      .orderBy('project.projectNo', 'DESC')
      .getOne();

    let sequence = 1;
    if (maxProject) {
      const lastSeq = parseInt(maxProject.projectNo.slice(-4), 10);
      sequence = lastSeq + 1;
    }

    return generateNextProjectNo(async () => sequence - 1);
  }
}

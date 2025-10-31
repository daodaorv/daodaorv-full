import {
  CrowdfundingProjectService,
  CreateProjectDTO,
  UpdateProjectDTO,
  PublishProjectDTO,
  ProjectListDTO,
} from '../services/crowdfunding-project.service';
import { ProjectStatus } from '../entities/CrowdfundingProject';
import { logger } from '../utils/logger';

/**
 * 众筹项目控制器
 */
export class CrowdfundingProjectController {
  private projectService = new CrowdfundingProjectService();

  /**
   * 获取众筹项目列表（用户端）
   */
  getProjects = async (ctx: any) => {
    try {
      const { page, pageSize, status, vehicleType, keyword, sortBy, sortOrder } = ctx.query;

      const params: ProjectListDTO = {
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 10,
        status: status as ProjectStatus,
        vehicleType,
        keyword,
        sortBy: sortBy as 'createdAt' | 'progress' | 'startDate',
        sortOrder: sortOrder as 'ASC' | 'DESC',
      };

      const result = await this.projectService.getProjectList(params);

      ctx.success(result, '获取众筹项目列表成功');
    } catch (error: any) {
      logger.error('Failed to get crowdfunding projects:', error);
      ctx.error(500, error.message || '获取众筹项目列表失败');
    }
  };

  /**
   * 获取项目详情（用户端）
   */
  getProjectById = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      const project = await this.projectService.getProjectById(id);

      if (!project) {
        ctx.error(404, '项目不存在');
        return;
      }

      ctx.success(project, '获取项目详情成功');
    } catch (error: any) {
      logger.error('Failed to get project details:', error);
      ctx.error(500, error.message || '获取项目详情失败');
    }
  };

  /**
   * 获取众筹进度（用户端）
   */
  getProjectProgress = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      const project = await this.projectService.getProjectById(id);

      if (!project) {
        ctx.error(404, '项目不存在');
        return;
      }

      const progress = {
        projectId: project.id,
        projectNo: project.projectNo,
        projectName: project.projectName,
        totalShares: project.totalShares,
        soldShares: project.soldShares,
        remainingShares: project.remainingShares,
        progress: project.progress,
        targetAmount: project.targetAmount,
        raisedAmount: project.raisedAmount,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        remainingDays: project.remainingDays,
        isMinSuccessReached: project.isMinSuccessReached,
        isSoldOut: project.isSoldOut,
      };

      ctx.success(progress, '获取众筹进度成功');
    } catch (error: any) {
      logger.error('Failed to get project progress:', error);
      ctx.error(500, error.message || '获取众筹进度失败');
    }
  };

  /**
   * 创建众筹项目（管理端）
   */
  createProject = async (ctx: any) => {
    try {
      const {
        projectName,
        vehicleId,
        totalShares,
        sharePrice,
        minSuccessShares,
        annualYield,
        monthlyIncome,
        description,
        riskWarning,
      } = ctx.request.body;

      // 参数验证
      if (!projectName || !vehicleId || !sharePrice || !annualYield) {
        ctx.error(400, '项目名称、车辆ID、份额价格、年化收益率为必填项');
        return;
      }

      if (sharePrice <= 0) {
        ctx.error(400, '份额价格必须大于0');
        return;
      }

      if (annualYield < 0 || annualYield > 100) {
        ctx.error(400, '年化收益率必须在0-100之间');
        return;
      }

      const data: CreateProjectDTO = {
        projectName,
        vehicleId,
        totalShares: totalShares ? parseInt(totalShares) : 100,
        sharePrice: parseFloat(sharePrice),
        minSuccessShares: minSuccessShares ? parseInt(minSuccessShares) : 80,
        annualYield: parseFloat(annualYield),
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : undefined,
        description,
        riskWarning,
      };

      const project = await this.projectService.createProject(data);

      ctx.success(project, '众筹项目创建成功');
    } catch (error: any) {
      logger.error('Failed to create crowdfunding project:', error);
      ctx.error(500, error.message || '创建众筹项目失败');
    }
  };

  /**
   * 更新项目信息（管理端）
   */
  updateProject = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const updateData: UpdateProjectDTO = ctx.request.body;

      // 数据类型转换
      if (updateData.sharePrice) {
        updateData.sharePrice = parseFloat(updateData.sharePrice as any);
      }
      if (updateData.minSuccessShares) {
        updateData.minSuccessShares = parseInt(updateData.minSuccessShares as any);
      }
      if (updateData.annualYield) {
        updateData.annualYield = parseFloat(updateData.annualYield as any);
      }
      if (updateData.monthlyIncome) {
        updateData.monthlyIncome = parseFloat(updateData.monthlyIncome as any);
      }

      const project = await this.projectService.updateProject(id, updateData);

      ctx.success(project, '项目信息更新成功');
    } catch (error: any) {
      logger.error('Failed to update project:', error);
      ctx.error(500, error.message || '更新项目信息失败');
    }
  };

  /**
   * 发布项目（管理端）
   */
  publishProject = async (ctx: any) => {
    try {
      const { id } = ctx.params;
      const { startDate, endDate } = ctx.request.body;

      // 参数验证
      if (!startDate || !endDate) {
        ctx.error(400, '开始时间和结束时间为必填项');
        return;
      }

      const data: PublishProjectDTO = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      };

      const project = await this.projectService.publishProject(id, data);

      ctx.success(project, '项目发布成功');
    } catch (error: any) {
      logger.error('Failed to publish project:', error);
      ctx.error(500, error.message || '发布项目失败');
    }
  };

  /**
   * 关闭项目（管理端）
   */
  closeProject = async (ctx: any) => {
    try {
      const { id } = ctx.params;

      const project = await this.projectService.closeProject(id);

      ctx.success(project, '项目关闭成功');
    } catch (error: any) {
      logger.error('Failed to close project:', error);
      ctx.error(500, error.message || '关闭项目失败');
    }
  };

  /**
   * 获取所有项目列表（管理端）
   */
  getAllProjects = async (ctx: any) => {
    try {
      const { page, pageSize, status, vehicleType, keyword, sortBy, sortOrder } = ctx.query;

      const params: ProjectListDTO = {
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 10,
        status: status as ProjectStatus,
        vehicleType,
        keyword,
        sortBy: sortBy as 'createdAt' | 'progress' | 'startDate',
        sortOrder: sortOrder as 'ASC' | 'DESC',
      };

      const result = await this.projectService.getProjectList(params);

      ctx.success(result, '获取所有项目列表成功');
    } catch (error: any) {
      logger.error('Failed to get all projects:', error);
      ctx.error(500, error.message || '获取所有项目列表失败');
    }
  };

  /**
   * 获取项目统计（管理端）
   */
  getProjectStats = async (ctx: any) => {
    try {
      const stats = await this.projectService.getProjectStats();

      ctx.success(stats, '获取项目统计成功');
    } catch (error: any) {
      logger.error('Failed to get project stats:', error);
      ctx.error(500, error.message || '获取项目统计失败');
    }
  };
}


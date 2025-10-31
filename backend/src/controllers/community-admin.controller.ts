import { CommunityPostService } from '../services/community-post.service';
import { CommunityCommentService } from '../services/community-comment.service';
import { CommunityTopicService } from '../services/community-topic.service';
import { CommunityReportService } from '../services/community-report.service';
import { PostType, PostStatus } from '../entities/CommunityPost';
import { CommentStatus } from '../entities/CommunityComment';
import { ReportStatus } from '../entities/CommunityReport';
import { AuditStatus } from '../entities/enums/AuditStatus';

/**
 * 社区管理控制器（管理端）
 */
export class CommunityAdminController {
  private postService: CommunityPostService;
  private commentService: CommunityCommentService;
  private topicService: CommunityTopicService;
  private reportService: CommunityReportService;

  constructor() {
    this.postService = new CommunityPostService();
    this.commentService = new CommunityCommentService();
    this.topicService = new CommunityTopicService();
    this.reportService = new CommunityReportService();
  }

  /**
   * 获取帖子列表（含待审核）
   */
  async getPostList(ctx: any) {
    const { type, status, auditStatus, cityId, topicId, userId, keyword, page, pageSize } =
      ctx.query as {
        type?: PostType;
        status?: PostStatus;
        auditStatus?: AuditStatus;
        cityId?: string;
        topicId?: string;
        userId?: string;
        keyword?: string;
        page?: string;
        pageSize?: string;
      };

    try {
      const result = await this.postService.getPostList({
        type,
        status,
        auditStatus,
        cityId,
        topicId,
        userId,
        keyword,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
      });

      ctx.success(result, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取帖子详情
   */
  async getPostDetail(ctx: any) {
    const { id } = ctx.params;

    try {
      const post = await this.postService.getPostById(id);
      ctx.success(post, '获取成功');
    } catch (error: any) {
      ctx.error(404, error.message);
    }
  }

  /**
   * 审核帖子
   */
  async auditPost(ctx: any) {
    const auditorId = ctx.state.user?.userId;
    const { id } = ctx.params;
    const { auditStatus, auditRemark } = ctx.request.body as {
      auditStatus: AuditStatus;
      auditRemark?: string;
    };

    if (!auditStatus) {
      ctx.error(400, '审核状态不能为空');
      return;
    }

    try {
      const post = await this.postService.auditPost({
        postId: id,
        auditStatus,
        auditRemark,
        auditorId,
      });

      ctx.success(post, '审核成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 删除帖子
   */
  async deletePost(ctx: any) {
    const { id } = ctx.params;

    try {
      const post = await this.postService.getPostById(id);
      post.status = PostStatus.DELETED;
      await this.postService.updatePost(id, post.userId, {});

      ctx.success(null, '删除成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 置顶/取消置顶帖子
   */
  async toggleTopPost(ctx: any) {
    const { id } = ctx.params;

    try {
      const post = await this.postService.toggleTop(id);
      ctx.success(post, post.isTop ? '置顶成功' : '取消置顶成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取评论列表（含待审核）
   */
  async getCommentList(ctx: any) {
    const { postId, userId, status, auditStatus, page, pageSize } = ctx.query as {
      postId?: string;
      userId?: string;
      status?: CommentStatus;
      auditStatus?: AuditStatus;
      page?: string;
      pageSize?: string;
    };

    try {
      const result = await this.commentService.getCommentList({
        postId,
        userId,
        status,
        auditStatus,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
      });

      ctx.success(result, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 审核评论
   */
  async auditComment(ctx: any) {
    const { id } = ctx.params;
    const { auditStatus, auditRemark } = ctx.request.body as {
      auditStatus: AuditStatus;
      auditRemark?: string;
    };

    if (!auditStatus) {
      ctx.error(400, '审核状态不能为空');
      return;
    }

    try {
      const comment = await this.commentService.auditComment({
        commentId: id,
        auditStatus,
        auditRemark,
      });

      ctx.success(comment, '审核成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 删除评论
   */
  async deleteComment(ctx: any) {
    const { id } = ctx.params;

    try {
      const comment = await this.commentService.getCommentById(id);
      await this.commentService.deleteComment(id, comment.userId);

      ctx.success(null, '删除成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 创建话题
   */
  async createTopic(ctx: any) {
    const { name, description, coverImage, sortOrder } = ctx.request.body as {
      name: string;
      description?: string;
      coverImage?: string;
      sortOrder?: number;
    };

    if (!name) {
      ctx.error(400, '话题名称不能为空');
      return;
    }

    try {
      const topic = await this.topicService.createTopic({
        name,
        description,
        coverImage,
        sortOrder,
      });

      ctx.success(topic, '创建成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 更新话题
   */
  async updateTopic(ctx: any) {
    const { id } = ctx.params;
    const { name, description, coverImage, sortOrder, isHot, isActive } = ctx.request.body as {
      name?: string;
      description?: string;
      coverImage?: string;
      sortOrder?: number;
      isHot?: boolean;
      isActive?: boolean;
    };

    try {
      const topic = await this.topicService.updateTopic(id, {
        name,
        description,
        coverImage,
        sortOrder,
        isHot,
        isActive,
      });

      ctx.success(topic, '更新成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 删除话题
   */
  async deleteTopic(ctx: any) {
    const { id } = ctx.params;

    try {
      await this.topicService.deleteTopic(id);
      ctx.success(null, '删除成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取话题列表
   */
  async getTopicList(ctx: any) {
    const { keyword, isHot, isActive, page, pageSize } = ctx.query as {
      keyword?: string;
      isHot?: string;
      isActive?: string;
      page?: string;
      pageSize?: string;
    };

    try {
      const result = await this.topicService.getTopicList({
        keyword,
        isHot: isHot === 'true' ? true : isHot === 'false' ? false : undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
      });

      ctx.success(result, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取举报列表
   */
  async getReportList(ctx: any) {
    const { targetType, reportType, status, page, pageSize } = ctx.query as {
      targetType?: string;
      reportType?: string;
      status?: ReportStatus;
      page?: string;
      pageSize?: string;
    };

    try {
      const result = await this.reportService.getReportList({
        targetType: targetType as any,
        reportType: reportType as any,
        status,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
      });

      ctx.success(result, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 处理举报
   */
  async handleReport(ctx: any) {
    const handlerId = ctx.state.user?.userId;
    const { id } = ctx.params;
    const { status, handleResult } = ctx.request.body as {
      status: ReportStatus;
      handleResult: string;
    };

    if (!status || !handleResult) {
      ctx.error(400, '处理状态和处理结果不能为空');
      return;
    }

    try {
      const report = await this.reportService.handleReport({
        reportId: id,
        status,
        handleResult,
        handlerId,
      });

      ctx.success(report, '处理成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取社区统计数据
   */
  async getStatistics(ctx: any) {
    try {
      // TODO: 实现真实的统计逻辑
      const statistics = {
        totalPosts: 0,
        totalComments: 0,
        totalUsers: 0,
        pendingAuditPosts: 0,
        pendingAuditComments: 0,
        pendingReports: 0,
        todayPosts: 0,
        todayComments: 0,
        todayReports: 0,
      };

      ctx.success(statistics, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }
}

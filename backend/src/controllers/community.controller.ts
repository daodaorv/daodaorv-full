import { CommunityPostService } from '../services/community-post.service';
import { CommunityCommentService } from '../services/community-comment.service';
import { CommunityInteractionService } from '../services/community-interaction.service';
import { CommunityTopicService } from '../services/community-topic.service';
import { CommunityReportService } from '../services/community-report.service';
import { PostType, PostStatus } from '../entities/CommunityPost';
import { CommentStatus } from '../entities/CommunityComment';
import { TargetType, InteractionType } from '../entities/CommunityInteraction';
import { ReportType } from '../entities/CommunityReport';

/**
 * 社区控制器（用户端）
 */
export class CommunityController {
  private postService: CommunityPostService;
  private commentService: CommunityCommentService;
  private interactionService: CommunityInteractionService;
  private topicService: CommunityTopicService;
  private reportService: CommunityReportService;

  constructor() {
    this.postService = new CommunityPostService();
    this.commentService = new CommunityCommentService();
    this.interactionService = new CommunityInteractionService();
    this.topicService = new CommunityTopicService();
    this.reportService = new CommunityReportService();
  }

  /**
   * 发布帖子
   */
  async createPost(ctx: any) {
    const userId = ctx.state.user?.userId;
    const { type, title, content, coverImage, images, videoUrl, cityId, tags, topicId } =
      ctx.request.body as {
        type: PostType;
        title: string;
        content: string;
        coverImage?: string;
        images?: string[];
        videoUrl?: string;
        cityId?: string;
        tags?: string[];
        topicId?: string;
      };

    if (!type || !title || !content) {
      ctx.error(400, '帖子类型、标题和内容不能为空');
      return;
    }

    try {
      const post = await this.postService.createPost({
        userId,
        type,
        title,
        content,
        coverImage,
        images,
        videoUrl,
        cityId,
        tags,
        topicId,
      });

      ctx.success(post, '发布成功，等待审核');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取帖子列表
   */
  async getPostList(ctx: any) {
    const { type, cityId, topicId, keyword, page, pageSize } = ctx.query as {
      type?: PostType;
      cityId?: string;
      topicId?: string;
      keyword?: string;
      page?: string;
      pageSize?: string;
    };

    try {
      const result = await this.postService.getPostList({
        type,
        status: PostStatus.APPROVED, // 只显示已审核通过的帖子
        cityId,
        topicId,
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

      // 增加浏览量
      await this.postService.increaseViewCount(id);

      ctx.success(post, '获取成功');
    } catch (error: any) {
      ctx.error(404, error.message);
    }
  }

  /**
   * 删除帖子
   */
  async deletePost(ctx: any) {
    const userId = ctx.state.user?.userId;
    const { id } = ctx.params;

    try {
      await this.postService.deletePost(id, userId);
      ctx.success(null, '删除成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 发表评论
   */
  async createComment(ctx: any) {
    const userId = ctx.state.user?.userId;
    const { id: postId } = ctx.params;
    const { content, parentId, replyToUserId } = ctx.request.body as {
      content: string;
      parentId?: string;
      replyToUserId?: string;
    };

    if (!content) {
      ctx.error(400, '评论内容不能为空');
      return;
    }

    try {
      const comment = await this.commentService.createComment({
        postId,
        userId,
        content,
        parentId,
        replyToUserId,
      });

      ctx.success(comment, '评论成功，等待审核');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取评论列表
   */
  async getCommentList(ctx: any) {
    const { id: postId } = ctx.params;
    const { page, pageSize } = ctx.query as {
      page?: string;
      pageSize?: string;
    };

    try {
      const result = await this.commentService.getCommentList({
        postId,
        status: CommentStatus.APPROVED, // 只显示已审核通过的评论
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
      });

      ctx.success(result, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 删除评论
   */
  async deleteComment(ctx: any) {
    const userId = ctx.state.user?.userId;
    const { id } = ctx.params;

    try {
      await this.commentService.deleteComment(id, userId);
      ctx.success(null, '删除成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 点赞/取消点赞帖子
   */
  async toggleLikePost(ctx: any) {
    const userId = ctx.state.user?.userId;
    const { id } = ctx.params;

    try {
      const result = await this.interactionService.toggleLike({
        userId,
        targetType: TargetType.POST,
        targetId: id,
        interactionType: InteractionType.LIKE,
      });

      ctx.success(result, result.liked ? '点赞成功' : '取消点赞成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 收藏/取消收藏帖子
   */
  async toggleCollectPost(ctx: any) {
    const userId = ctx.state.user?.userId;
    const { id } = ctx.params;

    try {
      const result = await this.interactionService.toggleCollect({
        userId,
        targetType: TargetType.POST,
        targetId: id,
        interactionType: InteractionType.COLLECT,
      });

      ctx.success(result, result.collected ? '收藏成功' : '取消收藏成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 分享帖子
   */
  async sharePost(ctx: any) {
    const userId = ctx.state.user?.userId;
    const { id } = ctx.params;

    try {
      await this.interactionService.share({
        userId,
        targetType: TargetType.POST,
        targetId: id,
        interactionType: InteractionType.SHARE,
      });

      ctx.success(null, '分享成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取话题列表
   */
  async getTopicList(ctx: any) {
    const { keyword, isHot, page, pageSize } = ctx.query as {
      keyword?: string;
      isHot?: string;
      page?: string;
      pageSize?: string;
    };

    try {
      const result = await this.topicService.getTopicList({
        keyword,
        isHot: isHot === 'true',
        isActive: true, // 只显示启用的话题
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
      });

      ctx.success(result, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 获取话题下的帖子
   */
  async getTopicPosts(ctx: any) {
    const { id: topicId } = ctx.params;
    const { page, pageSize } = ctx.query as {
      page?: string;
      pageSize?: string;
    };

    try {
      const result = await this.postService.getPostList({
        topicId,
        status: PostStatus.APPROVED,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
      });

      ctx.success(result, '获取成功');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }

  /**
   * 提交举报
   */
  async createReport(ctx: any) {
    const reporterId = ctx.state.user?.userId;
    const { targetType, targetId, reportType, reason } = ctx.request.body as {
      targetType: TargetType;
      targetId: string;
      reportType: ReportType;
      reason: string;
    };

    if (!targetType || !targetId || !reportType || !reason) {
      ctx.error(400, '举报信息不完整');
      return;
    }

    try {
      const report = await this.reportService.createReport({
        reporterId,
        targetType,
        targetId,
        reportType,
        reason,
      });

      ctx.success(report, '举报成功，我们会尽快处理');
    } catch (error: any) {
      ctx.error(400, error.message);
    }
  }
}


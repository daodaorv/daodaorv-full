import { AppDataSource } from '../config/database';
import { CommunityComment, CommentStatus } from '../entities/CommunityComment';
import { AuditStatus } from '../entities/enums/AuditStatus';
import { logger } from '../utils/logger';
import { Repository } from 'typeorm';
import { CommunityPostService } from './community-post.service';

/**
 * 创建评论 DTO
 */
export interface CreateCommentDTO {
  postId: string;
  userId: string;
  content: string;
  parentId?: string;
  replyToUserId?: string;
}

/**
 * 评论列表查询 DTO
 */
export interface CommentListDTO {
  postId?: string;
  userId?: string;
  status?: CommentStatus;
  auditStatus?: AuditStatus;
  page?: number;
  pageSize?: number;
}

/**
 * 审核评论 DTO
 */
export interface AuditCommentDTO {
  commentId: string;
  auditStatus: AuditStatus;
  auditRemark?: string;
}

/**
 * 社区评论服务
 */
export class CommunityCommentService {
  private commentRepository: Repository<CommunityComment>;
  private postService: CommunityPostService;

  constructor() {
    this.commentRepository = AppDataSource.getRepository(CommunityComment);
    this.postService = new CommunityPostService();
  }

  /**
   * 创建评论
   */
  async createComment(data: CreateCommentDTO): Promise<CommunityComment> {
    // 验证数据
    this.validateCommentData(data);

    // 验证帖子是否存在
    await this.postService.getPostById(data.postId);

    // 如果是回复评论，验证父评论是否存在
    if (data.parentId) {
      await this.getCommentById(data.parentId);
    }

    const comment = this.commentRepository.create({
      ...data,
      status: CommentStatus.PENDING,
      auditStatus: AuditStatus.PENDING,
      likeCount: 0,
    });

    await this.commentRepository.save(comment);

    // 增加帖子评论数
    await this.postService.increaseCommentCount(data.postId);

    logger.info(`创建评论成功: ${comment.id} - 帖子 ${data.postId}`);
    return comment;
  }

  /**
   * 删除评论
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.getCommentById(commentId);

    // 验证权限
    if (comment.userId !== userId) {
      throw new Error('无权限删除此评论');
    }

    comment.status = CommentStatus.DELETED;
    await this.commentRepository.save(comment);

    // 减少帖子评论数
    await this.postService.decreaseCommentCount(comment.postId);

    logger.info(`删除评论成功: ${commentId}`);
  }

  /**
   * 审核评论
   */
  async auditComment(data: AuditCommentDTO): Promise<CommunityComment> {
    const comment = await this.getCommentById(data.commentId);

    if (comment.auditStatus !== AuditStatus.PENDING) {
      throw new Error('该评论已审核');
    }

    comment.auditStatus = data.auditStatus;
    comment.auditRemark = data.auditRemark;

    if (data.auditStatus === AuditStatus.APPROVED) {
      comment.status = CommentStatus.APPROVED;
    } else if (data.auditStatus === AuditStatus.REJECTED) {
      comment.status = CommentStatus.REJECTED;
      // 减少帖子评论数
      await this.postService.decreaseCommentCount(comment.postId);
    }

    await this.commentRepository.save(comment);

    logger.info(`审核评论成功: ${data.commentId} - ${data.auditStatus}`);
    return comment;
  }

  /**
   * 增加点赞数
   */
  async increaseLikeCount(commentId: string): Promise<void> {
    await this.commentRepository.increment({ id: commentId }, 'likeCount', 1);
  }

  /**
   * 减少点赞数
   */
  async decreaseLikeCount(commentId: string): Promise<void> {
    await this.commentRepository.decrement({ id: commentId }, 'likeCount', 1);
  }

  /**
   * 获取评论列表
   */
  async getCommentList(query: CommentListDTO) {
    const { postId, userId, status, auditStatus, page = 1, pageSize = 20 } = query;

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.replyToUser', 'replyToUser');

    if (postId) {
      queryBuilder.andWhere('comment.postId = :postId', { postId });
    }

    if (userId) {
      queryBuilder.andWhere('comment.userId = :userId', { userId });
    }

    if (status) {
      queryBuilder.andWhere('comment.status = :status', { status });
    }

    if (auditStatus) {
      queryBuilder.andWhere('comment.auditStatus = :auditStatus', { auditStatus });
    }

    // 排序：按创建时间倒序
    queryBuilder.orderBy('comment.createdAt', 'DESC');

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
   * 获取评论详情
   */
  async getCommentById(commentId: string): Promise<CommunityComment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'replyToUser'],
    });

    if (!comment) {
      throw new Error('评论不存在');
    }

    return comment;
  }

  /**
   * 验证评论数据
   */
  private validateCommentData(data: CreateCommentDTO): void {
    if (!data.content || data.content.length < 1 || data.content.length > 500) {
      throw new Error('评论内容长度必须在 1-500 字符之间');
    }
  }
}

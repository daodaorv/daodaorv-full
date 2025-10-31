import { AppDataSource } from '../config/database';
import { CommunityPost, PostType, PostStatus } from '../entities/CommunityPost';
import { AuditStatus } from '../entities/enums/AuditStatus';
import { logger } from '../utils/logger';
import { Repository } from 'typeorm';

/**
 * 创建帖子 DTO
 */
export interface CreatePostDTO {
  userId: string;
  type: PostType;
  title: string;
  content: string;
  coverImage?: string;
  images?: string[];
  videoUrl?: string;
  cityId?: string;
  tags?: string[];
  topicId?: string;
}

/**
 * 更新帖子 DTO
 */
export interface UpdatePostDTO {
  title?: string;
  content?: string;
  coverImage?: string;
  images?: string[];
  videoUrl?: string;
  tags?: string[];
  topicId?: string;
}

/**
 * 帖子列表查询 DTO
 */
export interface PostListDTO {
  type?: PostType;
  status?: PostStatus;
  auditStatus?: AuditStatus;
  cityId?: string;
  topicId?: string;
  userId?: string;
  keyword?: string;
  isTop?: boolean;
  isHot?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * 审核帖子 DTO
 */
export interface AuditPostDTO {
  postId: string;
  auditStatus: AuditStatus;
  auditRemark?: string;
  auditorId: string;
}

/**
 * 社区帖子服务
 */
export class CommunityPostService {
  private postRepository: Repository<CommunityPost>;

  constructor() {
    this.postRepository = AppDataSource.getRepository(CommunityPost);
  }

  /**
   * 创建帖子
   */
  async createPost(data: CreatePostDTO): Promise<CommunityPost> {
    // 验证数据
    this.validatePostData(data);

    const post = this.postRepository.create({
      ...data,
      status: PostStatus.PENDING,
      auditStatus: AuditStatus.PENDING,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      collectCount: 0,
      isTop: false,
      isHot: false,
    });

    await this.postRepository.save(post);

    logger.info(`创建帖子成功: ${post.id} - ${post.title}`);
    return post;
  }

  /**
   * 更新帖子
   */
  async updatePost(postId: string, userId: string, data: UpdatePostDTO): Promise<CommunityPost> {
    const post = await this.getPostById(postId);

    // 验证权限
    if (post.userId !== userId) {
      throw new Error('无权限修改此帖子');
    }

    // 只能修改待审核或已拒绝的帖子
    if (post.status !== PostStatus.PENDING && post.status !== PostStatus.REJECTED) {
      throw new Error('只能修改待审核或已拒绝的帖子');
    }

    Object.assign(post, data);

    // 重新提交审核
    post.status = PostStatus.PENDING;
    post.auditStatus = AuditStatus.PENDING;
    post.auditRemark = undefined;
    post.auditTime = undefined;
    post.auditorId = undefined;

    await this.postRepository.save(post);

    logger.info(`更新帖子成功: ${postId}`);
    return post;
  }

  /**
   * 删除帖子
   */
  async deletePost(postId: string, userId: string): Promise<void> {
    const post = await this.getPostById(postId);

    // 验证权限
    if (post.userId !== userId) {
      throw new Error('无权限删除此帖子');
    }

    post.status = PostStatus.DELETED;
    await this.postRepository.save(post);

    logger.info(`删除帖子成功: ${postId}`);
  }

  /**
   * 审核帖子
   */
  async auditPost(data: AuditPostDTO): Promise<CommunityPost> {
    const post = await this.getPostById(data.postId);

    if (post.auditStatus !== AuditStatus.PENDING) {
      throw new Error('该帖子已审核');
    }

    post.auditStatus = data.auditStatus;
    post.auditRemark = data.auditRemark;
    post.auditTime = new Date();
    post.auditorId = data.auditorId;

    if (data.auditStatus === AuditStatus.APPROVED) {
      post.status = PostStatus.APPROVED;
      post.publishTime = new Date();
    } else if (data.auditStatus === AuditStatus.REJECTED) {
      post.status = PostStatus.REJECTED;
    }

    await this.postRepository.save(post);

    logger.info(`审核帖子成功: ${data.postId} - ${data.auditStatus}`);
    return post;
  }

  /**
   * 置顶/取消置顶帖子
   */
  async toggleTop(postId: string): Promise<CommunityPost> {
    const post = await this.getPostById(postId);

    post.isTop = !post.isTop;
    await this.postRepository.save(post);

    logger.info(`${post.isTop ? '置顶' : '取消置顶'}帖子成功: ${postId}`);
    return post;
  }

  /**
   * 增加浏览量
   */
  async increaseViewCount(postId: string): Promise<void> {
    await this.postRepository.increment({ id: postId }, 'viewCount', 1);
  }

  /**
   * 增加点赞数
   */
  async increaseLikeCount(postId: string): Promise<void> {
    await this.postRepository.increment({ id: postId }, 'likeCount', 1);
  }

  /**
   * 减少点赞数
   */
  async decreaseLikeCount(postId: string): Promise<void> {
    await this.postRepository.decrement({ id: postId }, 'likeCount', 1);
  }

  /**
   * 增加评论数
   */
  async increaseCommentCount(postId: string): Promise<void> {
    await this.postRepository.increment({ id: postId }, 'commentCount', 1);
  }

  /**
   * 减少评论数
   */
  async decreaseCommentCount(postId: string): Promise<void> {
    await this.postRepository.decrement({ id: postId }, 'commentCount', 1);
  }

  /**
   * 增加分享数
   */
  async increaseShareCount(postId: string): Promise<void> {
    await this.postRepository.increment({ id: postId }, 'shareCount', 1);
  }

  /**
   * 增加收藏数
   */
  async increaseCollectCount(postId: string): Promise<void> {
    await this.postRepository.increment({ id: postId }, 'collectCount', 1);
  }

  /**
   * 减少收藏数
   */
  async decreaseCollectCount(postId: string): Promise<void> {
    await this.postRepository.decrement({ id: postId }, 'collectCount', 1);
  }

  /**
   * 获取帖子列表
   */
  async getPostList(query: PostListDTO) {
    const {
      type,
      status,
      auditStatus,
      cityId,
      topicId,
      userId,
      keyword,
      isTop,
      isHot,
      page = 1,
      pageSize = 20,
    } = query;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.topic', 'topic');

    if (type) {
      queryBuilder.andWhere('post.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('post.status = :status', { status });
    }

    if (auditStatus) {
      queryBuilder.andWhere('post.auditStatus = :auditStatus', { auditStatus });
    }

    if (cityId) {
      queryBuilder.andWhere('post.cityId = :cityId', { cityId });
    }

    if (topicId) {
      queryBuilder.andWhere('post.topicId = :topicId', { topicId });
    }

    if (userId) {
      queryBuilder.andWhere('post.userId = :userId', { userId });
    }

    if (keyword) {
      queryBuilder.andWhere('(post.title LIKE :keyword OR post.content LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    if (isTop !== undefined) {
      queryBuilder.andWhere('post.isTop = :isTop', { isTop });
    }

    if (isHot !== undefined) {
      queryBuilder.andWhere('post.isHot = :isHot', { isHot });
    }

    // 排序：置顶优先，然后按发布时间倒序
    queryBuilder.orderBy('post.isTop', 'DESC');
    queryBuilder.addOrderBy('post.publishTime', 'DESC');

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
   * 获取帖子详情
   */
  async getPostById(postId: string): Promise<CommunityPost> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['user', 'topic'],
    });

    if (!post) {
      throw new Error('帖子不存在');
    }

    return post;
  }

  /**
   * 验证帖子数据
   */
  private validatePostData(data: CreatePostDTO): void {
    if (!data.title || data.title.length < 5 || data.title.length > 100) {
      throw new Error('标题长度必须在 5-100 字符之间');
    }

    if (!data.content || data.content.length < 10 || data.content.length > 10000) {
      throw new Error('正文长度必须在 10-10000 字符之间');
    }

    if (data.images && data.images.length > 9) {
      throw new Error('图片数量不能超过 9 张');
    }
  }
}

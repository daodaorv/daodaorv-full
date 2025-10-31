import { AppDataSource } from '../config/database';
import { UploadFile, FileType, BusinessType, UploadStatus } from '../entities/UploadFile';
import { uploadFileToOSS, deleteFileFromOSS, generateOSSPath, extractOSSKey } from '../utils/oss';
import {
  validateImageFile,
  validateDocumentFile,
  getExtensionFromMime,
} from '../utils/file-validator';
import {
  generateFileNameWithExt,
  generateThumbnailFileName,
  generateWebPFileName,
} from '../utils/file-name-generator';
import { generateThumbnail, convertToWebP, cropToSquare } from '../utils/image-processor';
import { config } from '../config';

export class FileUploadService {
  private uploadFileRepository = AppDataSource.getRepository(UploadFile);

  /**
   * 上传图片
   */
  async uploadImage(
    file: any, // Multer.File from @koa/multer
    userId: string,
    businessType: BusinessType,
    options?: {
      generateThumbnails?: boolean;
      convertWebP?: boolean;
      relatedId?: string;
      relatedType?: string;
    }
  ): Promise<UploadFile> {
    // 验证文件
    const validation = validateImageFile(file.mimetype, file.size);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 生成文件名和路径
    const ext = getExtensionFromMime(file.mimetype);
    const fileName = generateFileNameWithExt(ext);
    const ossPath = generateOSSPath(businessType, fileName);

    // 上传原图到 OSS
    const uploadResult = await uploadFileToOSS(ossPath, file.buffer, {
      contentType: file.mimetype,
      public: true,
    });

    // 生成缩略图
    const thumbnails: { size: string; url: string }[] = [];
    if (options?.generateThumbnails) {
      const thumbnailSizes = [200, 400, 800];
      for (const size of thumbnailSizes) {
        const thumbnailBuffer = await generateThumbnail(file.buffer, size, size);
        const thumbnailFileName = generateThumbnailFileName(fileName, `${size}x${size}`);
        const thumbnailPath = generateOSSPath(businessType, thumbnailFileName);
        const thumbnailResult = await uploadFileToOSS(thumbnailPath, thumbnailBuffer, {
          contentType: 'image/jpeg',
          public: true,
        });
        thumbnails.push({
          size: `${size}x${size}`,
          url: thumbnailResult.url,
        });
      }
    }

    // 转换为 WebP
    let webpUrl: string | undefined;
    if (options?.convertWebP && file.mimetype !== 'image/webp') {
      try {
        const webpBuffer = await convertToWebP(file.buffer);
        const webpFileName = generateWebPFileName(fileName);
        const webpPath = generateOSSPath(businessType, webpFileName);
        const webpResult = await uploadFileToOSS(webpPath, webpBuffer, {
          contentType: 'image/webp',
          public: true,
        });
        webpUrl = webpResult.url;
      } catch (error) {
        console.warn('⚠️  WebP 转换失败，跳过:', error);
      }
    }

    // 保存到数据库
    const uploadFile = this.uploadFileRepository.create({
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      ossUrl: uploadResult.url,
      ossKey: uploadResult.key,
      bucketName: config.oss.bucket,
      thumbnails: thumbnails.length > 0 ? thumbnails : undefined,
      webpUrl,
      fileType: FileType.IMAGE,
      businessType,
      userId,
      relatedId: options?.relatedId,
      relatedType: options?.relatedType,
      status: UploadStatus.COMPLETED,
    });

    await this.uploadFileRepository.save(uploadFile);

    return uploadFile;
  }

  /**
   * 上传头像（自动裁剪为正方形）
   */
  async uploadAvatar(file: any, userId: string): Promise<UploadFile> {
    // 验证文件
    const validation = validateImageFile(file.mimetype, file.size);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 裁剪为 200x200 正方形
    const croppedBuffer = await cropToSquare(file.buffer, 200);

    // 创建裁剪后的文件对象
    const croppedFile: any = {
      ...file,
      buffer: croppedBuffer,
      size: croppedBuffer.length,
    };

    // 删除旧头像
    const oldAvatar = await this.uploadFileRepository.findOne({
      where: { userId, businessType: BusinessType.AVATAR },
    });

    if (oldAvatar) {
      await this.deleteFile(oldAvatar.id, userId);
    }

    // 上传新头像
    return this.uploadImage(croppedFile, userId, BusinessType.AVATAR, {
      generateThumbnails: false,
      convertWebP: true,
    });
  }

  /**
   * 上传身份证照片
   */
  async uploadIDCard(
    file: any,
    userId: string,
    side: 'front' | 'back'
  ): Promise<UploadFile> {
    return this.uploadImage(file, userId, BusinessType.IDCARD, {
      generateThumbnails: true,
      convertWebP: true,
      relatedType: 'idcard',
      relatedId: side,
    });
  }

  /**
   * 上传驾驶证照片
   */
  async uploadDrivingLicense(
    file: any,
    userId: string,
    side: 'front' | 'back'
  ): Promise<UploadFile> {
    return this.uploadImage(file, userId, BusinessType.LICENSE, {
      generateThumbnails: true,
      convertWebP: true,
      relatedType: 'license',
      relatedId: side,
    });
  }

  /**
   * 上传文档
   */
  async uploadDocument(
    file: any,
    userId: string,
    options?: {
      relatedId?: string;
      relatedType?: string;
    }
  ): Promise<UploadFile> {
    // 验证文件
    const validation = validateDocumentFile(file.mimetype, file.size);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 生成文件名和路径
    const ext = getExtensionFromMime(file.mimetype);
    const fileName = generateFileNameWithExt(ext);
    const ossPath = generateOSSPath(BusinessType.DOCUMENT, fileName);

    // 上传到 OSS
    const uploadResult = await uploadFileToOSS(ossPath, file.buffer, {
      contentType: file.mimetype,
      public: false, // 文档默认私有
    });

    // 保存到数据库
    const uploadFile = this.uploadFileRepository.create({
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      ossUrl: uploadResult.url,
      ossKey: uploadResult.key,
      bucketName: config.oss.bucket,
      fileType: FileType.DOCUMENT,
      businessType: BusinessType.DOCUMENT,
      userId,
      relatedId: options?.relatedId,
      relatedType: options?.relatedType,
      status: UploadStatus.COMPLETED,
    });

    await this.uploadFileRepository.save(uploadFile);

    return uploadFile;
  }

  /**
   * 批量上传文件
   */
  async batchUpload(
    files: any[],
    userId: string,
    businessType: BusinessType,
    options?: {
      generateThumbnails?: boolean;
      convertWebP?: boolean;
    }
  ): Promise<{
    success: UploadFile[];
    failed: { file: string; error: string }[];
  }> {
    const success: UploadFile[] = [];
    const failed: { file: string; error: string }[] = [];

    for (const file of files) {
      try {
        const uploadFile = await this.uploadImage(file, userId, businessType, options);
        success.push(uploadFile);
      } catch (error: any) {
        failed.push({
          file: file.originalname,
          error: error.message,
        });
      }
    }

    return { success, failed };
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(fileId: string, userId?: string): Promise<UploadFile> {
    const where: any = { id: fileId };
    if (userId) {
      where.userId = userId;
    }

    const file = await this.uploadFileRepository.findOne({ where });

    if (!file) {
      throw new Error('文件不存在');
    }

    return file;
  }

  /**
   * 获取我的文件列表
   */
  async getMyFiles(
    userId: string,
    options: {
      page?: number;
      pageSize?: number;
      businessType?: BusinessType;
      fileType?: FileType;
    } = {}
  ): Promise<{
    files: UploadFile[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;

    const where: any = { userId };
    if (options.businessType) {
      where.businessType = options.businessType;
    }
    if (options.fileType) {
      where.fileType = options.fileType;
    }

    const [files, total] = await this.uploadFileRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      files,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取所有文件列表（管理员）
   */
  async getAllFiles(
    options: {
      page?: number;
      pageSize?: number;
      userId?: string;
      businessType?: BusinessType;
      fileType?: FileType;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{
    files: UploadFile[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;

    const where: any = {};
    if (options.userId) {
      where.userId = options.userId;
    }
    if (options.businessType) {
      where.businessType = options.businessType;
    }
    if (options.fileType) {
      where.fileType = options.fileType;
    }

    const queryBuilder = this.uploadFileRepository.createQueryBuilder('file');

    if (options.userId) {
      queryBuilder.andWhere('file.userId = :userId', { userId: options.userId });
    }
    if (options.businessType) {
      queryBuilder.andWhere('file.businessType = :businessType', {
        businessType: options.businessType,
      });
    }
    if (options.fileType) {
      queryBuilder.andWhere('file.fileType = :fileType', { fileType: options.fileType });
    }
    if (options.startDate) {
      queryBuilder.andWhere('file.createdAt >= :startDate', { startDate: options.startDate });
    }
    if (options.endDate) {
      queryBuilder.andWhere('file.createdAt <= :endDate', { endDate: options.endDate });
    }

    const [files, total] = await queryBuilder
      .orderBy('file.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      files,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId: string, userId?: string): Promise<void> {
    const where: any = { id: fileId };
    if (userId) {
      where.userId = userId;
    }

    const file = await this.uploadFileRepository.findOne({ where });

    if (!file) {
      throw new Error('文件不存在');
    }

    // 从 OSS 删除文件
    await deleteFileFromOSS(file.ossKey);

    // 删除缩略图
    if (file.thumbnails && file.thumbnails.length > 0) {
      for (const thumbnail of file.thumbnails) {
        const thumbnailKey = extractOSSKey(thumbnail.url);
        await deleteFileFromOSS(thumbnailKey);
      }
    }

    // 删除 WebP 版本
    if (file.webpUrl) {
      const webpKey = extractOSSKey(file.webpUrl);
      await deleteFileFromOSS(webpKey);
    }

    // 从数据库删除记录
    await this.uploadFileRepository.remove(file);
  }

  /**
   * 获取上传统计信息（管理员）
   */
  async getUploadStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    byFileType: { type: string; count: number; size: number }[];
    byBusinessType: { type: string; count: number; size: number }[];
  }> {
    const totalFiles = await this.uploadFileRepository.count();

    const totalSizeResult = await this.uploadFileRepository
      .createQueryBuilder('file')
      .select('SUM(file.fileSize)', 'totalSize')
      .getRawOne();

    const totalSize = parseInt(totalSizeResult?.totalSize || '0', 10);

    const byFileType = await this.uploadFileRepository
      .createQueryBuilder('file')
      .select('file.fileType', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(file.fileSize)', 'size')
      .groupBy('file.fileType')
      .getRawMany();

    const byBusinessType = await this.uploadFileRepository
      .createQueryBuilder('file')
      .select('file.businessType', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(file.fileSize)', 'size')
      .groupBy('file.businessType')
      .getRawMany();

    return {
      totalFiles,
      totalSize,
      byFileType: byFileType.map(item => ({
        type: item.type,
        count: parseInt(item.count, 10),
        size: parseInt(item.size || '0', 10),
      })),
      byBusinessType: byBusinessType.map(item => ({
        type: item.type,
        count: parseInt(item.count, 10),
        size: parseInt(item.size || '0', 10),
      })),
    };
  }

  /**
   * 清理未使用的文件（定时任务）
   */
  async cleanUnusedFiles(daysOld: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // 查找未关联的文件
    const unusedFiles = await this.uploadFileRepository
      .createQueryBuilder('file')
      .where('file.relatedId IS NULL')
      .andWhere('file.createdAt < :cutoffDate', { cutoffDate })
      .getMany();

    let deletedCount = 0;

    for (const file of unusedFiles) {
      try {
        await this.deleteFile(file.id);
        deletedCount++;
      } catch (error) {
        console.error(`删除文件失败 ${file.id}:`, error);
      }
    }

    console.log(`✅ 清理了 ${deletedCount} 个未使用的文件`);

    return deletedCount;
  }
}

export const fileUploadService = new FileUploadService();

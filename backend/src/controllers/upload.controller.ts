import { Context } from 'koa';
import { fileUploadService } from '../services/file-upload.service';
import { BusinessType } from '../entities/UploadFile';

export class UploadController {
  /**
   * 上传图片
   */
  async uploadImage(ctx: Context) {
    const file = (ctx.request as any).file;
    const userId = (ctx.state.user as any)?.id;
    const { businessType } = ctx.request.body;

    if (!file) {
      ctx.status = 400;
      ctx.body = {
        code: 40001,
        message: '请选择要上传的文件',
      };
      return;
    }

    if (!businessType || !Object.values(BusinessType).includes(businessType)) {
      ctx.status = 400;
      ctx.body = {
        code: 40001,
        message: '无效的业务类型',
      };
      return;
    }

    try {
      const uploadFile = await fileUploadService.uploadImage(file, userId, businessType, {
        generateThumbnails: true,
        convertWebP: true,
      });

      ctx.body = {
        code: 0,
        message: '上传成功',
        data: {
          id: uploadFile.id,
          url: uploadFile.ossUrl,
          webpUrl: uploadFile.webpUrl,
          thumbnails: uploadFile.thumbnails,
        },
      };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = {
        code: 40003,
        message: error.message || '文件上传失败',
      };
    }
  }

  /**
   * 上传头像
   */
  async uploadAvatar(ctx: Context) {
    const file = (ctx.request as any).file;
    const userId = (ctx.state.user as any)?.id;

    if (!file) {
      ctx.status = 400;
      ctx.body = {
        code: 40001,
        message: '请选择要上传的头像',
      };
      return;
    }

    try {
      const uploadFile = await fileUploadService.uploadAvatar(file, userId);

      ctx.body = {
        code: 0,
        message: '头像上传成功',
        data: {
          id: uploadFile.id,
          url: uploadFile.ossUrl,
          webpUrl: uploadFile.webpUrl,
        },
      };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = {
        code: 40003,
        message: error.message || '头像上传失败',
      };
    }
  }

  /**
   * 上传身份证照片
   */
  async uploadIDCard(ctx: Context) {
    const file = (ctx.request as any).file;
    const userId = (ctx.state.user as any)?.id;
    const { side } = ctx.request.body;

    if (!file) {
      ctx.status = 400;
      ctx.body = {
        code: 40001,
        message: '请选择要上传的身份证照片',
      };
      return;
    }

    if (!side || !['front', 'back'].includes(side)) {
      ctx.status = 400;
      ctx.body = {
        code: 40001,
        message: '请指定身份证正反面（front/back）',
      };
      return;
    }

    try {
      const uploadFile = await fileUploadService.uploadIDCard(file, userId, side);

      ctx.body = {
        code: 0,
        message: '身份证照片上传成功',
        data: {
          id: uploadFile.id,
          url: uploadFile.ossUrl,
          thumbnails: uploadFile.thumbnails,
        },
      };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = {
        code: 40003,
        message: error.message || '身份证照片上传失败',
      };
    }
  }

  /**
   * 上传驾驶证照片
   */
  async uploadDrivingLicense(ctx: Context) {
    const file = (ctx.request as any).file;
    const userId = (ctx.state.user as any)?.id;
    const { side } = ctx.request.body;

    if (!file) {
      ctx.status = 400;
      ctx.body = {
        code: 40001,
        message: '请选择要上传的驾驶证照片',
      };
      return;
    }

    if (!side || !['front', 'back'].includes(side)) {
      ctx.status = 400;
      ctx.body = {
        code: 40001,
        message: '请指定驾驶证正反面（front/back）',
      };
      return;
    }

    try {
      const uploadFile = await fileUploadService.uploadDrivingLicense(file, userId, side);

      ctx.body = {
        code: 0,
        message: '驾驶证照片上传成功',
        data: {
          id: uploadFile.id,
          url: uploadFile.ossUrl,
          thumbnails: uploadFile.thumbnails,
        },
      };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = {
        code: 40003,
        message: error.message || '驾驶证照片上传失败',
      };
    }
  }

  /**
   * 上传文档
   */
  async uploadDocument(ctx: Context) {
    const file = (ctx.request as any).file;
    const userId = (ctx.state.user as any)?.id;

    if (!file) {
      ctx.status = 400;
      ctx.body = {
        code: 40001,
        message: '请选择要上传的文档',
      };
      return;
    }

    try {
      const uploadFile = await fileUploadService.uploadDocument(file, userId);

      ctx.body = {
        code: 0,
        message: '文档上传成功',
        data: {
          id: uploadFile.id,
          url: uploadFile.ossUrl,
        },
      };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = {
        code: 40003,
        message: error.message || '文档上传失败',
      };
    }
  }

  /**
   * 获取我的文件列表
   */
  async getMyFiles(ctx: Context) {
    const userId = (ctx.state.user as any)?.id;
    const { page, pageSize, businessType, fileType } = ctx.query;

    try {
      const result = await fileUploadService.getMyFiles(userId, {
        page: page ? parseInt(page as string, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
        businessType: businessType as BusinessType,
        fileType: fileType as any,
      });

      ctx.body = {
        code: 0,
        message: '获取文件列表成功',
        data: result,
      };
    } catch (error: any) {
      ctx.status = 500;
      ctx.body = {
        code: 50000,
        message: error.message || '获取文件列表失败',
      };
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(ctx: Context) {
    const userId = (ctx.state.user as any)?.id;
    const { fileId } = ctx.params;

    if (!fileId) {
      ctx.status = 400;
      ctx.body = {
        code: 40001,
        message: '文件ID不能为空',
      };
      return;
    }

    try {
      await fileUploadService.deleteFile(fileId, userId);

      ctx.body = {
        code: 0,
        message: '文件删除成功',
      };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = {
        code: 40004,
        message: error.message || '文件删除失败',
      };
    }
  }

  /**
   * 批量上传（管理端）
   */
  async batchUpload(ctx: Context) {
    const files = (ctx.request as any).files as any[];
    const userId = (ctx.state.user as any)?.id;
    const { businessType } = ctx.request.body;

    if (!files || files.length === 0) {
      ctx.status = 400;
      ctx.body = {
        code: 40001,
        message: '请选择要上传的文件',
      };
      return;
    }

    if (!businessType || !Object.values(BusinessType).includes(businessType)) {
      ctx.status = 400;
      ctx.body = {
        code: 40001,
        message: '无效的业务类型',
      };
      return;
    }

    try {
      const result = await fileUploadService.batchUpload(files, userId, businessType, {
        generateThumbnails: true,
        convertWebP: true,
      });

      ctx.body = {
        code: 0,
        message: `批量上传完成，成功 ${result.success.length} 个，失败 ${result.failed.length} 个`,
        data: {
          success: result.success.map(file => ({
            id: file.id,
            url: file.ossUrl,
            originalName: file.originalName,
          })),
          failed: result.failed,
        },
      };
    } catch (error: any) {
      ctx.status = 500;
      ctx.body = {
        code: 40006,
        message: error.message || '批量上传失败',
      };
    }
  }

  /**
   * 获取所有文件列表（管理端）
   */
  async getAllFiles(ctx: Context) {
    const { page, pageSize, userId, businessType, fileType, startDate, endDate } = ctx.query;

    try {
      const result = await fileUploadService.getAllFiles({
        page: page ? parseInt(page as string, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
        userId: userId as string,
        businessType: businessType as BusinessType,
        fileType: fileType as any,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      ctx.body = {
        code: 0,
        message: '获取文件列表成功',
        data: result,
      };
    } catch (error: any) {
      ctx.status = 500;
      ctx.body = {
        code: 50000,
        message: error.message || '获取文件列表失败',
      };
    }
  }

  /**
   * 删除任意文件（管理端）
   */
  async deleteAnyFile(ctx: Context) {
    const { fileId } = ctx.params;

    if (!fileId) {
      ctx.status = 400;
      ctx.body = {
        code: 40001,
        message: '文件ID不能为空',
      };
      return;
    }

    try {
      await fileUploadService.deleteFile(fileId);

      ctx.body = {
        code: 0,
        message: '文件删除成功',
      };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = {
        code: 40004,
        message: error.message || '文件删除失败',
      };
    }
  }

  /**
   * 获取上传统计信息（管理端）
   */
  async getUploadStats(ctx: Context) {
    try {
      const stats = await fileUploadService.getUploadStats();

      ctx.body = {
        code: 0,
        message: '获取统计信息成功',
        data: stats,
      };
    } catch (error: any) {
      ctx.status = 500;
      ctx.body = {
        code: 50000,
        message: error.message || '获取统计信息失败',
      };
    }
  }

  /**
   * 清理未使用的文件（管理端）
   */
  async cleanUnusedFiles(ctx: Context) {
    const { daysOld } = ctx.query;

    try {
      const deletedCount = await fileUploadService.cleanUnusedFiles(
        daysOld ? parseInt(daysOld as string, 10) : 7
      );

      ctx.body = {
        code: 0,
        message: `清理完成，删除了 ${deletedCount} 个未使用的文件`,
        data: { deletedCount },
      };
    } catch (error: any) {
      ctx.status = 500;
      ctx.body = {
        code: 50000,
        message: error.message || '清理文件失败',
      };
    }
  }
}

export const uploadController = new UploadController();

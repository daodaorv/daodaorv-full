import multer from '@koa/multer';
import { config } from '../config';

// 使用内存存储
const storage = multer.memoryStorage();

// 文件过滤器
const fileFilter = (_req: any, file: any, cb: any) => {
  const allowedTypes = [...config.upload.allowedImageTypes, ...config.upload.allowedDocumentTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// 创建 Multer 实例
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxDocumentSize, // 使用最大限制
  },
});

// 单文件上传
export const uploadSingle = (fieldName: string) => uploadMiddleware.single(fieldName);

// 多文件上传
export const uploadMultiple = (fieldName: string, maxCount: number = 10) =>
  uploadMiddleware.array(fieldName, maxCount);

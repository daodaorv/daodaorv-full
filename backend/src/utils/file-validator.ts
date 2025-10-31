import { config } from '../config';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 验证图片文件
 */
export function validateImageFile(mimeType: string, fileSize: number): ValidationResult {
  // 验证 MIME 类型
  if (!config.upload.allowedImageTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `不支持的图片格式，仅支持 ${config.upload.allowedImageTypes.join(', ')}`,
    };
  }

  // 验证文件大小
  if (fileSize > config.upload.maxImageSize) {
    const maxSizeMB = config.upload.maxImageSize / 1024 / 1024;
    return {
      valid: false,
      error: `图片大小超过限制，最大 ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * 验证文档文件
 */
export function validateDocumentFile(mimeType: string, fileSize: number): ValidationResult {
  // 验证 MIME 类型
  if (!config.upload.allowedDocumentTypes.includes(mimeType)) {
    return {
      valid: false,
      error: '不支持的文档格式，仅支持 PDF, Word, Excel',
    };
  }

  // 验证文件大小
  if (fileSize > config.upload.maxDocumentSize) {
    const maxSizeMB = config.upload.maxDocumentSize / 1024 / 1024;
    return {
      valid: false,
      error: `文档大小超过限制，最大 ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * 检查文件类型（基于 MIME 类型）
 */
export function getFileTypeFromMime(mimeType: string): 'image' | 'document' | 'unknown' {
  if (config.upload.allowedImageTypes.includes(mimeType)) {
    return 'image';
  }
  if (config.upload.allowedDocumentTypes.includes(mimeType)) {
    return 'document';
  }
  return 'unknown';
}

/**
 * 获取文件扩展名（从 MIME 类型）
 */
export function getExtensionFromMime(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  };

  return mimeMap[mimeType] || '.bin';
}

/**
 * 验证文件（通用）
 */
export function validateFile(
  mimeType: string,
  fileSize: number,
  fileType: 'image' | 'document'
): ValidationResult {
  if (fileType === 'image') {
    return validateImageFile(mimeType, fileSize);
  } else {
    return validateDocumentFile(mimeType, fileSize);
  }
}







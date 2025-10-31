import { v4 as uuidv4 } from 'uuid';
import path from 'path';

/**
 * 生成唯一文件名
 * 格式：UUID.ext
 */
export function generateFileName(originalName: string): string {
  const ext = path.extname(originalName);
  const uuid = uuidv4();
  return `${uuid}${ext}`;
}

/**
 * 生成唯一文件名（基于 MIME 类型）
 */
export function generateFileNameWithExt(ext: string): string {
  const uuid = uuidv4();
  return `${uuid}${ext}`;
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename);
}

/**
 * 生成缩略图文件名
 * @param originalFileName 原文件名（含扩展名）
 * @param size 尺寸（如 "200x200"）
 */
export function generateThumbnailFileName(originalFileName: string, size: string): string {
  const ext = path.extname(originalFileName);
  const nameWithoutExt = path.basename(originalFileName, ext);
  return `${nameWithoutExt}_${size}${ext}`;
}

/**
 * 生成 WebP 文件名
 */
export function generateWebPFileName(originalFileName: string): string {
  const nameWithoutExt = path.basename(originalFileName, path.extname(originalFileName));
  return `${nameWithoutExt}.webp`;
}







import sharp from 'sharp';

/**
 * 生成缩略图
 * @param buffer 原图 Buffer
 * @param width 宽度
 * @param height 高度
 */
export async function generateThumbnail(
  buffer: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (error) {
    console.error('生成缩略图失败:', error);
    throw new Error('生成缩略图失败');
  }
}

/**
 * 转换为 WebP 格式
 */
export async function convertToWebP(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer).webp({ quality: 80 }).toBuffer();
  } catch (error) {
    console.error('转换 WebP 失败:', error);
    throw new Error('转换 WebP 失败');
  }
}

/**
 * 压缩图片
 */
export async function compressImage(buffer: Buffer, quality: number = 80): Promise<Buffer> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // 根据格式选择压缩方式
    if (metadata.format === 'png') {
      return await image.png({ quality }).toBuffer();
    } else if (metadata.format === 'webp') {
      return await image.webp({ quality }).toBuffer();
    } else {
      // 默认 JPEG
      return await image.jpeg({ quality }).toBuffer();
    }
  } catch (error) {
    console.error('压缩图片失败:', error);
    throw new Error('压缩图片失败');
  }
}

/**
 * 裁剪为正方形（用于头像）
 */
export async function cropToSquare(buffer: Buffer, size: number): Promise<Buffer> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('无法获取图片尺寸');
    }

    // 计算裁剪区域（居中）
    const minDimension = Math.min(metadata.width, metadata.height);
    const left = Math.floor((metadata.width - minDimension) / 2);
    const top = Math.floor((metadata.height - minDimension) / 2);

    return await image
      .extract({
        left,
        top,
        width: minDimension,
        height: minDimension,
      })
      .resize(size, size)
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (error) {
    console.error('裁剪图片失败:', error);
    throw new Error('裁剪图片失败');
  }
}

/**
 * 添加水印（预留）
 */
export async function addWatermark(buffer: Buffer, _watermarkPath: string): Promise<Buffer> {
  try {
    // TODO: 实现水印功能
    return buffer;
  } catch (error) {
    console.error('添加水印失败:', error);
    throw new Error('添加水印失败');
  }
}

/**
 * 批量生成缩略图
 */
export async function generateThumbnails(
  buffer: Buffer,
  sizes: number[]
): Promise<{ size: number; buffer: Buffer }[]> {
  const thumbnails = [];

  for (const size of sizes) {
    const thumbnail = await generateThumbnail(buffer, size, size);
    thumbnails.push({ size, buffer: thumbnail });
  }

  return thumbnails;
}

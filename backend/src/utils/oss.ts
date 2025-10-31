import OSS from 'ali-oss';
import { config } from '../config';
import { BusinessType } from '../entities/UploadFile';
import * as fs from 'fs';
import * as path from 'path';

// 初始化 OSS 客户端
let ossClient: OSS | null = null;
let useLocalStorage = false;

// 本地存储目录
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// 确保本地上传目录存在
function ensureLocalUploadDir() {
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
    console.log(`✅ 创建本地上传目录: ${LOCAL_UPLOAD_DIR}`);
  }
}

export function getOSSClient(): OSS | null {
  // 检查是否配置了 OSS
  if (!config.oss.accessKeyId || !config.oss.accessKeySecret) {
    console.warn('⚠️  OSS 未配置，将使用本地存储模拟');
    useLocalStorage = true;
    ensureLocalUploadDir();
    return null;
  }

  if (!ossClient) {
    ossClient = new OSS({
      region: config.oss.region,
      accessKeyId: config.oss.accessKeyId,
      accessKeySecret: config.oss.accessKeySecret,
      bucket: config.oss.bucket,
    });

    console.log('✅ OSS 客户端初始化成功');
    console.log(`   Region: ${config.oss.region}`);
    console.log(`   Bucket: ${config.oss.bucket}`);
  }

  return ossClient;
}

/**
 * 上传文件到 OSS（或本地存储）
 */
export async function uploadFileToOSS(
  filePath: string,
  buffer: Buffer,
  options?: {
    contentType?: string;
    public?: boolean;
  }
): Promise<{
  url: string;
  key: string;
}> {
  try {
    const client = getOSSClient();

    // 如果使用本地存储
    if (!client || useLocalStorage) {
      ensureLocalUploadDir();
      const localFilePath = path.join(LOCAL_UPLOAD_DIR, filePath);
      const localDir = path.dirname(localFilePath);

      // 确保目录存在
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }

      // 写入文件
      fs.writeFileSync(localFilePath, buffer);

      // 返回本地 URL
      const url = `/uploads/${filePath}`;
      console.log(`✅ 文件已保存到本地: ${localFilePath}`);

      return {
        url,
        key: filePath,
      };
    }

    // 使用 OSS
    const putOptions: any = {};
    if (options?.contentType) {
      putOptions.mime = options.contentType;
    }
    if (options?.public) {
      putOptions.headers = { 'x-oss-object-acl': 'public-read' };
    }

    const result = await client.put(filePath, buffer, putOptions);

    // 返回访问 URL
    const url = config.oss.domain ? `${config.oss.domain}/${filePath}` : result.url;

    return {
      url,
      key: filePath,
    };
  } catch (error) {
    console.error('❌ 文件上传失败:', error);
    throw new Error('文件上传失败');
  }
}

/**
 * 删除 OSS 文件（或本地文件）
 */
export async function deleteFileFromOSS(key: string): Promise<void> {
  try {
    const client = getOSSClient();

    // 如果使用本地存储
    if (!client || useLocalStorage) {
      const localFilePath = path.join(LOCAL_UPLOAD_DIR, key);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
        console.log(`✅ 本地文件已删除: ${localFilePath}`);
      }
      return;
    }

    // 使用 OSS
    await client.delete(key);
    console.log(`✅ 文件已从 OSS 删除: ${key}`);
  } catch (error) {
    console.error('❌ 删除文件失败:', error);
    throw new Error('文件删除失败');
  }
}

/**
 * 批量删除 OSS 文件（或本地文件）
 */
export async function deleteFilesFromOSS(keys: string[]): Promise<void> {
  try {
    const client = getOSSClient();

    // 如果使用本地存储
    if (!client || useLocalStorage) {
      for (const key of keys) {
        const localFilePath = path.join(LOCAL_UPLOAD_DIR, key);
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
      }
      console.log(`✅ 批量删除 ${keys.length} 个本地文件成功`);
      return;
    }

    // 使用 OSS
    await client.deleteMulti(keys);
    console.log(`✅ 批量删除 ${keys.length} 个文件成功`);
  } catch (error) {
    console.error('❌ 批量删除文件失败:', error);
    throw new Error('批量删除文件失败');
  }
}

/**
 * 获取文件签名 URL（用于私有文件访问）
 */
export async function getSignedUrl(
  key: string,
  expiresIn: number = 3600 // 默认 1 小时
): Promise<string> {
  try {
    const client = getOSSClient();

    // 如果使用本地存储，直接返回本地 URL
    if (!client || useLocalStorage) {
      return `/uploads/${key}`;
    }

    // 使用 OSS
    const url = client.signatureUrl(key, {
      expires: expiresIn,
    });
    return url;
  } catch (error) {
    console.error('❌ 生成签名 URL 失败:', error);
    throw new Error('生成签名 URL 失败');
  }
}

/**
 * 获取文件元数据
 */
export async function getFileMeta(key: string): Promise<any> {
  try {
    const client = getOSSClient();

    // 如果使用本地存储
    if (!client || useLocalStorage) {
      const localFilePath = path.join(LOCAL_UPLOAD_DIR, key);
      if (fs.existsSync(localFilePath)) {
        const stats = fs.statSync(localFilePath);
        return {
          size: stats.size,
          lastModified: stats.mtime,
        };
      }
      throw new Error('文件不存在');
    }

    // 使用 OSS
    const result = await client.head(key);
    return result.meta;
  } catch (error) {
    console.error('❌ 获取文件元数据失败:', error);
    throw new Error('获取文件元数据失败');
  }
}

/**
 * 生成文件存储路径
 * 格式：{businessType}/{YYYYMM}/{UUID}.{ext}
 */
export function generateOSSPath(businessType: BusinessType, fileName: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dateFolder = `${year}${month}`;

  return `${businessType}/${dateFolder}/${fileName}`;
}

/**
 * 从 URL 中提取 OSS Key
 */
export function extractOSSKey(url: string): string {
  try {
    const urlObj = new URL(url);
    // 移除开头的斜杠
    return urlObj.pathname.substring(1);
  } catch (error) {
    // 如果不是完整 URL，直接返回
    return url;
  }
}

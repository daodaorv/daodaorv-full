import { describe, it, expect } from '@jest/globals';
import {
  validateImageFile,
  validateDocumentFile,
  getFileTypeFromMime,
  getExtensionFromMime,
} from '../src/utils/file-validator';
import {
  generateFileName,
  generateFileNameWithExt,
  getFileExtension,
  generateThumbnailFileName,
  generateWebPFileName,
} from '../src/utils/file-name-generator';
import { generateOSSPath, extractOSSKey } from '../src/utils/oss';
import { BusinessType } from '../src/entities/UploadFile';

describe('文件验证工具测试', () => {
  describe('validateImageFile', () => {
    it('应该通过有效的图片文件', () => {
      const result = validateImageFile('image/jpeg', 1024 * 1024); // 1MB
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('应该拒绝不支持的格式', () => {
      const result = validateImageFile('image/bmp', 1024 * 1024);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('不支持的图片格式');
    });

    it('应该拒绝超大文件', () => {
      const result = validateImageFile('image/jpeg', 10 * 1024 * 1024); // 10MB
      expect(result.valid).toBe(false);
      expect(result.error).toContain('图片大小超过限制');
    });
  });

  describe('validateDocumentFile', () => {
    it('应该通过有效的文档文件', () => {
      const result = validateDocumentFile('application/pdf', 2 * 1024 * 1024); // 2MB
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('应该拒绝不支持的格式', () => {
      const result = validateDocumentFile('application/zip', 1024 * 1024);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('不支持的文档格式');
    });

    it('应该拒绝超大文件', () => {
      const result = validateDocumentFile('application/pdf', 15 * 1024 * 1024); // 15MB
      expect(result.valid).toBe(false);
      expect(result.error).toContain('文档大小超过限制');
    });
  });

  describe('getFileTypeFromMime', () => {
    it('应该识别图片类型', () => {
      expect(getFileTypeFromMime('image/jpeg')).toBe('image');
      expect(getFileTypeFromMime('image/png')).toBe('image');
    });

    it('应该识别文档类型', () => {
      expect(getFileTypeFromMime('application/pdf')).toBe('document');
    });

    it('应该返回unknown对于未知类型', () => {
      expect(getFileTypeFromMime('application/zip')).toBe('unknown');
    });
  });

  describe('getExtensionFromMime', () => {
    it('应该返回正确的扩展名', () => {
      expect(getExtensionFromMime('image/jpeg')).toBe('.jpg');
      expect(getExtensionFromMime('image/png')).toBe('.png');
      expect(getExtensionFromMime('application/pdf')).toBe('.pdf');
    });

    it('应该返回默认扩展名对于未知类型', () => {
      expect(getExtensionFromMime('application/unknown')).toBe('.bin');
    });
  });
});

describe('文件名生成工具测试', () => {
  describe('generateFileName', () => {
    it('应该生成UUID文件名并保留扩展名', () => {
      const filename = generateFileName('test.jpg');
      expect(filename).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/i
      );
    });
  });

  describe('generateFileNameWithExt', () => {
    it('应该生成带指定扩展名的UUID文件名', () => {
      const filename = generateFileNameWithExt('.png');
      expect(filename).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/i
      );
    });
  });

  describe('getFileExtension', () => {
    it('应该提取文件扩展名', () => {
      expect(getFileExtension('test.jpg')).toBe('.jpg');
      expect(getFileExtension('document.pdf')).toBe('.pdf');
    });
  });

  describe('generateThumbnailFileName', () => {
    it('应该生成缩略图文件名', () => {
      const filename = generateThumbnailFileName(
        '550e8400-e29b-41d4-a716-446655440000.jpg',
        '200x200'
      );
      expect(filename).toBe('550e8400-e29b-41d4-a716-446655440000_200x200.jpg');
    });
  });

  describe('generateWebPFileName', () => {
    it('应该生成WebP文件名', () => {
      const filename = generateWebPFileName('550e8400-e29b-41d4-a716-446655440000.jpg');
      expect(filename).toBe('550e8400-e29b-41d4-a716-446655440000.webp');
    });
  });
});

describe('OSS 路径工具测试', () => {
  describe('generateOSSPath', () => {
    it('应该生成正确的OSS路径', () => {
      const path = generateOSSPath(BusinessType.AVATAR, 'test.jpg');
      expect(path).toMatch(/^avatar\/\d{6}\/test\.jpg$/);
    });

    it('应该根据不同业务类型生成不同路径', () => {
      const avatarPath = generateOSSPath(BusinessType.AVATAR, 'test.jpg');
      const vehiclePath = generateOSSPath(BusinessType.VEHICLE, 'test.jpg');

      expect(avatarPath).toContain('avatar/');
      expect(vehiclePath).toContain('vehicle/');
    });
  });

  describe('extractOSSKey', () => {
    it('应该从完整URL提取OSS Key', () => {
      const url = 'https://bucket.oss-cn-beijing.aliyuncs.com/avatar/202510/test.jpg';
      const key = extractOSSKey(url);
      expect(key).toBe('avatar/202510/test.jpg');
    });

    it('应该直接返回非URL字符串', () => {
      const key = 'avatar/202510/test.jpg';
      const result = extractOSSKey(key);
      expect(result).toBe(key);
    });
  });
});







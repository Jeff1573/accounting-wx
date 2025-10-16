/**
 * 上传控制器
 * 
 * 处理文件上传相关的业务逻辑
 */

import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { toFullUrl } from '../utils/url';

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置文件存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳_随机数.扩展名
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}${ext}`;
    cb(null, filename);
  }
});

// 配置文件过滤
const upload = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024  // 限制 5MB
  },
  fileFilter: (req, file, cb) => {
    // 支持所有常见图片格式
    const allowedTypes = [
      'image/jpeg',     // JPEG/JPG
      'image/png',      // PNG
      'image/jpg',      // JPG
      'image/webp',     // WEBP
      'image/gif',      // GIF（动图）
      'image/bmp',      // BMP
      'image/svg+xml',  // SVG（矢量图）
      'image/tiff',     // TIFF
      'image/avif',     // AVIF（现代格式）
      'image/heic',     // HEIC（iOS 照片）
      'image/heif'      // HEIF
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持该图片格式，请上传 JPG、PNG、WEBP、GIF、BMP、SVG、TIFF、AVIF、HEIC 等常见图片格式'));
    }
  }
});

/**
 * 上传头像
 * 
 * @param req - Express 请求对象（包含上传的文件）
 * @param res - Express 响应对象
 */
export const uploadAvatar = [
  upload.single('avatar'),
  (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({
          code: 400,
          message: '未上传文件'
        });
        return;
      }

      // 生成相对路径
      const relativePath = `/api/uploads/avatars/${req.file.filename}`;
      // 转换为完整 URL（传递 req 对象以自动获取当前访问域名）
      const fullUrl = toFullUrl(relativePath, req);
      
      console.log('头像上传成功:', fullUrl);
      
      res.json({
        code: 200,
        message: '上传成功',
        data: {
          url: fullUrl
        }
      });
    } catch (error) {
      console.error('上传头像失败:', error);
      res.status(500).json({
        code: 500,
        message: '上传失败'
      });
    }
  }
];


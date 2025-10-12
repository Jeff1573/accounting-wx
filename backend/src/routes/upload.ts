/**
 * 上传路由
 * 
 * 处理文件上传相关的路由
 */

import { Router } from 'express';
import { uploadAvatar } from '../controllers/uploadController';

const router = Router();

/**
 * POST /api/upload/avatar
 * 上传头像
 */
router.post('/avatar', uploadAvatar);

export default router;


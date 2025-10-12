/**
 * 认证路由模块
 * 
 * 定义用户认证相关的路由
 */

import { Router } from 'express';
import { wxLogin, getCurrentUser } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/wx-login
 * 微信登录
 */
router.post('/wx-login', wxLogin);

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', authMiddleware, getCurrentUser);

export default router;


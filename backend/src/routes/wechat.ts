import { Router } from 'express';
import { getRoomWxaCode } from '../controllers/wechatController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 生成房间小程序码（需登录）
router.get('/wxacode', authMiddleware, getRoomWxaCode);

export default router;



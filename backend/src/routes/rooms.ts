/**
 * 房间路由模块
 * 
 * 定义房间管理相关的路由
 */

import { Router } from 'express';
import {
  createRoom,
  joinRoom,
  getRooms,
  getRoomDetail,
  updateMemberNickname
} from '../controllers/roomController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 所有房间路由都需要认证
router.use(authMiddleware);

/**
 * POST /api/rooms
 * 创建房间
 */
router.post('/', createRoom);

/**
 * POST /api/rooms/join
 * 加入房间
 */
router.post('/join', joinRoom);

/**
 * GET /api/rooms
 * 获取用户的房间列表
 */
router.get('/', getRooms);

/**
 * GET /api/rooms/:roomId
 * 获取房间详情
 */
router.get('/:roomId', getRoomDetail);

/**
 * PUT /api/rooms/:roomId/members/:memberId
 * 更新成员昵称
 */
router.put('/:roomId/members/:memberId', updateMemberNickname);

export default router;


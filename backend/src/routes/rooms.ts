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
  checkMembership,
  updateMemberNickname,
  leaveRoom,
  createSettlement,
  closeRoom
} from '../controllers/roomController';
import { authMiddleware } from '../middleware/auth';
import { ensureActiveUser } from '../middleware/activeUser';

const router = Router();

// 所有房间路由都需要认证且需为活跃用户
router.use(authMiddleware);
router.use(ensureActiveUser);

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
 * GET /api/rooms/membership
 * 查询是否为房间成员（invite_code 或 room_id 其一）
 */
router.get('/membership', checkMembership);

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

/**
 * DELETE /api/rooms/:roomId/members/me
 * 退出房间（房主则解散）
 */
router.delete('/:roomId/members/me', leaveRoom);

/**
 * POST /api/rooms/:roomId/settlements
 * 创建结算（房主）
 */
router.post('/:roomId/settlements', createSettlement);

/**
 * POST /api/rooms/:roomId/close
 * 关闭房间（房主）
 */
router.post('/:roomId/close', closeRoom);

export default router;


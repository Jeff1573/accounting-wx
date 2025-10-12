/**
 * 交易记录路由模块
 * 
 * 定义交易记录相关的路由
 */

import { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  getBalances
} from '../controllers/transactionController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 所有交易路由都需要认证
router.use(authMiddleware);

/**
 * POST /api/rooms/:roomId/transactions
 * 创建交易记录
 */
router.post('/:roomId/transactions', createTransaction);

/**
 * GET /api/rooms/:roomId/transactions
 * 获取房间交易记录
 */
router.get('/:roomId/transactions', getTransactions);

/**
 * GET /api/rooms/:roomId/balances
 * 获取房间成员余额统计
 */
router.get('/:roomId/balances', getBalances);

export default router;


/**
 * 活跃用户校验中间件
 * 
 * 在已通过 JWT 认证后，校验当前用户是否存在且处于 active 状态
 */

import { Request, Response, NextFunction } from 'express';
import { User } from '../models';

/**
 * 确保当前用户为活跃状态
 *
 * - 用户不存在：404
 * - 用户状态非 active（deleted/banned）：403
 */
export async function ensureActiveUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        code: 401,
        message: '未认证'
      });
      return;
    }

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({
        code: 403,
        message: '账号不可用'
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
}



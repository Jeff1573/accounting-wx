/**
 * 认证中间件
 * 
 * 验证 JWT token 并将用户信息附加到请求对象
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

/**
 * 扩展 Express Request 接口，添加用户信息
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * 认证中间件
 * 
 * 从请求头中提取 token 并验证，验证成功将用户信息存入 req.user
 * 
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 * @param next - Express next 函数
 * 
 * @example
 * router.get('/protected', authMiddleware, (req, res) => {
 *   res.json({ userId: req.user.userId });
 * });
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // 从 Authorization header 获取 token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: '未提供认证token' });
      return;
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀
    const payload = verifyToken(token);

    if (!payload) {
      res.status(401).json({ error: 'token无效或已过期' });
      return;
    }

    // 将用户信息附加到请求对象
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: '认证失败' });
  }
}


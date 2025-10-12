/**
 * JWT 工具模块
 * 
 * 提供 JWT token 的生成和验证功能
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

/**
 * JWT 载荷接口
 */
export interface JwtPayload {
  userId: number;
  openid: string;
}

/**
 * 生成 JWT token
 * 
 * @param payload - JWT 载荷数据
 * @param expiresIn - 过期时间（默认 7 天）
 * @returns JWT token 字符串
 * 
 * @example
 * const token = generateToken({ userId: 1, openid: 'xxx' });
 */
export function generateToken(payload: JwtPayload, expiresIn: string | number = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

/**
 * 验证 JWT token
 * 
 * @param token - JWT token 字符串
 * @returns JWT 载荷数据，验证失败返回 null
 * 
 * @example
 * const payload = verifyToken(token);
 * if (payload) {
 *   console.log(payload.userId);
 * }
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}


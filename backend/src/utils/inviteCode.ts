/**
 * 邀请码生成工具模块
 * 
 * 提供生成唯一邀请码的功能
 */

import { customAlphabet } from 'nanoid';

/**
 * 邀请码字符集（数字 + 大写字母，排除易混淆字符）
 */
const ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * 生成邀请码的函数
 */
const generateNanoId = customAlphabet(ALPHABET, 6);

/**
 * 生成 6 位邀请码
 * 
 * @returns 6位随机邀请码
 * 
 * @example
 * const code = generateInviteCode(); // 'A3K9M2'
 */
export function generateInviteCode(): string {
  return generateNanoId();
}


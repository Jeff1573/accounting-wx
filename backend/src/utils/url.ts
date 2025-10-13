/**
 * URL 工具函数
 * 
 * 处理 URL 相关的转换
 */

import { Request } from 'express';

/**
 * 将相对路径转换为完整的 URL
 * 
 * @param path - 相对路径（如 /api/uploads/avatars/xxx.jpg）
 * @param req - Express 请求对象（可选，用于自动获取当前请求的域名）
 * @returns 完整的 URL
 * 
 * @example
 * // 使用环境变量
 * toFullUrl('/api/uploads/avatars/xxx.jpg')
 * // => 'http://example.com:3000/api/uploads/avatars/xxx.jpg'
 * 
 * // 使用请求对象自动获取域名（推荐）
 * toFullUrl('/api/uploads/avatars/xxx.jpg', req)
 * // => 'http://192.168.31.197:3000/api/uploads/avatars/xxx.jpg'
 */
export function toFullUrl(path: string | null | undefined, req?: Request): string {
  if (!path) {
    return '';
  }
  
  // 已经是完整 URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 优先使用环境变量配置的公网域名
  const apiBaseUrl = process.env.API_BASE_URL;
  if (apiBaseUrl) {
    // 去掉末尾的斜杠
    const baseUrl = apiBaseUrl.replace(/\/$/, '');
    return `${baseUrl}${path}`;
  }
  
  // 其次使用请求对象自动获取当前访问的域名（适用于开发环境）
  if (req) {
    const protocol = req.protocol || 'http';
    const host = req.get('host'); // 包含域名和端口，如 192.168.31.197:3000
    return `${protocol}://${host}${path}`;
  }
  
  // 最后使用默认值（不推荐，仅作为后备方案）
  console.warn('⚠️  未配置 API_BASE_URL 环境变量，使用默认域名，可能导致跨网络访问问题');
  const protocol = process.env.API_PROTOCOL || 'http';
  const defaultHost = process.env.API_HOST || 'localhost';
  const port = process.env.PORT || '3000';
  
  // 拼接完整 URL
  return `${protocol}://${defaultHost}:${port}${path}`;
}


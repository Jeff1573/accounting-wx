/**
 * URL 工具函数
 * 
 * 处理 URL 相关的转换
 */

/**
 * 将相对路径转换为完整的 URL
 * 
 * @param path - 相对路径（如 /api/uploads/avatars/xxx.jpg）
 * @returns 完整的 URL
 * 
 * @example
 * toFullUrl('/api/uploads/avatars/xxx.jpg')
 * // => 'http://192.168.31.197:3000/api/uploads/avatars/xxx.jpg'
 */
export function toFullUrl(path: string | null | undefined): string {
  if (!path) {
    return '';
  }
  
  // 已经是完整 URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 构建基础 URL
  const protocol = process.env.API_PROTOCOL || 'http';
  const host = process.env.API_HOST || '192.168.31.197';
  const port = process.env.PORT || '3000';
  
  // 拼接完整 URL
  return `${protocol}://${host}:${port}${path}`;
}


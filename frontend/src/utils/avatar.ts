/**
 * 头像 URL 处理工具
 * 
 * 统一处理头像 URL 的转换逻辑
 */

import config from '@/config/env';

/**
 * 获取完整的头像 URL
 * 
 * @param url - 头像路径（可能是相对路径或完整 URL）
 * @returns 完整的可访问 URL
 * 
 * @example
 * getAvatarUrl('/api/uploads/avatars/xxx.jpeg') 
 * // => 'http://192.168.31.197:3000/api/uploads/avatars/xxx.jpeg'
 * 
 * getAvatarUrl('https://example.com/avatar.jpg') 
 * // => 'https://example.com/avatar.jpg'
 * 
 * getAvatarUrl('') 
 * // => '/static/logo.png'
 */
export function getAvatarUrl(url: string | null | undefined): string {
  // 空值返回默认头像
  if (!url) {
    return '/static/logo.png';
  }
  
  // 已经是完整 URL（http/https 开头）
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 相对路径（以 / 开头），拼接服务器基础地址
  if (url.startsWith('/')) {
    // 从 API_BASE_URL 中去掉 /api 后缀，得到基础域名
    // 例如：http://192.168.31.197:3000/api => http://192.168.31.197:3000
    const baseUrl = config.API_BASE_URL.replace(/\/api$/, '');
    return `${baseUrl}${url}`;
  }
  
  // 其他情况（不太可能，但为了安全）
  return url;
}


/**
 * 认证相关 API
 */

import { post, get } from '@/utils/request';

/**
 * 微信登录请求参数
 */
export interface WxLoginParams {
  code: string;
  nickname: string;
  avatar: string;
}

/**
 * 微信登录响应
 */
export interface WxLoginResponse {
  token: string;
  userInfo: {
    id: number;
    nickname: string;
    avatar: string;
  };
}

/**
 * 微信登录
 * 
 * @param params - 登录参数
 * @returns Promise<WxLoginResponse>
 */
export function wxLogin(params: WxLoginParams): Promise<WxLoginResponse> {
  return post<WxLoginResponse>('/auth/wx-login', params, false);
}

/**
 * 获取当前用户信息
 * 
 * @returns Promise<UserInfo>
 */
export function getCurrentUser(): Promise<any> {
  return get('/auth/me');
}

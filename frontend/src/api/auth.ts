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
 * 微信静默登录
 * 
 * 不需要用户信息，仅使用 code 登录，适用于自动登录场景
 * 
 * @param code - 微信登录凭证
 * @returns Promise<WxLoginResponse>
 */
export function silentWxLogin(code: string): Promise<WxLoginResponse> {
  return post<WxLoginResponse>('/auth/wx-login', { code }, false);
}

/**
 * 获取当前用户信息
 * 
 * @returns Promise<UserInfo>
 */
export function getCurrentUser(): Promise<any> {
  return get('/auth/me');
}

/**
 * 注销当前账号（置为 deleted）
 */
export function deactivate(): Promise<{ message: string }> {
  return post<{ message: string }>('/auth/deactivate');
}
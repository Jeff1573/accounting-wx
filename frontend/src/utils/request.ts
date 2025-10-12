/**
 * HTTP 请求封装模块
 * 
 * 封装 uni.request，提供统一的请求处理和错误处理
 */

import { useUserStore } from '@/stores/user';
import config from '@/config/env';

/**
 * API 基础 URL
 * 
 * 真机调试时请修改 @/config/env.ts 中的配置：
 * 1. 将 USE_DEVICE_IP 改为 true
 * 2. 将 DEVICE_API_BASE_URL 改为你的电脑局域网 IP
 */
const BASE_URL = config.API_BASE_URL;

/**
 * 请求配置接口
 */
interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  params?: any;
  header?: any;
  needAuth?: boolean;
}

/**
 * 响应数据接口
 */
interface Response<T = any> {
  data: T;
  statusCode: number;
  header: any;
}

/**
 * 发起 HTTP 请求
 * 
 * @param config - 请求配置
 * @returns Promise<T> 响应数据
 * 
 * @example
 * const result = await request<{ token: string }>({
 *   url: '/auth/wx-login',
 *   method: 'POST',
 *   data: { code: 'xxx' }
 * });
 */
export function request<T = any>(config: RequestConfig): Promise<T> {
  const {
    url,
    method = 'GET',
    data,
    params,
    header = {},
    needAuth = true
  } = config;

  // 构建完整 URL
  let fullUrl = `${BASE_URL}${url}`;
  
  // 添加查询参数
  if (params) {
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    fullUrl += `?${queryString}`;
  }

  // 添加认证 token
  if (needAuth) {
    const userStore = useUserStore();
    if (userStore.token) {
      header['Authorization'] = `Bearer ${userStore.token}`;
    }
  }

  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: fullUrl,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header
      },
      success: (res: Response) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
        } else if (res.statusCode === 401) {
          // token 失效，清除登录状态
          const userStore = useUserStore();
          userStore.logout();
          uni.showToast({
            title: '登录已过期',
            icon: 'none'
          });
          setTimeout(() => {
            uni.reLaunch({ url: '/pages/login/index' });
          }, 1500);
          reject(new Error('未授权'));
        } else {
          const errorMsg = (res.data as any)?.error || '请求失败';
          uni.showToast({
            title: errorMsg,
            icon: 'none'
          });
          reject(new Error(errorMsg));
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
        uni.showToast({
          title: '网络错误',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}

/**
 * GET 请求
 */
export function get<T = any>(url: string, params?: any, needAuth = true): Promise<T> {
  return request<T>({ url, method: 'GET', params, needAuth });
}

/**
 * POST 请求
 */
export function post<T = any>(url: string, data?: any, needAuth = true): Promise<T> {
  return request<T>({ url, method: 'POST', data, needAuth });
}

/**
 * PUT 请求
 */
export function put<T = any>(url: string, data?: any, needAuth = true): Promise<T> {
  return request<T>({ url, method: 'PUT', data, needAuth });
}

/**
 * DELETE 请求
 */
export function del<T = any>(url: string, needAuth = true): Promise<T> {
  return request<T>({ url, method: 'DELETE', needAuth });
}

/**
 * HTTP 请求封装模块
 * 
 * 封装 uni.request，提供统一的请求处理和错误处理
 * 
 * 注意：本模块属于工具层，不能直接导入 Store 层的代码，
 * 需要通过依赖注入的方式获取 token 和处理 401
 */

import config from '@/config/env';

/**
 * Token 获取函数（通过依赖注入设置）
 */
let tokenGetter: (() => string) | null = null;

/**
 * 401 错误处理函数（通过依赖注入设置）
 */
let handle401: (() => Promise<boolean>) | null = null;

// 避免重复触发 401 刷新：全局刷新中的 Promise（单例）
let ongoingAuthRefresh: Promise<boolean> | null = null;

/**
 * HTTP 错误类
 * 
 * 包含状态码信息，方便上层代码判断错误类型
 */
export class HttpError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

/**
 * 初始化请求工具
 * 
 * 在 App.vue 中调用，设置 token 获取函数和 401 处理函数
 * 
 * @param getToken - 获取当前 token 的函数
 * @param on401 - 处理 401 错误的函数（返回 true 表示处理成功）
 */
export function initRequest(getToken: () => string, on401: () => Promise<boolean>) {
  tokenGetter = getToken;
  handle401 = on401;
}

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
  _isRetry?: boolean; // 内部标记，表示是否为重试请求
}

/**
 * UniApp 响应数据接口
 */
interface UniResponse<T = any> {
  data: T;
  statusCode: number;
  header: any;
}

/**
 * 统一 API 响应格式接口
 */
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

/**
 * 发起 HTTP 请求
 * 
 * @param config - 请求配置
 * @returns Promise<T> 响应数据中的 data 字段
 * 
 * @example
 * const result = await request<{ token: string }>({
 *   url: '/auth/wx-login',
 *   method: 'POST',
 *   data: { code: 'xxx' }
 * });
 */
export async function request<T = any>(requestConfig: RequestConfig): Promise<T> {
  const {
    url,
    method = 'GET',
    data,
    params,
    header = {},
    needAuth = true,
    _isRetry = false
  } = requestConfig;

  // 构建完整 URL
  let fullUrl = `${BASE_URL}${url}`;
  
  // 添加查询参数
  if (params) {
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    fullUrl += `?${queryString}`;
  }

  // 添加认证 token（通过依赖注入获取）
  if (needAuth && tokenGetter) {
    const token = tokenGetter();
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }
  }

  // 调试日志：请求即将发起
  const requestStartTime = Date.now();
  if (config.ENABLE_REQUEST_LOG) {
    try {
      console.log('[HTTP] ->', method, fullUrl, {
        params: params ?? null,
        data: data ?? null,
        needAuth,
        headers: header
      });
    } catch {}
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
      success: async (res: UniResponse) => {
        if (config.ENABLE_REQUEST_LOG) {
          try {
            console.log('[HTTP] <-', method, fullUrl, {
              statusCode: res.statusCode,
              durationMs: Date.now() - requestStartTime,
              body: res.data
            });
          } catch {}
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 解析统一的 API 响应格式
          const apiResponse = res.data as ApiResponse<T>;
          
          // 检查业务状态码
          if (apiResponse.code >= 200 && apiResponse.code < 300) {
            // 成功：返回 data 字段
            resolve(apiResponse.data as T);
          } else {
            // 业务错误：显示错误消息
            const errorMsg = apiResponse.message || '操作失败';
            
            // 403/404 错误不显示 toast（由上层处理跳转和提示）
            if (apiResponse.code !== 403 && apiResponse.code !== 404) {
              uni.showToast({
                title: errorMsg,
                icon: 'none'
              });
            }
            
            reject(new HttpError(errorMsg, apiResponse.code));
          }
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          // 鉴权失败（仅对需要认证的请求进行处理）
          console.log(`收到 ${res.statusCode} 响应，鉴权失败`);

          // 对无需认证的接口（如 /auth/wx-login）直接返回错误，避免进入刷新流程
          if (!needAuth) {
            const apiResponse = res.data as ApiResponse;
            const message = apiResponse?.message || (res.statusCode === 403 ? '账号不可用' : '未授权');
            reject(new HttpError(message, res.statusCode));
            return;
          }
          
          // 如果是重试请求仍然 401，或者没有设置 401 处理函数，则直接失败
          if (_isRetry || !handle401) {
            console.log('重试请求仍然失败或未设置处理函数');
            uni.showToast({
              title: res.statusCode === 403 ? '账号不可用' : '登录已过期',
              icon: 'none',
              duration: 2000
            });
            reject(new Error('未授权'));
            return;
          }
          
          // 首次 401：通过全局单例触发一次刷新，其他请求等待结果
          try {
            if (!ongoingAuthRefresh) {
              console.log('调用 401 处理函数...');
              ongoingAuthRefresh = handle401();
            }
            const success = await ongoingAuthRefresh;
            ongoingAuthRefresh = null;

            if (success) {
              console.log('401 处理成功，重试原请求');
              // 处理成功，重试原请求
              try {
                const retryResult = await request<T>({
                  ...requestConfig,
                  _isRetry: true // 标记为重试请求
                });
                resolve(retryResult);
              } catch (retryError) {
                reject(retryError);
              }
            } else {
              // 处理失败
              console.log('鉴权处理失败');
              uni.showToast({
                title: res.statusCode === 403 ? '账号不可用' : '登录已过期',
                icon: 'none',
                duration: 2000
              });
              reject(new Error('未授权'));
            }
          } catch (e) {
            // 兜底：刷新过程异常
            ongoingAuthRefresh = null;
            console.log('鉴权处理异常');
            uni.showToast({ 
              title: res.statusCode === 403 ? '账号不可用' : '登录已过期', 
              icon: 'none',
              duration: 2000
            });
            reject(new Error('未授权'));
          }
        } else {
          // HTTP 错误：尝试从响应体中获取错误消息
          const apiResponse = res.data as ApiResponse;
          const errorMsg = apiResponse?.message || '请求失败';
          
          // 403/404 错误不显示 toast（由上层处理跳转和提示）
          if (res.statusCode !== 403 && res.statusCode !== 404) {
            uni.showToast({
              title: errorMsg,
              icon: 'none'
            });
          }
          
          reject(new HttpError(errorMsg, res.statusCode));
        }
      },
      fail: (err) => {
        if (config.ENABLE_REQUEST_LOG) {
          try {
            console.log('[HTTP] x ', method, fullUrl, {
              durationMs: Date.now() - requestStartTime,
              error: err
            });
          } catch {}
        }
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

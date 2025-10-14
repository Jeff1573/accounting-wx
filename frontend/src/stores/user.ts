/**
 * 用户状态管理 Store
 * 
 * 管理用户登录状态和用户信息
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { silentWxLogin } from '@/api/auth';

/**
 * 用户信息接口
 */
export interface UserInfo {
  id: number;
  nickname: string;
  avatar: string;
}

/**
 * 登录后页面跳转信息
 */
export interface PostLoginRedirect {
  method: 'redirectTo' | 'switchTab' | 'reLaunch';
  url: string;
}

const STORAGE_KEY_POST_LOGIN_REDIRECT = 'postLoginRedirect';

/**
 * 用户 Store
 */
export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string>('');
  const userInfo = ref<UserInfo | null>(null);
  const postLoginRedirect = ref<PostLoginRedirect | null>(null);
  // 静默登录中的单例 Promise（防止并发触发多次 wx-login）
  let ongoingSilentLogin: Promise<boolean> | null = null;

  /**
   * 是否已登录
   */
  const isLoggedIn = computed(() => !!token.value);

  /**
   * 设置登录信息
   * 
   * @param newToken - JWT token
   * @param info - 用户信息
   */
  function setLogin(newToken: string, info: UserInfo): void {
    token.value = newToken;
    userInfo.value = info;
    
    // 持久化到本地存储
    uni.setStorageSync('token', newToken);
    uni.setStorageSync('userInfo', info);
  }

  /**
   * 退出登录
   */
  function logout(): void {
    token.value = '';
    userInfo.value = null;
    
    // 清除本地存储
    uni.removeStorageSync('token');
    uni.removeStorageSync('userInfo');
  }

  /**
   * 从本地存储恢复登录状态
   */
  function restoreLogin(): void {
    try {
      const savedToken = uni.getStorageSync('token');
      const savedUserInfo = uni.getStorageSync('userInfo');
      const savedRedirect = uni.getStorageSync(STORAGE_KEY_POST_LOGIN_REDIRECT);
      
      if (savedToken && savedUserInfo) {
        token.value = savedToken;
        userInfo.value = savedUserInfo;
      }
      if (
        savedRedirect &&
        typeof savedRedirect === 'object' &&
        'url' in savedRedirect &&
        'method' in savedRedirect
      ) {
        postLoginRedirect.value = savedRedirect as PostLoginRedirect;
      }
    } catch (error) {
      console.error('恢复登录状态失败:', error);
    }
  }

  /**
   * 更新用户信息
   * 
   * @param info - 新的用户信息
   */
  function updateUserInfo(info: Partial<UserInfo>): void {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...info };
      uni.setStorageSync('userInfo', userInfo.value);
    }
  }

  /**
   * 设置登录后跳转目标
   *
   * @param redirect - 需要在登录成功后执行的跳转信息，传入 null 表示清除
   */
  function setPostLoginRedirect(redirect: PostLoginRedirect | null): void {
    postLoginRedirect.value = redirect;
    try {
      if (redirect) {
        uni.setStorageSync(STORAGE_KEY_POST_LOGIN_REDIRECT, redirect);
      } else {
        uni.removeStorageSync(STORAGE_KEY_POST_LOGIN_REDIRECT);
      }
    } catch (error) {
      console.error('保存登录后跳转信息失败:', error);
    }
  }

  /**
   * 取出并清空登录后跳转目标
   *
   * @returns 登录后待执行的跳转信息，若不存在返回 null
   */
  function consumePostLoginRedirect(): PostLoginRedirect | null {
    if (!postLoginRedirect.value) {
      try {
        const stored = uni.getStorageSync(STORAGE_KEY_POST_LOGIN_REDIRECT);
        if (
          stored &&
          typeof stored === 'object' &&
          'url' in stored &&
          'method' in stored
        ) {
          postLoginRedirect.value = stored as PostLoginRedirect;
        }
      } catch (error) {
        console.error('读取登录后跳转信息失败:', error);
      }
    }

    const redirect = postLoginRedirect.value;
    if (redirect) {
      postLoginRedirect.value = null;
      try {
        uni.removeStorageSync(STORAGE_KEY_POST_LOGIN_REDIRECT);
      } catch (error) {
        console.error('清除登录后跳转信息失败:', error);
      }
      return redirect;
    }

    return null;
  }

  /**
   * 静默登录
   * 
   * 使用微信登录凭证进行静默登录，不需要用户输入信息
   * 适用于自动登录、token 过期自动刷新等场景
   * 
   * @returns Promise<boolean> 登录是否成功
   */
  async function silentLogin(): Promise<boolean> {
    // 复用进行中的静默登录，避免并发触发多次 wx-login
    if (ongoingSilentLogin) return ongoingSilentLogin;

    ongoingSilentLogin = (async () => {
      try {
        console.log('开始静默登录...');
        
        // 1. 获取微信登录 code
        const loginRes = await uni.login({
          provider: 'weixin'
        });

        if (!loginRes.code) {
          console.error('获取登录凭证失败');
          return false;
        }

        console.log('获取到登录凭证，调用后端接口...');

        // 2. 调用 auth.ts 中的静默登录接口
        const result = await silentWxLogin(loginRes.code);
        
        // 3. 保存登录状态
        setLogin(result.token, result.userInfo);
        
        console.log('静默登录成功');
        return true;
      } catch (error) {
        console.error('静默登录失败:', error);
        return false;
      } finally {
        // 重置单例占位，允许后续新的登录尝试
        ongoingSilentLogin = null;
      }
    })();

    return ongoingSilentLogin;
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    setLogin,
    logout,
    restoreLogin,
    updateUserInfo,
    silentLogin,
    setPostLoginRedirect,
    consumePostLoginRedirect
  };
});

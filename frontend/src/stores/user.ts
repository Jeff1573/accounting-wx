/**
 * 用户状态管理 Store
 * 
 * 管理用户登录状态和用户信息
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * 用户信息接口
 */
export interface UserInfo {
  id: number;
  nickname: string;
  avatar: string;
}

/**
 * 用户 Store
 */
export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string>('');
  const userInfo = ref<UserInfo | null>(null);

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
      
      if (savedToken && savedUserInfo) {
        token.value = savedToken;
        userInfo.value = savedUserInfo;
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

  return {
    token,
    userInfo,
    isLoggedIn,
    setLogin,
    logout,
    restoreLogin,
    updateUserInfo
  };
});

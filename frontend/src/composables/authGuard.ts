/**
 * 页面级认证守卫（支持 TTL 轻校验）
 */

import { onLoad, onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { getCurrentUser } from '@/api/auth';
import { HttpError } from '@/utils/request';

export interface AuthGuardOptions {
  requireLogin?: boolean;
  validateStatusTTLMs?: number; // 状态校验最小间隔
  hook?: 'onLoad' | 'onShow';
}

/**
 * 在页面中调用：
 * const ensureAuth = useAuthGuard({ requireLogin: true, validateStatusTTLMs: 300000 });
 * // onLoad(async () => { if (!(await ensureAuth())) return; // 继续加载数据 });
 */
export function useAuthGuard(options: AuthGuardOptions = {}) {
  const requireLogin = options.requireLogin !== false; // 默认需要登录
  const ttl = typeof options.validateStatusTTLMs === 'number' ? options.validateStatusTTLMs : 5 * 60 * 1000;
  const userStore = useUserStore();

  async function ensureAuth(): Promise<boolean> {
    try {
      // 1) 恢复本地
      userStore.restoreLogin();

      // 2) 未登录则静默登录（需要登录时）
      if (requireLogin && !userStore.isLoggedIn) {
        const ok = await userStore.silentLogin();
        if (!ok) {
          // 静默登录失败，返回 false 但不跳转（由页面自行处理）
          return false;
        }
      }

      // 3) TTL 轻校验（需已登录）
      if (userStore.isLoggedIn && ttl > 0) {
        const lastChecked = Number(uni.getStorageSync('auth_status_checked_at') || 0);
        if (!lastChecked || Date.now() - lastChecked > ttl) {
          try {
            await getCurrentUser();
            uni.setStorageSync('auth_status_checked_at', String(Date.now()));
          } catch (e: any) {
            if (e instanceof HttpError && e.statusCode === 403) {
              // 账号不可用
              userStore.logout();
              uni.showToast({ title: e.message || '账号不可用', icon: 'none', duration: 2000 });
              return false;
            }
            // 其他错误：忽略为弱校验
          }
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  // 可选：自动挂载到生命周期
  if (options.hook === 'onLoad') {
    onLoad(() => { ensureAuth(); });
  } else if (options.hook === 'onShow') {
    onShow(() => { ensureAuth(); });
  }

  return ensureAuth;
}



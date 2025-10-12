<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useUserStore } from '@/stores/user';
import { getCurrentUser } from '@/api/auth';
import { initRequest, HttpError } from '@/utils/request';

/**
 * 应用启动时的自动登录逻辑
 * 
 * 改进后的流程：
 * 1. 检查本地是否有 token
 * 2. 如果有 token：验证微信会话 → 验证后端 token
 *    - 如果返回 404（用户不存在）：清除本地数据，跳转登录页
 *    - 如果其他错误：尝试静默登录
 * 3. 如果没有 token：直接尝试静默登录（新用户会创建账户，老用户会恢复账户）
 * 4. 只有静默登录失败才让用户进入登录页手动登录
 */
async function autoLogin(allowRedirect: boolean = true) {
  const userStore = useUserStore();
  
  console.log('开始自动登录流程...');
  
  // 1. 检查本地是否有 token
  const savedToken = uni.getStorageSync('token');
  
  if (savedToken) {
    console.log('本地存在 token，检查微信会话...');
    
    // 2. 检查微信会话是否有效
    try {
      await uni.checkSession();
      console.log('微信会话有效，验证后端 token...');
      
      // 3. 验证后端 token 是否有效
      try {
        userStore.restoreLogin();
        await getCurrentUser();
        console.log('Token 验证成功');
        if (allowRedirect) {
          console.log('跳转到房间列表');
          uni.reLaunch({ url: '/pages/rooms/index' });
        }
        return;
      } catch (error) {
        // 检查是否为 404 错误（用户不存在）
        if (error instanceof HttpError && error.statusCode === 404) {
          console.log('用户不存在（404），清除本地数据并跳转登录页');
          userStore.logout();
          uni.reLaunch({ url: '/pages/login/index' });
          return;
        } else if (error instanceof HttpError && error.statusCode === 403) {
          // 账号已禁用（已注销或已封禁）
          console.log('账号已禁用（403），清除本地数据并跳转登录页');
          userStore.logout();
          uni.showToast({
            title: error.message || '账号已被禁用',
            icon: 'none',
            duration: 2000
          });
          setTimeout(() => {
            uni.reLaunch({ url: '/pages/login/index' });
          }, 2000);
          return;
        }
        
        console.log('Token 验证失败，尝试静默登录...', error);
      }
    } catch {
      console.log('微信会话失效，尝试静默登录...');
    }
  } else {
    console.log('本地没有 token，尝试静默登录（新用户会创建账户，老用户会恢复账户）...');
  }
  
  // 4. 尝试静默登录（适用于：token 失效、微信会话失效、本地无 token）
  const success = await userStore.silentLogin();
  if (success) {
    console.log('静默登录成功');
    if (allowRedirect) {
      console.log('跳转到房间列表');
      uni.reLaunch({ url: '/pages/rooms/index' });
    }
  } else {
    console.log('静默登录失败，用户需要进入登录页手动登录');
    // 不做任何操作，让应用自然进入登录页（pages.json 的第一个页面）
  }
}

onLaunch((appOptions) => {
  console.log("App Launch", appOptions);
  
  // 初始化请求工具（依赖注入）
  const userStore = useUserStore();
  initRequest(
    // Token 获取函数
    () => userStore.token,
    // 401 错误处理函数
    async () => {
      const success = await userStore.silentLogin();
      return success;
    }
  );
  
  // 如果是通过邀请链接进入（携带 inviteCode），则不自动重定向到房间页
  const hasInvite = !!(appOptions as any)?.query?.inviteCode;
  // 执行自动登录；当有邀请参数时，仅静默登录但不跳转，以便登录页展示邀请弹窗
  autoLogin(!hasInvite);
});

onShow(() => {
  console.log("App Show");
});

onHide(() => {
  console.log("App Hide");
});
</script>

<style>
/* 全局样式 */
page {
  background-color: #f5f5f5;
}

/* 通用样式 */
.container {
  padding: 20rpx;
}

.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

/* 按钮样式 */
.btn-primary {
  background-color: #07C160;
  color: #ffffff;
  border-radius: 8rpx;
  padding: 24rpx;
  font-size: 32rpx;
  text-align: center;
}

.btn-secondary {
  background-color: #ffffff;
  color: #07C160;
  border: 2rpx solid #07C160;
  border-radius: 8rpx;
  padding: 24rpx;
  font-size: 32rpx;
  text-align: center;
}

/* 文字样式 */
.text-primary {
  color: #07C160;
}

.text-danger {
  color: #FA5151;
}

.text-muted {
  color: #999999;
}

.text-center {
  text-align: center;
}

/* 余额样式 */
.balance-positive {
  color: #07C160;
  font-weight: bold;
}

.balance-negative {
  color: #FA5151;
  font-weight: bold;
}

.balance-zero {
  color: #999999;
}
</style>

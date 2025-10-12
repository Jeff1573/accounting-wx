<template>
  <view class="login-container">
    <view class="login-content">
      <view class="logo-section">
        <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
        <text class="app-name">记账小程序</text>
        <text class="app-desc">多人房间记账，清晰明了</text>
      </view>

      <view class="button-section">
        <button 
          class="login-button"
          @tap="handleWxLogin"
          :loading="loading"
        >
          <text v-if="!loading">微信授权登录</text>
          <text v-else>登录中...</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '@/stores/user';
import { wxLogin } from '@/api/auth';

const userStore = useUserStore();
const loading = ref(false);

/**
 * 处理微信登录
 */
async function handleWxLogin() {
  try {
    loading.value = true;

    // 1. 获取用户授权信息
    const userProfile = await getUserProfile();
    if (!userProfile) {
      loading.value = false;
      return;
    }

    // 2. 获取微信登录 code
    const loginRes = await uni.login({
      provider: 'weixin'
    });

    console.log('微信登录结果:', loginRes);
    if (!loginRes.code) {
      uni.showToast({
        title: '获取登录凭证失败',
        icon: 'none'
      });
      loading.value = false;
      return;
    }

    // 3. 调用后端登录接口
    const result = await wxLogin({
      code: loginRes.code,
      nickname: userProfile.nickName,
      avatar: userProfile.avatarUrl
    });

    // 4. 保存登录状态
    userStore.setLogin(result.token, result.userInfo);

    // 5. 跳转到房间列表
    uni.showToast({
      title: '登录成功',
      icon: 'success'
    });

    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/rooms/index'
      });
    }, 1000);

  } catch (error) {
    console.error('登录失败:', error);
    uni.showToast({
      title: '登录失败，请重试',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
}

/**
 * 获取用户信息
 */
function getUserProfile(): Promise<any> {
  return new Promise((resolve) => {
    uni.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        resolve(res.userInfo);
      },
      fail: () => {
        uni.showToast({
          title: '需要授权才能继续',
          icon: 'none'
        });
        resolve(null);
      }
    });
  });
}
</script>

<style scoped>
.login-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #07C160 0%, #05a650 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-content {
  width: 100%;
  padding: 0 60rpx;
}

.logo-section {
  text-align: center;
  margin-bottom: 120rpx;
}

.logo {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 40rpx;
  border-radius: 40rpx;
  background: #ffffff;
}

.app-name {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 20rpx;
}

.app-desc {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.button-section {
  padding: 0 20rpx;
}

.login-button {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: #ffffff;
  color: #07C160;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
}

.login-button::after {
  border: none;
}
</style>



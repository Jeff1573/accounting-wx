<template>
  <view class="me-container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <image 
        class="avatar" 
        :src="userStore.userInfo?.avatar || '/static/logo.png'" 
        mode="aspectFill"
      ></image>
      <text class="nickname">{{ userStore.userInfo?.nickname || '未登录' }}</text>
    </view>

    <!-- 菜单列表 -->
    <view class="menu-section">
      <view class="menu-item" @tap="navigateToAbout">
        <view class="menu-left">
          <text class="menu-icon">📖</text>
          <text class="menu-text">关于我们</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      
      <view class="menu-item" @tap="navigateToPrivacy">
        <view class="menu-left">
          <text class="menu-icon">🔒</text>
          <text class="menu-text">隐私政策</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 注销按钮 -->
    <view class="logout-section">
      <button class="logout-button" @tap="handleLogout">
        注销登录
      </button>
    </view>

    <!-- 版本信息 -->
    <view class="version-info">
      <text class="version-text">版本 v1.0.0</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import { useAuthGuard } from '@/composables/authGuard';
import { onLoad } from '@dcloudio/uni-app';
import { deactivate } from '@/api/auth';

const userStore = useUserStore();

onLoad(async () => {
  const ensureAuth = useAuthGuard({ requireLogin: true, validateStatusTTLMs: 5 * 60 * 1000 });
  await ensureAuth();
});

/**
 * 跳转到关于我们页面
 */
function navigateToAbout() {
  uni.navigateTo({
    url: '/pages/about/index'
  });
}

/**
 * 跳转到隐私政策页面
 */
function navigateToPrivacy() {
  uni.navigateTo({
    url: '/pages/privacy/index'
  });
}

/**
 * 处理注销登录
 */
async function handleLogout() {
  uni.showModal({
    title: '确认注销',
    content: '注销后需要重新登录，确定要注销吗？',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        uni.showLoading({ title: '处理中...' });
        await deactivate();
        uni.hideLoading();
        // 清除本地登录状态
        userStore.logout();
        uni.showToast({ title: '已注销', icon: 'success', duration: 1200 });
        setTimeout(() => { uni.reLaunch({ url: '/pages/login/index' }); }, 900);
      } catch (e: any) {
        uni.hideLoading();
        uni.showToast({ title: e?.message || '操作失败', icon: 'none' });
      }
    }
  });
}
</script>

<style scoped>
.me-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40rpx 30rpx;
}

/* 用户信息卡片 */
.user-card {
  background: linear-gradient(135deg, #07C160 0%, #05a650 100%);
  border-radius: 20rpx;
  padding: 60rpx 40rpx;
  text-align: center;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.2);
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  margin-bottom: 20rpx;
}

.nickname {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}

/* 菜单区域 */
.menu-section {
  background: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 28rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background: #f8f8f8;
}

.menu-left {
  display: flex;
  align-items: center;
}

.menu-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.menu-text {
  font-size: 28rpx;
  color: #333;
}

.menu-arrow {
  font-size: 48rpx;
  color: #ccc;
  font-weight: 300;
}

/* 注销按钮区域 */
.logout-section {
  margin-top: 30rpx;
}

.logout-button {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #ffffff;
  color: #ee0a24;
  border-radius: 16rpx;
  font-size: 28rpx;
  border: none;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.logout-button::after {
  border: none;
}

.logout-button:active {
  background: #f8f8f8;
}

/* 版本信息 */
.version-info {
  text-align: center;
  padding: 40rpx 0 20rpx;
}

.version-text {
  font-size: 24rpx;
  color: #999;
}
</style>
  
<template>
  <view class="me-container">
    <!-- 用户信息卡片 -->
    <view class="user-card" @tap="handleUserCardClick">
      <image 
        class="avatar" 
        :src="userStore.userInfo?.avatar || '/static/logo.png'" 
        mode="aspectFill"
      ></image>
      <text class="nickname">{{ userStore.userInfo?.nickname || '未登录' }}</text>
      <!-- 未登录时显示引导文案 -->
      <text v-if="!userStore.isLoggedIn" class="login-hint">
        点击登录体验完整功能
      </text>
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

    <!-- 注销按钮（仅已登录时显示） -->
    <view v-if="userStore.isLoggedIn" class="logout-section">
      <button class="logout-button" @tap="handleLogout">
        注销登录
      </button>
    </view>

    <!-- 版本信息 -->
    <view class="version-info">
      <text class="version-text">版本 v1.0.0</text>
    </view>

    <!-- 登录授权弹窗 -->
    <view v-if="loginPromptVisible" class="modal-mask" @tap="loginPromptVisible = false">
      <view class="login-modal" @tap.stop>
        <view class="login-modal-header">
          <text class="login-modal-title">登录账本小程序</text>
          <text class="login-modal-desc">完成授权后即可使用全部功能</text>
        </view>
        
        <view class="login-modal-form">
          <UserInfoForm 
            v-model="formData"
            @choose-avatar="handleChooseAvatar"
            @nickname-blur="handleNicknameBlur"
          />
        </view>
        
        <view class="login-modal-buttons">
          <button class="login-cancel-btn" @click="closeLoginPrompt">
            稍后再说
          </button>
          <button 
            class="login-confirm-btn" 
            :loading="loginLoading"
            :disabled="!isValid() || loginLoading"
            @click="handleWxLogin"
          >
            <text v-if="!loginLoading">微信授权登录</text>
            <text v-else>登录中...</text>
          </button>
        </view>
        
        <text class="login-tip" v-if="!isValid()">
          请先选择头像并输入昵称
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { useAuthGuard } from '@/composables/authGuard';
import { onLoad } from '@dcloudio/uni-app';
import { deactivate, wxLogin } from '@/api/auth';
import { useUserInfoForm } from '@/utils/useUserInfoForm';
import UserInfoForm from '@/components/UserInfoForm.vue';

const userStore = useUserStore();
const loginPromptVisible = ref(false);
const loginLoading = ref(false);

// 使用用户信息表单 composable
const {
  avatarUrl,
  nickname,
  handleChooseAvatar,
  handleNicknameBlur,
  isValid
} = useUserInfoForm();

// 表单数据双向绑定
const formData = computed({
  get: () => ({ avatarUrl: avatarUrl.value, nickname: nickname.value }),
  set: (val) => {
    avatarUrl.value = val.avatarUrl;
    nickname.value = val.nickname;
  }
});

onLoad(async () => {
  // 允许游客访问，查看关于我们和隐私政策
  const ensureAuth = useAuthGuard({ requireLogin: false, validateStatusTTLMs: 5 * 60 * 1000 });
  await ensureAuth();
});

/**
 * 处理用户卡片点击（未登录时显示登录弹窗）
 */
function handleUserCardClick() {
  if (!userStore.isLoggedIn) {
    loginPromptVisible.value = true;
  }
}

/**
 * 关闭登录提示弹窗
 */
function closeLoginPrompt() {
  loginPromptVisible.value = false;
}

/**
 * 处理微信登录
 */
async function handleWxLogin() {
  try {
    // 验证用户信息
    if (!isValid()) {
      uni.showToast({
        title: '请先选择头像并输入昵称',
        icon: 'none'
      });
      return;
    }

    loginLoading.value = true;

    // 获取微信登录 code
    const loginRes = await uni.login({
      provider: 'weixin'
    });
    
    if (!loginRes.code) {
      uni.showToast({
        title: '获取登录凭证失败',
        icon: 'none'
      });
      loginLoading.value = false;
      return;
    }

    // 调用后端登录接口
    const result = await wxLogin({
      code: loginRes.code,
      nickname: nickname.value,
      avatar: avatarUrl.value
    });

    // 保存登录状态
    userStore.setLogin(result.token, result.userInfo);

    uni.showToast({
      title: '登录成功',
      icon: 'success',
      duration: 1500
    });

    // 关闭登录弹窗
    loginPromptVisible.value = false;
    loginLoading.value = false;
  } catch (error: any) {
    loginLoading.value = false;
    uni.showToast({
      title: error.message || '登录失败',
      icon: 'none'
    });
  }
}

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
        setTimeout(() => { uni.switchTab({ url: '/pages/rooms/index' }); }, 900);
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
  cursor: pointer;
}

.user-card:active {
  opacity: 0.9;
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

.login-hint {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
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

/* 登录弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.login-modal {
  width: 640rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 50rpx 40rpx 40rpx;
  max-height: 80vh;
  overflow-y: auto;
}

.login-modal-header {
  text-align: center;
  margin-bottom: 40rpx;
}

.login-modal-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 16rpx;
}

.login-modal-desc {
  display: block;
  font-size: 26rpx;
  color: #999999;
}

.login-modal-form {
  margin-bottom: 40rpx;
}

.login-modal-buttons {
  display: flex;
  gap: 20rpx;
}

.login-cancel-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  background: #f5f5f5;
  color: #666666;
  border-radius: 44rpx;
  font-size: 30rpx;
  border: none;
}

.login-cancel-btn::after {
  border: none;
}

.login-confirm-btn {
  flex: 2;
  height: 88rpx;
  line-height: 88rpx;
  background: #07C160;
  color: #ffffff;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: bold;
  border: none;
}

.login-confirm-btn::after {
  border: none;
}

.login-confirm-btn[disabled] {
  background: #d0d0d0;
  color: #999999;
}

.login-tip {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: #FA5151;
  margin-top: 20rpx;
}
</style>
  
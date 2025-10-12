<template>
  <view class="login-container">
    <view class="login-content">
      <view class="logo-section">
        <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
        <text class="app-name">记账小程序</text>
        <text class="app-desc">多人房间记账，清晰明了</text>
      </view>

      <view class="user-info-section">
        <UserInfoForm 
          v-model="formData"
          @choose-avatar="handleChooseAvatar"
          @nickname-blur="handleNicknameBlur"
        />
      </view>

      <view class="button-section">
        <button 
          class="login-button"
          @tap="handleWxLogin"
          :loading="loading"
          :disabled="!isValid()"
        >
          <text v-if="!loading">微信登录</text>
          <text v-else>登录中...</text>
        </button>
        <text class="tip-text" v-if="!isValid()">
          请先选择头像并输入昵称
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { wxLogin } from '@/api/auth';
import { useUserInfoForm } from '@/utils/useUserInfoForm';
import UserInfoForm from '@/components/UserInfoForm.vue';

const userStore = useUserStore();
const loading = ref(false);

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

/**
 * 页面加载时检查登录状态
 * 
 * 如果用户已经登录，直接跳转到房间列表
 */
onMounted(() => {
  if (userStore.isLoggedIn) {
    console.log('用户已登录，跳转到房间列表');
    uni.reLaunch({
      url: '/pages/rooms/index'
    });
  }
});

/**
 * 处理微信登录
 * 
 * 流程：
 * 1. 验证用户已选择头像和输入昵称
 * 2. 通过 uni.login 获取登录凭证 code
 * 3. 调用后端接口，携带 code、头像和昵称
 * 4. 后端用 code 换取 openid，并保存用户信息
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

    loading.value = true;

    // 第一步：获取微信登录 code
    console.log('开始获取登录凭证 code...');
    const loginRes = await uni.login({
      provider: 'weixin'
    });

    console.log('登录凭证结果:', loginRes);
    
    if (!loginRes.code) {
      uni.showToast({
        title: '获取登录凭证失败',
        icon: 'none'
      });
      loading.value = false;
      return;
    }

    // 第二步：调用后端接口（后端会用 code 换取 openid）
    console.log('调用后端登录接口...');
    const result = await wxLogin({
      code: loginRes.code,
      nickname: nickname.value,
      avatar: avatarUrl.value
    });

    console.log('登录成功，用户信息:', result);

    // 第三步：保存登录状态
    userStore.setLogin(result.token, result.userInfo);

    // 第四步：跳转到房间列表
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
  margin-bottom: 80rpx;
}

.logo {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 30rpx;
  border-radius: 32rpx;
  background: #ffffff;
}

.app-name {
  display: block;
  font-size: 44rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 16rpx;
}

.app-desc {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 用户信息填写区域 */
.user-info-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

/* 登录按钮区域 */
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
  margin-bottom: 16rpx;
}

.login-button::after {
  border: none;
}

.login-button[disabled] {
  background: rgba(255, 255, 255, 0.6);
  color: rgba(7, 193, 96, 0.5);
}

.tip-text {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 8rpx;
}
</style>



<template>
  <view class="login-container">
    <view class="login-content">
      <view class="logo-section">
        <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
        <text class="app-name">记账小程序</text>
        <text class="app-desc">多人房间记账，清晰明了</text>
      </view>

      <view class="user-info-section">
        <view class="info-item">
          <text class="info-label">选择头像</text>
          <button 
            class="avatar-button" 
            open-type="chooseAvatar"
            @chooseavatar="onChooseAvatar"
          >
            <image 
              class="avatar-image" 
              :src="getAvatarUrl(avatarUrl)" 
              mode="aspectFill"
            ></image>
            <view class="avatar-tip">点击选择</view>
          </button>
        </view>

        <view class="info-item">
          <text class="info-label">输入昵称</text>
          <input 
            type="nickname"
            class="nickname-input"
            placeholder="请输入昵称"
            :value="nickname"
            @blur="onNicknameBlur"
          />
        </view>
      </view>

      <view class="button-section">
        <button 
          class="login-button"
          @tap="handleWxLogin"
          :loading="loading"
          :disabled="!avatarUrl || !nickname"
        >
          <text v-if="!loading">微信登录</text>
          <text v-else>登录中...</text>
        </button>
        <text class="tip-text" v-if="!avatarUrl || !nickname">
          请先选择头像并输入昵称
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { wxLogin } from '@/api/auth';
import { getAvatarUrl } from '@/utils/avatar';
import config from '@/config/env';

const userStore = useUserStore();
const loading = ref(false);
const avatarUrl = ref('');
const nickname = ref('');

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
 * 处理头像选择
 * 
 * 当用户通过 button open-type="chooseAvatar" 选择头像后触发
 * 微信返回的是临时本地路径，需要立即上传到服务器
 * 
 * @param e - 选择头像事件对象
 * @param e.detail.avatarUrl - 用户选择的头像临时路径
 */
async function onChooseAvatar(e: any) {
  const { avatarUrl: tempPath } = e.detail;
  console.log('选择的临时头像路径:', tempPath);

  try {
    // 显示上传中提示
    uni.showLoading({ title: '上传头像中...' });
    
    // 上传到后端服务器
    const uploadRes = await uni.uploadFile({
      url: `${config.API_BASE_URL}/upload/avatar`,
      filePath: tempPath,
      name: 'avatar'
    });

    console.log('上传结果:', uploadRes);

    if (uploadRes.statusCode === 200) {
      const response = JSON.parse(uploadRes.data as string);
      // 后端现在返回统一格式：{ code, message, data: { url } }
      if (response.code === 200 && response.data?.url) {
        // 保存服务器返回的 URL（这个 URL 所有人都能访问）
        avatarUrl.value = response.data.url;
        console.log('头像上传成功，URL:', response.data.url);
        
        uni.showToast({
          title: '头像上传成功',
          icon: 'success',
          duration: 1500
        });
      } else {
        throw new Error(response.message || '上传失败');
      }
    } else {
      throw new Error('上传失败');
    }
  } catch (error) {
    console.error('上传头像失败:', error);
    uni.showToast({
      title: '头像上传失败，请重试',
      icon: 'none',
      duration: 2000
    });
    // 清空头像
    avatarUrl.value = '';
  } finally {
    uni.hideLoading();
  }
}

/**
 * 处理昵称输入
 * 
 * 当用户在 input type="nickname" 中输入昵称并失去焦点时触发
 * 
 * @param e - 输入框失去焦点事件对象
 * @param e.detail.value - 用户输入的昵称
 */
function onNicknameBlur(e: any) {
  const value = e.detail.value?.trim() || '';
  nickname.value = value;
  console.log('用户输入的昵称:', value);
}

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
    if (!avatarUrl.value) {
      uni.showToast({
        title: '请先选择头像',
        icon: 'none'
      });
      return;
    }

    if (!nickname.value) {
      uni.showToast({
        title: '请先输入昵称',
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

.info-item {
  margin-bottom: 32rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  display: block;
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 16rpx;
  font-weight: 500;
}

/* 头像选择按钮 */
.avatar-button {
  width: 160rpx;
  height: 160rpx;
  padding: 0;
  margin: 0 auto; /* 水平居中 */
  border: none;
  background: #f5f5f5;
  border-radius: 16rpx;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.avatar-button::after {
  border: none;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 16rpx;
}

.avatar-tip {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  font-size: 22rpx;
  text-align: center;
  padding: 8rpx 0;
}

/* 昵称输入框 */
.nickname-input {
  width: 100%;
  height: 88rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
}

.nickname-input::placeholder {
  color: #999999;
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



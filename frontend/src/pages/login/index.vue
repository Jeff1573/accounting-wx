<template>
  <view class="login-container">
    <view class="login-content">
      <view class="logo-section">
        <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
        <text class="app-name">记账小程序</text>
        <text class="app-desc">多人房间记账，清晰明了</text>
        <text class="compliance-notice">朋友AA记账小工具，不涉及赌博哦～</text>
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

    <!-- 邀请加入弹窗（携带邀请参数时显示） -->
    <InviteJoinDialog
      :visible="inviteDialogVisible"
      :room-id="invitedRoomId"
      :invite-code="inviteCodeRef"
      :require-user-info="!userStore.isLoggedIn"
      :loading="inviteLoading"
      @confirm="handleInviteConfirm"
      @cancel="inviteDialogVisible = false"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { wxLogin } from '@/api/auth';
import { joinRoom, getRooms, checkMembership } from '@/api/room';
import { confirmJoinAfterLogin } from '@/composables/useInviteFlow';
import { HttpError } from '@/utils/request';
import { useUserInfoForm } from '@/utils/useUserInfoForm';
import UserInfoForm from '@/components/UserInfoForm.vue';
import InviteJoinDialog from '@/components/InviteJoinDialog.vue';

const userStore = useUserStore();
const loading = ref(false);

// 邀请加入相关状态
const inviteDialogVisible = ref(false);
const inviteLoading = ref(false);
const inviteCodeRef = ref('');
const invitedRoomId = ref<number>(0);
const membershipChecked = ref(false);

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
 * 登录后跳转到存储的目标页面
 */
function navigateAfterLogin(): void {
  const redirect = userStore.consumePostLoginRedirect();
  if (!redirect) {
    uni.switchTab({ url: '/pages/rooms/index' });
    return;
  }

  switch (redirect.method) {
    case 'redirectTo':
      uni.redirectTo({ url: redirect.url });
      break;
    case 'reLaunch':
      uni.reLaunch({ url: redirect.url });
      break;
    default:
      uni.switchTab({ url: redirect.url });
      break;
  }
}

/**
 * 页面加载：解析邀请参数并控制跳转/弹窗
 */
onLoad(async (options: any) => {
  const { inviteCode, roomId } = options || {};
  console.log('options', options);

  if (inviteCode) {
    // 存在邀请参数：若已登录先判断是否已在房间内
    inviteCodeRef.value = String(inviteCode);
    invitedRoomId.value = Number(roomId) || 0;

    if (userStore.isLoggedIn) {
      try {
        uni.showLoading({ title: '加载中...' });
        // 更高效：调用后端成员关系检查
        const membership = await checkMembership({ invite_code: String(inviteCode).toUpperCase() });
        if (membership.is_member) {
          // 已经是成员，直接进入房间详情（使用 redirectTo）
          uni.redirectTo({ url: `/pages/room-detail/index?roomId=${membership.room.id}` });
          membershipChecked.value = true;
          return;
        }
      } catch (err) {
        console.error('检查房间成员关系失败:', err);
      } finally {
        uni.hideLoading();
      }
    }
    // 未登录或不在该房间：展示加入弹窗
    inviteDialogVisible.value = true;
    return;
  }

  // 无邀请参数：若已登录则进入房间列表
  if (userStore.isLoggedIn) {
    navigateAfterLogin();
  }
});

// 监听登录状态：若携带邀请参数且登录在 onLoad 之后完成，则再次检查并直达房间
watch(
  () => userStore.isLoggedIn,
  async (loggedIn) => {
    if (!loggedIn) return;
    if (!inviteCodeRef.value) return;
    if (membershipChecked.value) return;
    try {
      uni.showLoading({ title: '加载中...' });
      const membership = await checkMembership({ invite_code: inviteCodeRef.value.toUpperCase() });
      if (membership.is_member) {
        membershipChecked.value = true;
        inviteDialogVisible.value = false;
        userStore.setPostLoginRedirect(null);
        uni.redirectTo({ url: `/pages/room-detail/index?roomId=${membership.room.id}` });
      }
    } catch (e) {
      console.error('登录后成员关系检查失败:', e);
    } finally {
      uni.hideLoading();
    }
  }
);

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

    // 第四步：跳转到房间列表（tabBar 页面使用 switchTab）
    uni.showToast({
      title: '登录成功',
      icon: 'success'
    });

    setTimeout(() => {
      navigateAfterLogin();
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
 * 处理邀请加入确认
 * 未登录：先完成登录；随后 joinRoom；最后跳转房间详情
 */
async function handleInviteConfirm(payload: { avatarUrl?: string; nickname?: string }) {
  try {
    inviteLoading.value = true;

    if (!userStore.isLoggedIn) {
      const loginRes = await uni.login({ provider: 'weixin' });
      if (!loginRes.code) {
        uni.showToast({ title: '获取登录凭证失败', icon: 'none' });
        return;
      }
      const res = await wxLogin({
        code: loginRes.code,
        nickname: payload.nickname || '',
        avatar: payload.avatarUrl || ''
      });
      userStore.setLogin(res.token, res.userInfo);
    }

    userStore.setPostLoginRedirect(null);
    await confirmJoinAfterLogin({ inviteCode: inviteCodeRef.value, invitedRoomId: invitedRoomId.value });
  } finally {
    inviteLoading.value = false;
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
  overflow: hidden;
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

.compliance-notice {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 12rpx;
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



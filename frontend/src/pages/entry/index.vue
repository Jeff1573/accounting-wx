<template>
  <view class="entry-container">
    <GlobalLoading 
      :visible="pageLoading" 
      :text="loadingText"
      :show-skip-button="showSkipButton"
      skip-button-text="跳过"
      @skip="handleSkip"
    />

    <!-- 邀请加入弹窗（未登录且带邀请参数时显示） -->
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
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { wxLogin } from '@/api/auth';
import { getRooms } from '@/api/room';
import { HttpError } from '@/utils/request';
import { handleInviteWhenLoggedIn, confirmJoinAfterLogin } from '@/composables/useInviteFlow';
import InviteJoinDialog from '@/components/InviteJoinDialog.vue';
import GlobalLoading from '@/components/GlobalLoading.vue';

// 基本状态
const userStore = useUserStore();
const pageLoading = ref(true);
const loadingText = ref('正在初始化...');
const showSkipButton = ref(false);
const inviteDialogVisible = ref(false);
const inviteLoading = ref(false);
const inviteCodeRef = ref('');
const invitedRoomId = ref<number>(0);

// 定时器管理
let loadingTimeout: number | null = null;
let skipButtonTimeout: number | null = null;

/**
 * 清除加载超时定时器
 */
function clearLoadingTimeout() {
  if (loadingTimeout !== null) {
    clearTimeout(loadingTimeout);
    loadingTimeout = null;
  }
  if (skipButtonTimeout !== null) {
    clearTimeout(skipButtonTimeout);
    skipButtonTimeout = null;
  }
}

/**
 * 处理跳过按钮点击
 */
function handleSkip() {
  clearLoadingTimeout();
  pageLoading.value = false;
  showSkipButton.value = false;
  uni.switchTab({ url: '/pages/rooms/index' });
}

/**
 * 页面加载：集中分发
 */
onLoad(async (options: any) => {
  // 设置5秒超时定时器
  loadingTimeout = setTimeout(() => {
    if (pageLoading.value) {
      clearLoadingTimeout();
      pageLoading.value = false;
      showSkipButton.value = false;
      uni.showToast({ 
        title: '网络较慢，已为您跳转到房间列表', 
        icon: 'none', 
        duration: 2000 
      });
      uni.switchTab({ url: '/pages/rooms/index' });
    }
  }, 5000);

  // 3秒后显示跳过按钮
  skipButtonTimeout = setTimeout(() => {
    if (pageLoading.value) {
      showSkipButton.value = true;
    }
  }, 3000);

  // 1) 兼容小程序码 scene 进入
  const sceneRaw = options?.scene ? decodeURIComponent(String(options.scene)) : '';
  if (sceneRaw) {
    // 约定 scene: r{roomId}_i{invite}
    const match = sceneRaw.match(/^r(\d+)_i([A-Za-z0-9_\-]+)$/);
    if (match) {
      invitedRoomId.value = Number(match[1]);
      inviteCodeRef.value = String(match[2]);
    }
  }

  // 2) 兼容 query 进入
  if (!inviteCodeRef.value) {
    inviteCodeRef.value = options?.inviteCode ? String(options.inviteCode) : '';
  }
  if (!invitedRoomId.value) {
    invitedRoomId.value = options?.roomId ? Number(options.roomId) : 0;
  }

  // 恢复本地登录并尝试静默登录（不弹 UI）
  userStore.restoreLogin();
  if (!userStore.isLoggedIn) {
    loadingText.value = '正在登录...';
    const success = await userStore.silentLogin();
    if (!success) {
      // 未登录
      clearLoadingTimeout();
      if (inviteCodeRef.value) {
        // 未登录 + 带邀请：展示邀请弹窗（在入口页完成注册与入房）
        pageLoading.value = false;
        showSkipButton.value = false;
        inviteDialogVisible.value = true;
        return;
      }
      // 未登录 + 无邀请：直接进入房间列表（游客模式）
      pageLoading.value = false;
      showSkipButton.value = false;
      uni.switchTab({ url: '/pages/rooms/index' });
      return;
    }
  }

  // 已登录
  if (inviteCodeRef.value) {
    clearLoadingTimeout();
    pageLoading.value = false;
    showSkipButton.value = false;
    await handleInviteWhenLoggedIn({ inviteCode: inviteCodeRef.value, invitedRoomId: invitedRoomId.value });
    userStore.setPostLoginRedirect(null);
    return;
  }

  // 无邀请：优先进入最近访问房间（lastRoomId），否则进入自己的第一个房间，最后回到"我的房间"
  try {
    loadingText.value = '获取房间列表...';
    const list = await getRooms();
    
    clearLoadingTimeout();
    
    const lastIdRaw = uni.getStorageSync('lastRoomId');
    const lastId = lastIdRaw ? Number(lastIdRaw) : 0;
    const target = lastId && list.rooms.find(r => r.id === lastId);
    if (target) {
      uni.redirectTo({ url: `/pages/room-detail/index?roomId=${target.id}` });
    } else if (list.rooms.length > 0) {
      uni.redirectTo({ url: `/pages/room-detail/index?roomId=${list.rooms[0].id}` });
    } else {
      uni.switchTab({ url: '/pages/rooms/index' });
    }
  } catch (e) {
    console.error('获取房间列表失败，回退到房间页:', e);
    clearLoadingTimeout();
    uni.switchTab({ url: '/pages/rooms/index' });
  } finally {
    pageLoading.value = false;
    showSkipButton.value = false;
  }
});

/**
 * 处理邀请确认（未登录用户在此完成注册 + 入房）
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
    await confirmJoinAfterLogin({ inviteCode: inviteCodeRef.value, invitedRoomId: invitedRoomId.value });
  } finally {
    inviteLoading.value = false;
  }
}
</script>

<style scoped>
.entry-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.loading-text {
  font-size: 28rpx;
  color: #999999;
}
</style>



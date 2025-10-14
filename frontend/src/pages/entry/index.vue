<template>
  <view class="entry-container">
    <GlobalLoading :visible="pageLoading" text="加载中..." />

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
const inviteDialogVisible = ref(false);
const inviteLoading = ref(false);
const inviteCodeRef = ref('');
const invitedRoomId = ref<number>(0);

/**
 * 页面加载：集中分发
 */
onLoad(async (options: any) => {
  inviteCodeRef.value = options?.inviteCode ? String(options.inviteCode) : '';
  invitedRoomId.value = options?.roomId ? Number(options.roomId) : 0;

  // 恢复本地登录并尝试静默登录（不弹 UI）
  userStore.restoreLogin();
  if (!userStore.isLoggedIn) {
    const success = await userStore.silentLogin();
    if (!success) {
      // 未登录
      if (inviteCodeRef.value) {
        // 未登录 + 带邀请：展示邀请弹窗（在入口页完成注册与入房）
        inviteDialogVisible.value = true;
        return;
      }
      // 未登录 + 无邀请：前往登录
      pageLoading.value = false;
      uni.reLaunch({ url: '/pages/login/index' });
      return;
    }
  }

  // 已登录
  if (inviteCodeRef.value) {
    pageLoading.value = false;
    await handleInviteWhenLoggedIn({ inviteCode: inviteCodeRef.value, invitedRoomId: invitedRoomId.value });
    return;
  }

  // 无邀请：优先进入最近访问房间（lastRoomId），否则进入自己的第一个房间，最后回到“我的房间”
  try {
    const list = await getRooms();
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
    uni.switchTab({ url: '/pages/rooms/index' });
  } finally {
    pageLoading.value = false;
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



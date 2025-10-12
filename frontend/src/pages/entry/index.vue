<template>
  <view class="entry-container">
    <!-- 轻量占位，避免闪屏 -->
    <view class="loading-text">加载中...</view>

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
import { getRooms, checkMembership, joinRoom } from '@/api/room';
import { HttpError } from '@/utils/request';
import InviteJoinDialog from '@/components/InviteJoinDialog.vue';

// 基本状态
const userStore = useUserStore();
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
      uni.reLaunch({ url: '/pages/login/index' });
      return;
    }
  }

  // 已登录
  if (inviteCodeRef.value) {
    try {
      uni.showLoading({ title: '加载中...' });
      const membership = await checkMembership({ invite_code: inviteCodeRef.value.toUpperCase() });
      if (membership.is_member) {
        // 是受邀房间成员：直达该房间
        uni.redirectTo({ url: `/pages/room-detail/index?roomId=${membership.room.id}` });
        return;
      }
      // 非该房间成员：转去自己的房间或“我的房间”
      const list = await getRooms();
      if (list.rooms.length > 0) {
        uni.redirectTo({ url: `/pages/room-detail/index?roomId=${list.rooms[0].id}` });
      } else {
        uni.switchTab({ url: '/pages/rooms/index' });
      }
      return;
    } catch (e) {
      console.error('邀请路径处理失败，回退到房间页:', e);
      uni.switchTab({ url: '/pages/rooms/index' });
      return;
    } finally {
      uni.hideLoading();
    }
  }

  // 无邀请：进入自己的房间（若有），否则“我的房间”
  try {
    const list = await getRooms();
    if (list.rooms.length > 0) {
      uni.redirectTo({ url: `/pages/room-detail/index?roomId=${list.rooms[0].id}` });
    } else {
      uni.switchTab({ url: '/pages/rooms/index' });
    }
  } catch (e) {
    console.error('获取房间列表失败，回退到房间页:', e);
    uni.switchTab({ url: '/pages/rooms/index' });
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

    try {
      const { room } = await joinRoom({ invite_code: inviteCodeRef.value.toUpperCase() });
      const id = invitedRoomId.value || room.id;
      uni.redirectTo({ url: `/pages/room-detail/index?roomId=${id}` });
      return;
    } catch (error) {
      // 已经是成员则直接跳详情
      if (error instanceof HttpError && error.statusCode === 400) {
        try {
          const membership = await checkMembership({ invite_code: inviteCodeRef.value.toUpperCase() });
          if (membership.is_member) {
            uni.redirectTo({ url: `/pages/room-detail/index?roomId=${membership.room.id}` });
            return;
          }
        } catch (e) {
          console.error('成员关系兜底检查失败:', e);
        }
      }
      console.error('邀请加入失败:', error);
      uni.showToast({ title: '加入失败，请重试', icon: 'none' });
    }
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



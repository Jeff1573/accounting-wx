/**
 * 邀请加入流程复用
 */

import { checkMembership, getRooms, joinRoom } from '@/api/room';
import { HttpError } from '@/utils/request';
import { useUserStore } from '@/stores/user';

export interface InviteContext {
  inviteCode: string;
  invitedRoomId?: number;
}

export async function handleInviteWhenLoggedIn(ctx: InviteContext): Promise<boolean> {
  const userStore = useUserStore();
  try {
    uni.showLoading({ title: '加载中...' });
    const membership = await checkMembership({ invite_code: ctx.inviteCode.toUpperCase() });
    if (membership.is_member) {
      // 已是成员，直接进入房间
      userStore.setPostLoginRedirect(null);
      uni.redirectTo({ url: `/pages/room-detail/index?roomId=${membership.room.id}` });
      return true;
    }
    
    // 不是成员，尝试加入房间
    try {
      const { room } = await joinRoom({ invite_code: ctx.inviteCode.toUpperCase() });
      userStore.setPostLoginRedirect(null);
      uni.redirectTo({ url: `/pages/room-detail/index?roomId=${room.id}` });
      return true;
    } catch (joinError) {
      // 加入失败，显示错误提示
      if (joinError instanceof HttpError) {
        uni.showToast({ title: joinError.message || '加入房间失败', icon: 'none' });
      } else {
        uni.showToast({ title: '加入房间失败，请重试', icon: 'none' });
      }
      // 回退到房间列表
      userStore.setPostLoginRedirect(null);
      const list = await getRooms();
      if (list.rooms.length > 0) {
        uni.redirectTo({ url: `/pages/room-detail/index?roomId=${list.rooms[0].id}` });
      } else {
        uni.switchTab({ url: '/pages/rooms/index' });
      }
      return false;
    }
  } catch (e) {
    // 检查成员身份失败，回退到房间页
    console.error('检查成员身份失败:', e);
    uni.showToast({ title: '加载失败，请重试', icon: 'none' });
    userStore.setPostLoginRedirect(null);
    uni.switchTab({ url: '/pages/rooms/index' });
    return false;
  } finally {
    uni.hideLoading();
  }
}

export async function confirmJoinAfterLogin(ctx: InviteContext): Promise<boolean> {
  const userStore = useUserStore();
  try {
    const { room } = await joinRoom({ invite_code: ctx.inviteCode.toUpperCase() });
    const id = ctx.invitedRoomId || room.id;
    userStore.setPostLoginRedirect(null);
    uni.reLaunch({ url: `/pages/room-detail/index?roomId=${id}` });
    return true;
  } catch (error) {
    if (error instanceof HttpError && error.statusCode === 400) {
      try {
        const membership = await checkMembership({ invite_code: ctx.inviteCode.toUpperCase() });
        if (membership.is_member) {
          userStore.setPostLoginRedirect(null);
          uni.reLaunch({ url: `/pages/room-detail/index?roomId=${membership.room.id}` });
          return true;
        }
      } catch {}
    }
    uni.showToast({ title: '加入失败，请重试', icon: 'none' });
    userStore.setPostLoginRedirect(null);
    return false;
  }
}



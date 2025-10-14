/**
 * 邀请加入流程复用
 */

import { checkMembership, getRooms, joinRoom } from '@/api/room';
import { HttpError } from '@/utils/request';

export interface InviteContext {
  inviteCode: string;
  invitedRoomId?: number;
}

export async function handleInviteWhenLoggedIn(ctx: InviteContext): Promise<boolean> {
  try {
    uni.showLoading({ title: '加载中...' });
    const membership = await checkMembership({ invite_code: ctx.inviteCode.toUpperCase() });
    if (membership.is_member) {
      uni.redirectTo({ url: `/pages/room-detail/index?roomId=${membership.room.id}` });
      return true;
    }
    const list = await getRooms();
    if (list.rooms.length > 0) {
      uni.redirectTo({ url: `/pages/room-detail/index?roomId=${list.rooms[0].id}` });
    } else {
      uni.switchTab({ url: '/pages/rooms/index' });
    }
    return true;
  } catch (e) {
    // 失败则回退到房间页
    uni.switchTab({ url: '/pages/rooms/index' });
    return false;
  } finally {
    uni.hideLoading();
  }
}

export async function confirmJoinAfterLogin(ctx: InviteContext): Promise<boolean> {
  try {
    const { room } = await joinRoom({ invite_code: ctx.inviteCode.toUpperCase() });
    const id = ctx.invitedRoomId || room.id;
    uni.redirectTo({ url: `/pages/room-detail/index?roomId=${id}` });
    return true;
  } catch (error) {
    if (error instanceof HttpError && error.statusCode === 400) {
      try {
        const membership = await checkMembership({ invite_code: ctx.inviteCode.toUpperCase() });
        if (membership.is_member) {
          uni.redirectTo({ url: `/pages/room-detail/index?roomId=${membership.room.id}` });
          return true;
        }
      } catch {}
    }
    uni.showToast({ title: '加入失败，请重试', icon: 'none' });
    return false;
  }
}



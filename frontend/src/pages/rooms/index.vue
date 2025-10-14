<template>
  <view class="rooms-container">
    <view class="header">
      <view class="user-info">
        <image class="avatar" :src="userStore.userInfo?.avatar || '/static/logo.png'" mode="aspectFill"></image>
        <text class="nickname">{{ userStore.userInfo?.nickname || '用户' }}</text>
      </view>
    </view>

    <view class="room-list">
      <view v-if="rooms.length === 0" class="empty-state">
        <text class="empty-text">还没有房间</text>
        <text class="empty-hint">创建或加入一个房间开始记账吧</text>
      </view>

      <view 
        v-for="room in rooms" 
        :key="room.id" 
        class="room-card"
        @tap="goToRoomDetail(room.id)"
      >
        <view class="room-header">
          <text class="room-name">{{ room.name }}</text>
          <text class="member-count">{{ room.member_count }} 人</text>
        </view>
        <view class="room-footer">
          <text class="invite-code">邀请码: {{ room.invite_code }}</text>
          <text class="join-time">{{ formatDate(room.joined_at || '', 'date') }}</text>
        </view>
      </view>
    </view>

    <view class="action-buttons">
      <button class="action-btn create-btn" @click="handleQuickCreate">
        创建房间
      </button>
      <button class="action-btn join-btn" @click="showJoinDialog">
        加入房间
      </button>
    </view>

    <!-- 创建房间弹窗 -->
    <view v-if="createDialogVisible" class="modal-mask" @tap="hideCreateDialog">
      <view class="modal-content" @tap.stop>
        <view class="modal-title">创建房间</view>
        <input 
          class="modal-input" 
          v-model="roomName" 
          placeholder="请输入房间名称"
          maxlength="20"
        />
        <view class="modal-buttons">
          <button class="modal-btn cancel-btn" @click="hideCreateDialog">取消</button>
          <button class="modal-btn confirm-btn" @click="handleCreateRoom">确定</button>
        </view>
      </view>
    </view>

    <!-- 加入房间弹窗 -->
    <view v-if="joinDialogVisible" class="modal-mask" @tap="hideJoinDialog">
      <view class="modal-content" @tap.stop>
        <view class="modal-title">加入房间</view>
        <input 
          class="modal-input" 
          v-model="inviteCode" 
          placeholder="请输入邀请码"
          maxlength="6"
          :focus="joinInputFocus"
        />
        <view class="modal-buttons">
          <button class="modal-btn cancel-btn" @click="hideJoinDialog">取消</button>
          <button class="modal-btn confirm-btn" @click="handleJoinRoom">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { getRooms, createRoom, joinRoom } from '@/api/room';
import type { Room } from '@/stores/room';
import { formatDate } from '@/utils/format';
import { useAuthGuard } from '@/composables/authGuard';

const userStore = useUserStore();
const rooms = ref<Room[]>([]);
const roomName = ref('');
const inviteCode = ref('');
const createDialogVisible = ref(false);
const joinDialogVisible = ref(false);
const joinInputFocus = ref(false);

onLoad(async (options: any) => {
  const ensureAuth = useAuthGuard({ requireLogin: true, validateStatusTTLMs: 5 * 60 * 1000 });
  const ok = await ensureAuth();
  if (!ok) return;
  loadRooms();
});

// 页面重新显示时刷新（从详情/退出返回时触发）
onShow(async () => {
  if (!userStore.isLoggedIn) return;
  loadRooms();
});

/**
 * 加载房间列表
 */
async function loadRooms() {
  try {
    const result = await getRooms();
    rooms.value = result.rooms;
  } catch (error) {
    console.error('加载房间列表失败:', error);
  }
}

/**
 * 快速创建房间（随机名称）并跳转详情
 */
async function handleQuickCreate() {
  try {
    uni.showLoading({ title: '创建中...' });
    const room = await createRoom();
    uni.hideLoading();
    uni.showToast({ title: '创建成功', icon: 'success' });
    // 跳转到新房间详情
    nextTick(() => {
      goToRoomDetail(room.id);
    })
  } catch (error) {
    uni.hideLoading();
    console.error('创建房间失败:', error);
  }
}

// 保留弹窗创建逻辑（如需手动命名时可使用）
function showCreateDialog() {
  roomName.value = '';
  createDialogVisible.value = true;
}

function hideCreateDialog() {
  createDialogVisible.value = false;
}

/**
 * 创建房间
 */
async function handleCreateRoom() {
  if (!roomName.value.trim()) {
    uni.showToast({
      title: '请输入房间名称',
      icon: 'none'
    });
    return;
  }

  try {
    uni.showLoading({ title: '创建中...' });
    await createRoom({ name: roomName.value.trim() });
    uni.hideLoading();
    
    uni.showToast({
      title: '创建成功',
      icon: 'success'
    });
    
    hideCreateDialog();
    loadRooms();
  } catch (error) {
    uni.hideLoading();
    console.error('创建房间失败:', error);
  }
}

/**
 * 显示加入房间弹窗
 */
function showJoinDialog() {
  inviteCode.value = '';
  joinDialogVisible.value = true;
  joinInputFocus.value = false;
  nextTick(() => {
    joinInputFocus.value = true;
  });
}

/**
 * 隐藏加入房间弹窗
 */
function hideJoinDialog() {
  joinDialogVisible.value = false;
  joinInputFocus.value = false;
}

/**
 * 加入房间
 */
async function handleJoinRoom() {
  if (!inviteCode.value.trim()) {
    uni.showToast({
      title: '请输入邀请码',
      icon: 'none'
    });
    return;
  }

  try {
    uni.showLoading({ title: '加入中...' });
    const { room } = await joinRoom({ invite_code: inviteCode.value.trim().toUpperCase() });
    uni.hideLoading();

    uni.showToast({
      title: '加入成功',
      icon: 'success'
    });

    hideJoinDialog();

    uni.navigateTo({
      url: `/pages/room-detail/index?roomId=${room.id}`
    });
  } catch (error) {
    uni.hideLoading();
    uni.showToast({
      title: '加入失败，请重试',
      icon: 'none'
    });
    console.error('加入房间失败:', error);
  }
}

/**
 * 跳转到房间详情
 */
function goToRoomDetail(roomId: number) {
  try { uni.setStorageSync('lastRoomId', String(roomId)); } catch {}
  uni.reLaunch({
    url: `/pages/room-detail/index?roomId=${roomId}`,
  });
}

/**
 * 下拉刷新
 */
onPullDownRefresh(() => {
  loadRooms().finally(() => {
    uni.stopPullDownRefresh();
  });
});
</script>

<style scoped>
.rooms-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 180rpx;
}

.header {
  background: #07C160;
  padding: 40rpx 30rpx;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-right: 24rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
}

.nickname {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
}

.room-list {
  padding: 30rpx;
}

.empty-state {
  text-align: center;
  padding: 120rpx 0;
}

.empty-text {
  display: block;
  font-size: 32rpx;
  color: #999999;
  margin-bottom: 20rpx;
}

.empty-hint {
  display: block;
  font-size: 28rpx;
  color: #cccccc;
}

.room-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.room-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.member-count {
  font-size: 26rpx;
  color: #999999;
}

.room-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.invite-code {
  font-size: 24rpx;
  color: #07C160;
}

.join-time {
  font-size: 24rpx;
  color: #999999;
}

.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  padding: 20rpx 30rpx;
  background: #ffffff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.action-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
}

.action-btn::after {
  border: none;
}

.create-btn {
  background: #07C160;
  color: #ffffff;
  margin-right: 20rpx;
}

.join-btn {
  background: #ffffff;
  color: #07C160;
  border: 2rpx solid #07C160;
}

/* 弹窗样式 */
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

.modal-content {
  width: 600rpx;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx;
}

.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  text-align: center;
  margin-bottom: 40rpx;
}

.modal-input {
  /* width: 100%; */
  height: 88rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  margin-bottom: 40rpx;
}

.modal-buttons {
  display: flex;
  justify-content: space-between;
}

.modal-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
  border: none;
}

.modal-btn::after {
  border: none;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666666;
  margin-right: 20rpx;
}

.confirm-btn {
  background: #07C160;
  color: #ffffff;
}
</style>



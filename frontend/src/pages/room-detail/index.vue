<template>
  <view class="room-detail-container">
    <!-- 房间头部信息 -->
    <view class="room-header card">
      <view class="room-info">
        <text class="room-name">{{ room?.name }}</text>
        <view class="invite-row">
          <text class="invite-label">邀请码:</text>
          <text class="invite-code">{{ room?.invite_code }}</text>
          <button class="share-btn" size="mini" open-type="share">分享</button>
        </view>
      </view>
    </view>

    <!-- 成员列表 -->
    <view class="members-section">
      <view class="section-title">成员余额</view>
      <view class="members-grid">
        <view 
          v-for="member in members" 
          :key="member.id" 
          class="member-card"
          @tap="selectMemberForTransaction(member)"
        >
          <image class="member-avatar" :src="member.avatar" mode="aspectFill"></image>
          <text class="member-name">{{ member.display_name }}</text>
          <text :class="['member-balance', getBalanceClass(member.balance)]">
            {{ formatBalance(member.balance) }}
          </text>
        </view>
      </view>
    </view>

    <!-- 交易记录 -->
    <view class="transactions-section">
      <view class="section-title">交易记录</view>
      
      <view v-if="transactions.length === 0" class="empty-transactions">
        <text class="empty-text">暂无交易记录</text>
      </view>

      <view v-else class="transaction-list">
        <view 
          v-for="transaction in transactions" 
          :key="transaction.id" 
          class="transaction-item"
        >
          <view class="transaction-users">
            <image class="user-avatar" :src="transaction.payer.avatar" mode="aspectFill"></image>
            <text class="user-name">{{ transaction.payer.nickname }}</text>
            <text class="arrow">→</text>
            <image class="user-avatar" :src="transaction.payee.avatar" mode="aspectFill"></image>
            <text class="user-name">{{ transaction.payee.nickname }}</text>
          </view>
          <view class="transaction-info">
            <text class="transaction-amount">¥{{ formatAmount(transaction.amount) }}</text>
            <text class="transaction-time">{{ formatDate(transaction.created_at, 'datetime') }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 浮动按钮 -->
    <view class="fab" @tap="showMemberSelector">
      <text class="fab-icon">+</text>
    </view>

    <!-- 选择成员弹窗 -->
    <view v-if="memberSelectorVisible" class="modal-mask" @tap="hideMemberSelector">
      <view class="member-selector" @tap.stop>
        <view class="selector-title">选择收款人</view>
        <view class="selector-list">
          <view 
            v-for="member in otherMembers" 
            :key="member.id" 
            class="selector-item"
            @tap="selectPayee(member)"
          >
            <image class="selector-avatar" :src="member.avatar" mode="aspectFill"></image>
            <text class="selector-name">{{ member.display_name }}</text>
          </view>
        </view>
        <button class="selector-cancel" @click="hideMemberSelector">取消</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad, onPullDownRefresh, onShareAppMessage } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { useRoomStore } from '@/stores/room';
import { getRoomDetail } from '@/api/room';
import { getTransactions } from '@/api/transaction';
import type { Room, RoomMember, Transaction } from '@/stores/room';
import { formatAmount, formatBalance, formatDate, getBalanceClass } from '@/utils/format';

const userStore = useUserStore();
const roomStore = useRoomStore();

const roomId = ref<number>(0);
const room = ref<Room | null>(null);
const members = ref<RoomMember[]>([]);
const transactions = ref<Transaction[]>([]);
const memberSelectorVisible = ref(false);

/**
 * 其他成员（排除自己）
 */
const otherMembers = computed(() => {
  return members.value.filter(m => m.user_id !== userStore.userInfo?.id);
});

onLoad((options: any) => {
  roomId.value = Number(options.roomId);
  loadRoomDetail();
});

/**
 * 加载房间详情
 */
async function loadRoomDetail() {
  try {
    uni.showLoading({ title: '加载中...' });
    
    // 加载房间信息和成员
    const roomResult = await getRoomDetail(roomId.value);
    room.value = roomResult.room;
    members.value = roomResult.members;
    roomStore.setCurrentRoom(roomResult.room);
    roomStore.setMembers(roomResult.members);
    
    // 加载交易记录
    const transResult = await getTransactions(roomId.value);
    transactions.value = transResult.transactions;
    roomStore.setTransactions(transResult.transactions);
    
    uni.hideLoading();
  } catch (error) {
    uni.hideLoading();
    console.error('加载房间详情失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  }
}

/**
 * 显示成员选择器
 */
function showMemberSelector() {
  if (otherMembers.value.length === 0) {
    uni.showToast({
      title: '房间内没有其他成员',
      icon: 'none'
    });
    return;
  }
  memberSelectorVisible.value = true;
}

/**
 * 隐藏成员选择器
 */
function hideMemberSelector() {
  memberSelectorVisible.value = false;
}

/**
 * 选择收款人
 */
function selectPayee(member: RoomMember) {
  hideMemberSelector();
  goToTransaction(member);
}

/**
 * 点击成员卡片进行转账
 */
function selectMemberForTransaction(member: RoomMember) {
  if (member.user_id === userStore.userInfo?.id) {
    uni.showToast({
      title: '不能给自己转账',
      icon: 'none'
    });
    return;
  }
  goToTransaction(member);
}

/**
 * 跳转到转账页面
 */
function goToTransaction(payee: RoomMember) {
  uni.navigateTo({
    url: `/pages/transaction/index?roomId=${roomId.value}&payeeId=${payee.user_id}&payeeName=${payee.display_name}`
  });
}

/**
 * 下拉刷新
 */
onPullDownRefresh(() => {
  loadRoomDetail().finally(() => {
    uni.stopPullDownRefresh();
  });
});

/**
 * 配置微信分享
 */
onShareAppMessage(() => {
  return {
    title: `${userStore.userInfo?.nickname} 邀请你加入「${room.value?.name}」`,
    path: `/pages/rooms/index?inviteCode=${room.value?.invite_code}`,
    imageUrl: '' // 可选：自定义分享图片
  };
});
</script>

<style scoped>
.room-detail-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
  padding-bottom: 120rpx;
}

.room-header {
  margin-bottom: 20rpx;
}

.room-info {
  padding: 10rpx 0;
}

.room-name {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
}

.invite-row {
  display: flex;
  align-items: center;
}

.invite-label {
  font-size: 26rpx;
  color: #999999;
  margin-right: 12rpx;
}

.invite-code {
  font-size: 28rpx;
  color: #07C160;
  font-weight: bold;
  margin-right: 20rpx;
}

.share-btn {
  background: #07C160;
  color: #ffffff;
  border: none;
  padding: 8rpx 24rpx;
}

.share-btn::after {
  border: none;
}

.members-section {
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
  padding: 0 10rpx;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.member-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.member-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-bottom: 16rpx;
}

.member-name {
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 12rpx;
}

.member-balance {
  font-size: 32rpx;
  font-weight: bold;
}

.transactions-section {
  margin-bottom: 20rpx;
}

.empty-transactions {
  text-align: center;
  padding: 80rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

.transaction-list {
  background: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
}

.transaction-item {
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-users {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.user-avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  margin-right: 12rpx;
}

.user-name {
  font-size: 28rpx;
  color: #333333;
}

.arrow {
  margin: 0 12rpx;
  font-size: 28rpx;
  color: #999999;
}

.transaction-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.transaction-amount {
  font-size: 32rpx;
  font-weight: bold;
  color: #07C160;
}

.transaction-time {
  font-size: 24rpx;
  color: #999999;
}

.fab {
  position: fixed;
  right: 30rpx;
  bottom: 30rpx;
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background: #07C160;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.4);
  z-index: 100;
}

.fab-icon {
  font-size: 60rpx;
  color: #ffffff;
  font-weight: 300;
}

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
  z-index: 1000;
}

.member-selector {
  background: #ffffff;
  border-radius: 20rpx 20rpx 0 0;
  padding: 40rpx 30rpx;
  max-height: 80vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

.selector-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  text-align: center;
  margin-bottom: 30rpx;
}

.selector-list {
  max-height: 50vh;
  overflow-y: auto;
}

.selector-item {
  display: flex;
  align-items: center;
  padding: 24rpx 20rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  background: #f5f5f5;
}

.selector-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 24rpx;
}

.selector-name {
  font-size: 30rpx;
  color: #333333;
}

.selector-cancel {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #f5f5f5;
  color: #666666;
  border-radius: 44rpx;
  font-size: 30rpx;
  margin-top: 20rpx;
  border: none;
}

.selector-cancel::after {
  border: none;
}
</style>



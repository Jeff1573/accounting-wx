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
      <scroll-view class="members-scroll" scroll-x="true">
        <view class="members-row">
          <view 
            v-for="member in sortedMembers" 
            :key="member.id" 
            class="member-card"
            @tap="selectMemberForTransaction(member)"
          >
            <image class="member-avatar" :src="member.avatar" mode="aspectFill"></image>
            <view class="member-name-row">
              <text class="member-name">{{ member.display_name }}</text>
              <text v-if="room?.creator_id === member.user_id" class="owner-tag">房主</text>
            </view>
            <text :class="['member-balance', getBalanceClass(member.balance)]">
              {{ formatBalance(member.balance) }}
            </text>
          </view>
        </view>
      </scroll-view>
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

    <!-- 底部操作栏 -->
    <view class="bottom-action-bar">
      <button 
        v-if="isOwner"
        class="bar-btn bar-btn--primary" 
        :disabled="actionLoading" 
        :loading="actionLoading"
        @click="handleSettlement"
      >结账</button>
      <button 
        class="bar-btn bar-btn--danger" 
        :disabled="actionLoading" 
        @click="handleLeaveRoom"
      >退出房间</button>
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
    
    <!-- 转账输入弹窗 -->
    <view v-if="transferDialogVisible" class="modal-mask" @tap="closeTransferDialog">
      <view class="transfer-modal" @tap.stop :style="{ marginBottom: keyboardHeight > 0 ? (keyboardHeight + 20) + 'rpx' : '' }">
        <view class="transfer-title">向 {{ currentPayee?.display_name }} 转账</view>
        <view class="amount-row">
          <text class="currency">¥</text>
          <input class="amount-input" type="digit" v-model="transferAmount" placeholder="请输入金额" @input="handleAmountInput" :focus="transferInputFocus" confirm-type="done" @confirm="submitTransfer" cursor-spacing="30" />
        </view>
        <view class="actions">
          <button class="btn cancel" @tap="closeTransferDialog">取消</button>
          <button class="btn confirm" :disabled="!isAmountValid || submitting" :loading="submitting" @tap="submitTransfer">确认</button>
        </view>
      </view>
    </view>
  </view>

  <!-- 结算结果弹窗 -->
  <view v-if="settlementResultVisible" class="modal-mask">
    <view class="settlement-modal" @tap.stop>
      <view class="settlement-title">本次结算结果</view>
      <view class="settlement-list">
        <view class="settlement-item" v-for="item in settlementItems" :key="item.user_id">
          <image class="settlement-avatar" :src="item.avatar" mode="aspectFill" />
          <view class="settlement-name">{{ item.display_name }}</view>
          <view class="settlement-amount" :class="getBalanceClass(item.balance)">{{ formatBalance(item.balance) }}</view>
        </view>
      </view>
      <button class="settlement-confirm" :disabled="actionLoading" @click="confirmSettlementResult">确认</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { onLoad, onPullDownRefresh, onShareAppMessage } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { useRoomStore } from '@/stores/room';
import { getRoomDetail, leaveRoom } from '@/api/room';
import { getTransactions, createSettlement } from '@/api/transaction';
import { createTransaction } from '@/api/transaction';
import type { BalancesResponse } from '@/api/transaction';
import type { Room, RoomMember, Transaction } from '@/stores/room';
import { formatAmount, formatBalance, formatDate, getBalanceClass } from '@/utils/format';

const userStore = useUserStore();
const roomStore = useRoomStore();

const roomId = ref<number>(0);
const room = ref<Room | null>(null);
const members = ref<RoomMember[]>([]);
const transactions = ref<Transaction[]>([]);
const memberSelectorVisible = ref(false);
const actionLoading = ref(false);
const settlementResultVisible = ref(false);
const settlementItems = ref<BalancesResponse['balances']>([]);

// 转账弹窗状态
const transferDialogVisible = ref(false);
const currentPayee = ref<RoomMember | null>(null);
const transferAmount = ref<string>('');
const submitting = ref(false);
const transferInputFocus = ref(false);
const keyboardHeight = ref(0);

const isShowBottomActionBar = ref(false);
// 是否为房主
const isOwner = computed(() => !!room.value && room.value.creator_id === userStore.userInfo?.id);

/**
 * 排序后的成员（房主优先）
 */
const sortedMembers = computed(() => {
  if (!room.value) return members.value;
  const creatorId = room.value.creator_id;
  return [...members.value].sort((a, b) => {
    const aOwner = a.user_id === creatorId ? 1 : 0;
    const bOwner = b.user_id === creatorId ? 1 : 0;
    if (aOwner !== bOwner) return bOwner - aOwner; // 房主优先
    return 0;
  });
});

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
  openTransferDialog(member);
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
  openTransferDialog(member);
}

/**
 * 打开转账弹窗
 */
function openTransferDialog(payee: RoomMember) {
  currentPayee.value = payee;
  transferAmount.value = '';
  transferDialogVisible.value = true;
  transferInputFocus.value = false;
  nextTick(() => {
    transferInputFocus.value = true;
  });
}

/**
 * 关闭转账弹窗
 */
function closeTransferDialog() {
  transferDialogVisible.value = false;
  transferInputFocus.value = false;
}

/**
 * 限制金额输入格式（最多两位小数）
 */
function handleAmountInput(e: any) {
  let value = e.detail?.value ?? transferAmount.value;
  value = String(value).replace(/[^\d.]/g, '');
  const parts = value.split('.');
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('');
  }
  if (parts.length === 2 && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].substring(0, 2);
  }
  transferAmount.value = value;
}

/**
 * 金额校验
 */
const isAmountValid = computed(() => {
  const num = parseFloat(transferAmount.value);
  return !isNaN(num) && num > 0;
});

/**
 * 提交转账
 */
async function submitTransfer() {
  if (!currentPayee.value || !isAmountValid.value) return;
  try {
    submitting.value = true;
    uni.showLoading({ title: '提交中...' });
    await createTransaction(roomId.value, {
      payee_id: currentPayee.value.user_id,
      amount: parseFloat(transferAmount.value)
    });
    uni.hideLoading();
    uni.showToast({ title: '转账成功', icon: 'success' });
    transferDialogVisible.value = false;
    transferInputFocus.value = false;
    await loadRoomDetail();
  } catch (error) {
    uni.hideLoading();
    console.error('转账失败:', error);
    uni.showToast({ title: '转账失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

// 监听键盘高度，避免弹窗被遮挡（小程序端支持）
// @ts-ignore
uni.onKeyboardHeightChange?.((res: any) => {
  // res.height 单位 px；这里简单转换为 rpx 近似：乘以 2（以 750 设计宽为基准）
  keyboardHeight.value = res?.height ? res.height * 2 : 0;
});

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
    path: `/pages/entry/index?inviteCode=${room.value?.invite_code}&roomId=${room.value?.id}`,
    imageUrl: '' // 可选：自定义分享图片
  };
});

/**
 * 退出房间（房主 -> 解散房间）
 */
async function handleLeaveRoom() {
  if (!room.value) return;
  const owner = isOwner;
  const tip = owner ? '将归档并解散该房间，操作不可撤销，确定继续？' : '确定要退出该房间吗？';
  uni.showModal({
    title: '确认',
    content: tip,
    success: async (res) => {
      if (!res.confirm) return;
      try {
        actionLoading.value = true;
        uni.showLoading({ title: '处理中...' });
        await leaveRoom(roomId.value);
        uni.hideLoading();
        uni.showToast({ title: owner ? '房间已解散' : '退出成功', icon: 'success' });
        setTimeout(() => {
          uni.switchTab({ url: '/pages/rooms/index' });
        }, 600);
      } catch (error: any) {
        uni.hideLoading();
        const msg = (error && error.message) || '操作失败';
        uni.showToast({ title: msg, icon: 'none' });
      } finally {
        actionLoading.value = false;
      }
    }
  });
}

/**
 * 结账（房主）
 */
async function handleSettlement() {
  if (!room.value) return;
  if (!isOwner) {
    uni.showToast({ title: '仅房主可结账', icon: 'none' });
    return;
  }
  try {
    actionLoading.value = true;
    uni.showLoading({ title: '结账中...' });
    const result = await createSettlement(roomId.value);
    settlementItems.value = (result && result.items) ? result.items : [];
    settlementResultVisible.value = true;
    uni.hideLoading();
  } catch (error: any) {
    uni.hideLoading();
    const msg = (error && error.message) || '结账失败';
    uni.showToast({ title: msg, icon: 'none' });
  } finally {
    actionLoading.value = false;
  }
}

/**
 * 确认结算结果 → 解散房间并返回列表
 */
async function confirmSettlementResult() {
  if (!room.value) return;
  try {
    actionLoading.value = true;
    uni.showLoading({ title: '处理中...' });
    await leaveRoom(roomId.value);
    settlementResultVisible.value = false;
    uni.hideLoading();
    uni.showToast({ title: '已结账并解散房间', icon: 'success' });
    setTimeout(() => {
      uni.switchTab({ url: '/pages/rooms/index' });
    }, 600);
  } catch (error: any) {
    uni.hideLoading();
    const msg = (error && error.message) || '操作失败';
    uni.showToast({ title: msg, icon: 'none' });
  } finally {
    actionLoading.value = false;
  }
}
</script>

<style scoped>
.room-detail-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
  padding-bottom: 220rpx;
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

.actions-row {
  display: flex;
  justify-content: space-between;
  padding: 0 10rpx 16rpx;
}

.action-settle {
  background: #07C160;
  color: #ffffff;
  border: none;
}

.action-settle::after {
  border: none;
}

.action-leave {
  background: #f5f5f5;
  color: #ee0a24;
  border: none;
}

.action-leave::after {
  border: none;
}

.members-scroll {
  white-space: nowrap;
  width: 100%;
}

.members-row {
  display: flex;
  flex-direction: row;
}

.member-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  width: 25%;
  min-width: 25%;
}

/* 新增：成员卡片横向间距与两端留白 */
.members-row { padding: 0 16rpx; }
.member-card { margin-right: 16rpx; }
.member-card:last-child { margin-right: 0; }

.member-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-bottom: 16rpx;
}

.member-name {
  font-size: 28rpx;
  color: #333333;
}

.member-name-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin: 8rpx 0 12rpx;
}

.owner-tag {
  font-size: 22rpx;
  color: #07C160;
  background: rgba(7, 193, 96, 0.1);
  border: 1rpx solid #07C160;
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
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
  bottom: 180rpx;
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

/* 底部操作栏 */
.bottom-action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -6rpx 18rpx rgba(0, 0, 0, 0.06);
  display: flex;
  gap: 20rpx;
  z-index: 95;
}

.bar-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  border: none;
}

.bar-btn::after {
  border: none;
}

.bar-btn--primary {
  background: #07C160;
  color: #ffffff;
}

.bar-btn--danger {
  background: #ffecec;
  color: #ee0a24;
}

/* 结算结果弹窗样式 */
.settlement-modal {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  width: 86%;
}

.settlement-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  text-align: center;
  margin-bottom: 20rpx;
}

.settlement-list {
  max-height: 50vh;
  overflow-y: auto;
}

.settlement-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.settlement-item:last-child {
  border-bottom: none;
}

.settlement-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.settlement-name {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
}

.settlement-amount {
  font-size: 30rpx;
  font-weight: bold;
}

.settlement-confirm {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #07C160;
  color: #ffffff;
  border-radius: 44rpx;
  font-size: 30rpx;
  margin-top: 30rpx;
  border: none;
}

.settlement-confirm::after {
  border: none;
}

/* 转账输入弹窗样式 */
.transfer-modal {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  width: 86%;
  box-sizing: border-box;
}

.transfer-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  text-align: center;
}

.amount-row {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 32rpx 0;
}

.currency {
  font-size: 44rpx;
  font-weight: 600;
  color: #333333;
  margin-right: 12rpx;
}

.amount-input {
  font-size: 44rpx;
  text-align: center;
  width: 400rpx;
  border-bottom: 1rpx solid #eeeeee;
  padding: 10rpx 0;
}

.actions {
  display: flex;
  gap: 16rpx;
}

.btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  border: none;
}

.btn::after {
  border: none;
}

.btn.cancel {
  background: #f5f5f5;
  color: #666666;
}

.btn.confirm {
  background: #07C160;
  color: #ffffff;
}

.btn.confirm:disabled {
  background: #cccccc;
}
</style>



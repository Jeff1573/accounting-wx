<template>
  <view class="transaction-item">
    <view class="users">
      <image class="avatar" :src="payer.avatar" mode="aspectFill"></image>
      <text class="name">{{ payer.nickname }}</text>
      <text class="arrow">→</text>
      <image class="avatar" :src="payee.avatar" mode="aspectFill"></image>
      <text class="name">{{ payee.nickname }}</text>
    </view>
    <view class="info">
      <text class="amount">¥{{ amount }}</text>
      <text class="time">{{ time }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 交易记录项组件
 * 
 * 显示单条交易记录
 */

interface User {
  nickname: string;
  avatar: string;
}

interface Props {
  payer: User;
  payee: User;
  amount: string;
  time: string;
}

defineProps<Props>();
</script>

<style scoped>
.transaction-item {
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.transaction-item:last-child {
  border-bottom: none;
}

.users {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  margin-right: 12rpx;
}

.name {
  font-size: 28rpx;
  color: #333333;
}

.arrow {
  margin: 0 12rpx;
  font-size: 28rpx;
  color: #999999;
}

.info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount {
  font-size: 32rpx;
  font-weight: bold;
  color: #07C160;
}

.time {
  font-size: 24rpx;
  color: #999999;
}
</style>



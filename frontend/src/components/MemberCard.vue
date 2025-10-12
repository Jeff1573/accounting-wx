<template>
  <view class="member-card" @tap="handleClick">
    <image class="avatar" :src="avatar" mode="aspectFill"></image>
    <text class="name">{{ name }}</text>
    <text :class="['balance', balanceClass]">{{ balanceText }}</text>
  </view>
</template>

<script setup lang="ts">
/**
 * 成员卡片组件
 * 
 * 显示成员头像、昵称和余额
 */

import { computed } from 'vue';
import { formatBalance, getBalanceClass } from '@/utils/format';

interface Props {
  avatar: string;
  name: string;
  balance: string | number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  click: [];
}>();

/**
 * 余额文本
 */
const balanceText = computed(() => formatBalance(props.balance));

/**
 * 余额样式类
 */
const balanceClass = computed(() => getBalanceClass(props.balance));

/**
 * 处理点击事件
 */
function handleClick() {
  emit('click');
}
</script>

<style scoped>
.member-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-bottom: 16rpx;
}

.name {
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 12rpx;
}

.balance {
  font-size: 32rpx;
  font-weight: bold;
}
</style>



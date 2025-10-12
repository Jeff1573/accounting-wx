<template>
  <view class="transaction-container">
    <view class="transaction-content">
      <!-- 收款人信息 -->
      <view class="payee-info card">
        <text class="label">收款人</text>
        <text class="payee-name">{{ payeeName }}</text>
      </view>

      <!-- 金额输入 -->
      <view class="amount-input card">
        <text class="currency">¥</text>
        <input 
          class="amount-value" 
          v-model="amount" 
          type="digit"
          placeholder="0.00"
          @input="handleAmountInput"
        />
      </view>

      <!-- 快捷金额 -->
      <view class="quick-amounts">
        <view 
          v-for="quickAmount in quickAmounts" 
          :key="quickAmount" 
          class="quick-amount-btn"
          @tap="setAmount(quickAmount)"
        >
          <text>{{ quickAmount }}</text>
        </view>
      </view>

      <!-- 提交按钮 -->
      <button 
        class="submit-btn" 
        :disabled="!isAmountValid || submitting"
        @tap="handleSubmit"
      >
        <text v-if="!submitting">确认转账</text>
        <text v-else>提交中...</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { useRoomStore } from '@/stores/room';
import { createTransaction } from '@/api/transaction';

const userStore = useUserStore();
const roomStore = useRoomStore();

const roomId = ref<number>(0);
const payeeId = ref<number>(0);
const payeeName = ref<string>('');
const amount = ref<string>('');
const submitting = ref(false);

const quickAmounts = [10, 20, 50, 100, 200, 500];

/**
 * 金额是否有效
 */
const isAmountValid = computed(() => {
  const num = parseFloat(amount.value);
  return !isNaN(num) && num > 0;
});

onLoad((options: any) => {
  roomId.value = Number(options.roomId);
  payeeId.value = Number(options.payeeId);
  payeeName.value = options.payeeName || '';
});

/**
 * 处理金额输入
 */
function handleAmountInput(e: any) {
  let value = e.detail.value;
  
  // 只允许数字和一个小数点
  value = value.replace(/[^\d.]/g, '');
  
  // 只保留一个小数点
  const parts = value.split('.');
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // 小数点后最多两位
  if (parts.length === 2 && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].substring(0, 2);
  }
  
  amount.value = value;
}

/**
 * 设置快捷金额
 */
function setAmount(quickAmount: number) {
  amount.value = quickAmount.toString();
}

/**
 * 提交转账
 */
async function handleSubmit() {
  if (!isAmountValid.value) {
    return;
  }

  try {
    submitting.value = true;
    uni.showLoading({ title: '提交中...' });

    await createTransaction(roomId.value, {
      payee_id: payeeId.value,
      amount: parseFloat(amount.value)
    });

    uni.hideLoading();
    uni.showToast({
      title: '转账成功',
      icon: 'success'
    });

    // 延迟返回上一页
    setTimeout(() => {
      uni.navigateBack();
    }, 1000);

  } catch (error) {
    uni.hideLoading();
    submitting.value = false;
    console.error('转账失败:', error);
  }
}
</script>

<style scoped>
.transaction-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40rpx;
}

.transaction-content {
  width: 100%;
}

.payee-info {
  text-align: center;
  padding: 40rpx;
  margin-bottom: 40rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #999999;
  margin-bottom: 16rpx;
}

.payee-name {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #333333;
}

.amount-input {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx 40rpx;
  margin-bottom: 40rpx;
}

.currency {
  font-size: 60rpx;
  color: #333333;
  font-weight: bold;
  margin-right: 10rpx;
}

.amount-value {
  flex: 1;
  font-size: 80rpx;
  font-weight: bold;
  color: #07C160;
  text-align: left;
}

.quick-amounts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
  margin-bottom: 60rpx;
}

.quick-amount-btn {
  height: 88rpx;
  background: #ffffff;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #333333;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.quick-amount-btn:active {
  background: #f5f5f5;
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: #07C160;
  color: #ffffff;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
}

.submit-btn:disabled {
  background: #cccccc;
}

.submit-btn::after {
  border: none;
}
</style>



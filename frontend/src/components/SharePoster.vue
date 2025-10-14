<template>
  <view v-if="visible" class="poster-mask" @tap="onClose">
    <view class="poster-panel" @tap.stop>
      <view class="poster-header">
        <text class="title">{{ inviterName }} 邀请你加入</text>
        <text class="room-name">「{{ roomName }}」</text>
        <text class="invite-code">邀请码：{{ inviteCode }}</text>
      </view>
      
      <image 
        class="qrcode-img" 
        :src="wxaCodeUrl" 
        mode="aspectFit"
        @longpress="onLongPress"
      />
      
      <view class="tip">长按小程序码可保存或转发</view>
      
      <view class="actions">
        <button class="btn" @tap="onClose">关闭</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean;
  roomName: string;
  inviterName: string;
  inviteCode: string;
  wxaCodeUrl: string; // 完整 URL，小程序码
}

defineProps<Props>();
const emit = defineEmits<{ (e: 'close'): void }>();

function onClose() {
  emit('close');
}

function onLongPress() {
  uni.showToast({ title: '长按小程序码可保存或转发', icon: 'none' });
}
</script>

<style scoped>
.poster-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.poster-panel {
  width: 86vw;
  max-width: 600rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
}

.poster-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
  gap: 12rpx;
}

.title {
  font-size: 32rpx;
  color: #333;
}

.room-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #07C160;
}

.invite-code {
  font-size: 28rpx;
  color: #666;
  font-weight: bold;
}

.qrcode-img {
  width: 100%;
  height: 500rpx;
  margin: 20rpx 0;
}

.tip {
  text-align: center;
  font-size: 24rpx;
  color: #999;
  padding: 10rpx 0;
}

.actions {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: 44rpx;
  background: #f5f5f5;
  color: #333;
}

.btn::after { border: none; }
</style>

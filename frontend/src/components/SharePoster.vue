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
      />
      
      <view class="tip">保存到相册后，在微信中发送图片给好友</view>
      
      <view class="actions">
        <button class="btn btn-save" @tap="saveToAlbum" :loading="saving">保存到相册</button>
        <button class="btn" @tap="onClose">关闭</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

declare const wx: any;

interface Props {
  visible: boolean;
  roomName: string;
  inviterName: string;
  inviteCode: string;
  wxaCodeUrl: string; // 完整 URL，小程序码
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'close'): void }>();

const saving = ref(false);
const tempFilePath = ref('');

function onClose() {
  emit('close');
}

async function downloadImage() {
  if (tempFilePath.value) return tempFilePath.value;
  
  const res = await uni.downloadFile({ url: props.wxaCodeUrl });
  if (res.statusCode === 200 && res.tempFilePath) {
    tempFilePath.value = res.tempFilePath;
    return res.tempFilePath;
  }
  throw new Error('图片下载失败');
}

async function saveToAlbum() {
  try {
    saving.value = true;
    const path = await downloadImage();
    
    await uni.saveImageToPhotosAlbum({ filePath: path });
    uni.showToast({ title: '已保存到相册', icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e?.errMsg || '保存失败', icon: 'none' });
  } finally {
    saving.value = false;
  }
}

async function shareToFriend() {
  try {
    sharing.value = true;
    const path = await downloadImage();
    
    // #ifdef MP-WEIXIN
    if (typeof wx !== 'undefined' && wx.showShareImageMenu) {
      wx.showShareImageMenu({
        path,
        success: () => {
          uni.showToast({ title: '请选择转发对象', icon: 'none' });
        },
        fail: (e: any) => {
          uni.showToast({ title: '转发失败，请保存后手动分享', icon: 'none' });
        }
      });
    } else {
      uni.showToast({ title: '当前环境不支持，请保存后手动分享', icon: 'none' });
    }
    // #endif
    
    // #ifndef MP-WEIXIN
    uni.showToast({ title: '请先保存到相册再分享', icon: 'none' });
    // #endif
  } catch (e: any) {
    uni.showToast({ title: '操作失败', icon: 'none' });
  } finally {
    sharing.value = false;
  }
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

.btn-save {
  background: #07C160;
  color: #fff;
}

.btn-share {
  background: #1989fa;
  color: #fff;
}
</style>

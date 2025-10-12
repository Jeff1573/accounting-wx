<template>
  <view v-if="visible" class="modal-mask" @tap="handleCancel">
    <view class="modal-content" @tap.stop>
      <!-- 邀请图标 -->
      <view class="invite-icon">📨</view>
      
      <!-- 邀请标题 -->
      <view class="invite-title">邀请加入</view>
      
      <!-- 邀请信息 -->
      <view class="invite-message">
        {{ requireUserInfo ? '您收到了一个房间邀请' : `邀请您加入房间` }}
      </view>
      
      <!-- 邀请码显示 -->
      <view class="invite-code-display">
        <text class="invite-label">邀请码</text>
        <text class="invite-code-value">{{ inviteCode }}</text>
      </view>
      
      <!-- 未登录用户需要填写用户信息 -->
      <view v-if="requireUserInfo" class="user-info-container">
        <UserInfoForm 
          v-model="formData"
          @choose-avatar="handleChooseAvatar"
          @nickname-blur="handleNicknameBlur"
        />
      </view>
      
      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button class="action-btn cancel-btn" @tap="handleCancel">
          暂不加入
        </button>
        <button 
          class="action-btn confirm-btn" 
          @tap="handleConfirm"
          :loading="loading"
          :disabled="requireUserInfo && !isFormValid()"
        >
          {{ loading ? '加入中...' : '立即加入' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserInfoForm } from '@/utils/useUserInfoForm';
import UserInfoForm from './UserInfoForm.vue';

/**
 * Props 定义
 */
interface Props {
  visible: boolean;
  roomId: number;
  inviteCode: string;
  requireUserInfo: boolean;
  loading?: boolean;
}

/**
 * Emits 定义
 */
interface Emits {
  (e: 'confirm', data: { avatarUrl?: string; nickname?: string }): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
});

const emit = defineEmits<Emits>();

// 使用用户信息表单 composable（仅在需要时）
const {
  avatarUrl,
  nickname,
  handleChooseAvatar,
  handleNicknameBlur,
  isValid
} = useUserInfoForm();

// 表单数据双向绑定
const formData = computed({
  get: () => ({ avatarUrl: avatarUrl.value, nickname: nickname.value }),
  set: (val) => {
    avatarUrl.value = val.avatarUrl;
    nickname.value = val.nickname;
  }
});

/**
 * 检查表单是否有效
 */
function isFormValid(): boolean {
  return isValid();
}

/**
 * 处理确认加入
 */
function handleConfirm() {
  if (props.requireUserInfo) {
    // 未登录用户需要提供用户信息
    if (!isFormValid()) {
      uni.showToast({
        title: '请先选择头像并输入昵称',
        icon: 'none'
      });
      return;
    }
    emit('confirm', {
      avatarUrl: avatarUrl.value,
      nickname: nickname.value
    });
  } else {
    // 已登录用户直接加入
    emit('confirm', {});
  }
}

/**
 * 处理取消
 */
function handleCancel() {
  emit('cancel');
}
</script>

<style scoped>
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

.modal-content {
  width: 600rpx;
  max-height: 80vh;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 60rpx 40rpx;
  overflow-y: auto;
}

.invite-icon {
  font-size: 100rpx;
  text-align: center;
  margin-bottom: 30rpx;
}

.invite-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  text-align: center;
  margin-bottom: 20rpx;
}

.invite-message {
  font-size: 28rpx;
  color: #666666;
  text-align: center;
  margin-bottom: 40rpx;
}

.invite-code-display {
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.invite-label {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 12rpx;
}

.invite-code-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #07C160;
  letter-spacing: 8rpx;
}

.user-info-container {
  margin-bottom: 40rpx;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
  font-weight: bold;
  border: none;
}

.action-btn::after {
  border: none;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666666;
}

.confirm-btn {
  background: #07C160;
  color: #ffffff;
}

.confirm-btn[disabled] {
  background: rgba(7, 193, 96, 0.5);
  color: rgba(255, 255, 255, 0.8);
}
</style>


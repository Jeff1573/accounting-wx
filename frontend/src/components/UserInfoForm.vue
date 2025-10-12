<template>
  <view class="user-info-form">
    <view class="form-item">
      <text class="form-label">选择头像</text>
      <button 
        class="avatar-button" 
        open-type="chooseAvatar"
        @chooseavatar="handleChooseAvatar"
        :disabled="disabled"
      >
        <image 
          class="avatar-image" 
          :src="getAvatarUrl(modelValue.avatarUrl)" 
          mode="aspectFill"
        ></image>
        <view class="avatar-tip">点击选择</view>
      </button>
    </view>

    <view class="form-item">
      <text class="form-label">输入昵称</text>
      <input 
        type="nickname"
        class="nickname-input"
        placeholder="请输入昵称"
        :value="modelValue.nickname"
        :disabled="disabled"
        @blur="handleNicknameBlur"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { getAvatarUrl } from '@/utils/avatar';

/**
 * Props 定义
 */
interface Props {
  modelValue: {
    avatarUrl: string;
    nickname: string;
  };
  disabled?: boolean;
}

/**
 * Emits 定义
 */
interface Emits {
  (e: 'update:modelValue', value: { avatarUrl: string; nickname: string }): void;
  (e: 'chooseAvatar', event: any): void;
  (e: 'nicknameBlur', event: any): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
});

const emit = defineEmits<Emits>();

/**
 * 处理头像选择
 */
function handleChooseAvatar(e: any) {
  emit('chooseAvatar', e);
}

/**
 * 处理昵称输入
 */
function handleNicknameBlur(e: any) {
  emit('nicknameBlur', e);
}
</script>

<style scoped>
.user-info-form {
  width: 100%;
}

.form-item {
  margin-bottom: 32rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 16rpx;
  font-weight: 500;
}

/* 头像选择按钮 */
.avatar-button {
  width: 160rpx;
  height: 160rpx;
  padding: 0;
  margin: 0 auto;
  border: none;
  background: #f5f5f5;
  border-radius: 16rpx;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.avatar-button::after {
  border: none;
}

.avatar-button[disabled] {
  opacity: 0.6;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 16rpx;
}

.avatar-tip {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  font-size: 22rpx;
  text-align: center;
  padding: 8rpx 0;
}

/* 昵称输入框 */
.nickname-input {
  width: 100%;
  height: 88rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
}

.nickname-input::placeholder {
  color: #999999;
}

.nickname-input[disabled] {
  opacity: 0.6;
}
</style>


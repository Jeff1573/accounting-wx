<template>
  <view v-if="visible" class="gl-overlay">
    <view class="gl-box gl-card">
      <view class="gl-spinner"></view>
      <view class="gl-dots">
        <view class="gl-dot"></view>
        <view class="gl-dot"></view>
        <view class="gl-dot"></view>
      </view>
      <text class="gl-text">{{ text }}</text>
      
      <!-- 跳过按钮 -->
      <view v-if="showSkipButton" class="gl-skip-button" @tap="handleSkip">
        {{ skipButtonText }}
      </view>
    </view>
  </view>
  
</template>

<script setup lang="ts">
/**
 * Props 接口
 */
interface Props {
  visible: boolean;
  text?: string;
  showSkipButton?: boolean;
  skipButtonText?: string;
}

/**
 * Emits 接口
 */
interface Emits {
  (e: 'skip'): void;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  text: '加载中...',
  showSkipButton: false,
  skipButtonText: '跳过'
});

const emit = defineEmits<Emits>();

/**
 * 处理跳过按钮点击
 */
function handleSkip() {
  emit('skip');
}
</script>

<style scoped>
.gl-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  z-index: 9999;
  animation: gl-fade-in 120ms ease-out;
}

.gl-box {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 22rpx;
  padding: 20rpx 24rpx;
  background: transparent;
  /* 强制合成层，避免父容器参与重绘抖动 */
  transform: translateZ(0);
}

/* 拟态（Neumorphism）卡片：中心浮层 */
.gl-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 420rpx;
  min-height: 280rpx;
  padding: 40rpx 36rpx;
  border-radius: 28rpx;
  background: #f5f7fa;
  /* 双阴影：顶部高光 + 底部投影，形成 3D 效果 */
  box-shadow:
    -14rpx -14rpx 34rpx rgba(255, 255, 255, 0.9),
    14rpx 14rpx 34rpx rgba(0, 0, 0, 0.18);
  text-align: center;
}

.gl-spinner {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  border: 10rpx solid rgba(7, 193, 96, 0.18);
  border-top-color: #07C160;
  border-right-color: #07C160;
  box-sizing: border-box;
  animation: gl-rotate 900ms linear infinite;
  /* 避免滤镜导致的重绘，开启 GPU 合成 */
  will-change: transform;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.gl-text {
  font-size: 30rpx;
  color: #333;
  margin-top: 10rpx;
}

@keyframes gl-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes gl-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.gl-dots {
  display: flex;
  gap: 10rpx;
  margin-top: 6rpx;
  /* 固定区域高度，避免 scale 视觉抖动 */
  height: 16rpx;
}

.gl-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #07C160;
  opacity: 0.3;
  animation: gl-pulse 900ms ease-in-out infinite;
  will-change: transform, opacity;
  transform: translateZ(0);
}

.gl-dot:nth-child(2) { animation-delay: 120ms; }
.gl-dot:nth-child(3) { animation-delay: 240ms; }

@keyframes gl-pulse {
  0%, 100% { transform: scale(0.8); opacity: 0.3; }
  50% { transform: scale(1); opacity: 1; }
}

.gl-skip-button {
  margin-top: 30rpx;
  padding: 12rpx 28rpx;
  font-size: 28rpx;
  color: #07C160;
  text-decoration: underline;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s ease;
}

.gl-skip-button:active {
  opacity: 0.7;
}
</style>



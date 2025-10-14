<template>
  <view class="about-container">
    <!-- 顶部Logo区域 -->
    <view class="header-section">
      <image class="app-logo" src="/static/logo.png" mode="aspectFit"></image>
      <text class="app-title">记账小程序</text>
      <text class="version">v1.0.0</text>
    </view>

    <!-- 产品定位 -->
    <view class="section-card">
      <view class="section-title">
        <text class="title-icon">📝</text>
        <text class="title-text">产品定位</text>
      </view>
      <view class="section-content">
        <text class="content-text">
          这是一款专为朋友间AA制记账设计的小工具，帮助您和朋友轻松记录共同消费，清晰明了地管理账目。
        </text>
      </view>
    </view>

    <!-- 核心功能 -->
    <view class="section-card">
      <view class="section-title">
        <text class="title-icon">✨</text>
        <text class="title-text">核心功能</text>
      </view>
      <view class="section-content">
        <view class="feature-item">
          <text class="feature-dot">•</text>
          <text class="feature-text">多人房间记账：创建房间，邀请朋友一起记账</text>
        </view>
        <view class="feature-item">
          <text class="feature-dot">•</text>
          <text class="feature-text">实时数据同步：所有成员数据实时更新</text>
        </view>
        <view class="feature-item">
          <text class="feature-dot">•</text>
          <text class="feature-text">支出收入统计：自动计算每个人的支出和收入</text>
        </view>
        <view class="feature-item">
          <text class="feature-dot">•</text>
          <text class="feature-text">邀请码分享：通过邀请码快速加入房间</text>
        </view>
      </view>
    </view>

    <!-- 合规声明 -->
    <view class="section-card compliance-card">
      <view class="section-title">
        <text class="title-icon">⚠️</text>
        <text class="title-text">重要声明</text>
      </view>
      <view class="section-content">
        <text class="compliance-text">
          本小程序为纯记账工具，专注于帮助朋友间进行AA制记账管理。我们不涉及任何形式的赌博、资金盘、非法集资等违规行为。
        </text>
        <text class="compliance-text">
          所有记录的账目数据仅用于个人记账和分账参考，不涉及任何实际的资金流转或支付功能。
        </text>
      </view>
    </view>

    <!-- 使用场景 -->
    <view class="section-card">
      <view class="section-title">
        <text class="title-icon">💡</text>
        <text class="title-text">适用场景</text>
      </view>
      <view class="section-content">
        <view class="scene-item">
          <text class="scene-emoji">🍜</text>
          <text class="scene-text">朋友聚餐AA</text>
        </view>
        <view class="scene-item">
          <text class="scene-emoji">🏠</text>
          <text class="scene-text">合租房费记录</text>
        </view>
        <view class="scene-item">
          <text class="scene-emoji">✈️</text>
          <text class="scene-text">旅游费用分摊</text>
        </view>
        <view class="scene-item">
          <text class="scene-emoji">🎮</text>
          <text class="scene-text">活动经费管理</text>
        </view>
      </view>
    </view>

    <!-- 联系方式 -->
    <view class="section-card">
      <view class="section-title">
        <text class="title-icon">📧</text>
        <text class="title-text">联系我们</text>
      </view>
      <view class="section-content">
        <text class="contact-text">如有问题或建议，欢迎随时联系我们</text>
      </view>
    </view>

    <!-- 底部版权 -->
    <view class="footer">
      <text class="copyright">© 2025 记账小程序</text>
      <text class="copyright-sub">让记账更简单</text>
    </view>
  </view>
</template>

<script setup lang="ts">
// 关于我们页面
</script>

<style scoped>
.about-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40rpx 30rpx 60rpx;
}

/* 顶部Logo区域 */
.header-section {
  text-align: center;
  padding: 40rpx 0 60rpx;
}

.app-logo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 24rpx;
  margin-bottom: 20rpx;
}

.app-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.version {
  display: block;
  font-size: 24rpx;
  color: #999;
}

/* 卡片样式 */
.section-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.title-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.title-text {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.section-content {
  line-height: 1.8;
}

.content-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
}

/* 功能列表 */
.feature-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.feature-item:last-child {
  margin-bottom: 0;
}

.feature-dot {
  font-size: 28rpx;
  color: #07C160;
  margin-right: 12rpx;
  line-height: 1.8;
}

.feature-text {
  flex: 1;
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
}

/* 合规声明卡片 */
.compliance-card {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
  border: 2rpx solid #ffcccc;
}

.compliance-text {
  display: block;
  font-size: 28rpx;
  color: #d63031;
  line-height: 1.8;
  margin-bottom: 16rpx;
}

.compliance-text:last-child {
  margin-bottom: 0;
}

/* 使用场景 */
.scene-item {
  display: inline-flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  margin-right: 16rpx;
  margin-bottom: 16rpx;
}

.scene-emoji {
  font-size: 32rpx;
  margin-right: 8rpx;
}

.scene-text {
  font-size: 26rpx;
  color: #666;
}

/* 联系方式 */
.contact-text {
  display: block;
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
}

/* 底部版权 */
.footer {
  text-align: center;
  padding: 40rpx 0 20rpx;
}

.copyright {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.copyright-sub {
  display: block;
  font-size: 22rpx;
  color: #ccc;
}
</style>


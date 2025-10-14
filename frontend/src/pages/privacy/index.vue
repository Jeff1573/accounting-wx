<template>
  <view class="privacy-container">
    <!-- 标题 -->
    <view class="header">
      <text class="title">隐私政策</text>
      <text class="update-time">更新日期：2025年10月</text>
    </view>

    <!-- 引言 -->
    <view class="section-card">
      <view class="intro-text">
        我们非常重视您的隐私保护和个人信息安全。本隐私政策将帮助您了解我们如何收集、使用、存储和保护您的个人信息。
      </view>
    </view>

    <!-- 1. 信息收集 -->
    <view class="section-card">
      <view class="section-title">
        <text class="title-number">1.</text>
        <text class="title-text">我们收集哪些信息</text>
      </view>
      <view class="section-content">
        <text class="content-text">为了提供记账服务，我们会收集以下信息：</text>
        <view class="info-item">
          <text class="item-label">• 基本信息：</text>
          <text class="item-desc">微信昵称、头像（您可以自主选择提供）</text>
        </view>
        <view class="info-item">
          <text class="item-label">• 记账数据：</text>
          <text class="item-desc">您在使用过程中记录的账目信息，包括金额、分类、备注等</text>
        </view>
        <view class="info-item">
          <text class="item-label">• 房间信息：</text>
          <text class="item-desc">您创建或加入的房间名称、成员关系等</text>
        </view>
      </view>
    </view>

    <!-- 2. 信息使用 -->
    <view class="section-card">
      <view class="section-title">
        <text class="title-number">2.</text>
        <text class="title-text">我们如何使用您的信息</text>
      </view>
      <view class="section-content">
        <text class="content-text">您的信息仅用于以下目的：</text>
        <view class="info-item">
          <text class="item-label">• 提供记账服务：</text>
          <text class="item-desc">展示您的账目记录，帮助您进行账目管理</text>
        </view>
        <view class="info-item">
          <text class="item-label">• 多人协作：</text>
          <text class="item-desc">在房间内与其他成员共享账目信息</text>
        </view>
        <view class="info-item">
          <text class="item-label">• 数据统计：</text>
          <text class="item-desc">为您提供支出收入统计功能</text>
        </view>
        <view class="important-note">
          <text class="note-icon">⚠️</text>
          <text class="note-text">我们承诺不会将您的信息用于任何商业推广或出售给第三方</text>
        </view>
      </view>
    </view>

    <!-- 3. 信息存储 -->
    <view class="section-card">
      <view class="section-title">
        <text class="title-number">3.</text>
        <text class="title-text">我们如何存储您的信息</text>
      </view>
      <view class="section-content">
        <view class="info-item">
          <text class="item-label">• 存储位置：</text>
          <text class="item-desc">您的数据存储在安全的服务器中</text>
        </view>
        <view class="info-item">
          <text class="item-label">• 安全措施：</text>
          <text class="item-desc">我们采用加密技术保护您的数据安全</text>
        </view>
        <view class="info-item">
          <text class="item-label">• 存储期限：</text>
          <text class="item-desc">您的数据将一直保存，直到您主动删除</text>
        </view>
      </view>
    </view>

    <!-- 4. 信息共享 -->
    <view class="section-card">
      <view class="section-title">
        <text class="title-number">4.</text>
        <text class="title-text">信息共享说明</text>
      </view>
      <view class="section-content">
        <text class="content-text">您的信息仅在以下情况下会被共享：</text>
        <view class="info-item">
          <text class="item-label">• 房间内共享：</text>
          <text class="item-desc">您的昵称、头像和记账记录会在您加入的房间内对其他成员可见</text>
        </view>
        <view class="info-item">
          <text class="item-label">• 法律要求：</text>
          <text class="item-desc">在法律法规要求的情况下，我们可能需要披露您的信息</text>
        </view>
      </view>
    </view>

    <!-- 5. 您的权利 -->
    <view class="section-card">
      <view class="section-title">
        <text class="title-number">5.</text>
        <text class="title-text">您的权利</text>
      </view>
      <view class="section-content">
        <text class="content-text">您对自己的信息享有以下权利：</text>
        <view class="info-item">
          <text class="item-label">• 查看权：</text>
          <text class="item-desc">您可以随时查看自己的账目记录</text>
        </view>
        <view class="info-item">
          <text class="item-label">• 修改权：</text>
          <text class="item-desc">您可以修改自己的昵称、头像和账目信息</text>
        </view>
        <view class="info-item">
          <text class="item-label">• 删除权：</text>
          <text class="item-desc">您可以删除自己的账目记录</text>
        </view>
        <view class="info-item">
          <text class="item-label">• 退出权：</text>
          <text class="item-desc">您可以随时退出任何房间</text>
        </view>
      </view>
    </view>

    <!-- 6. 未成年人保护 -->
    <view class="section-card">
      <view class="section-title">
        <text class="title-number">6.</text>
        <text class="title-text">未成年人保护</text>
      </view>
      <view class="section-content">
        <text class="content-text">
          我们非常重视未成年人的个人信息保护。如果您是未成年人，请在监护人的陪同下使用本小程序。
        </text>
      </view>
    </view>

    <!-- 7. 政策更新 -->
    <view class="section-card">
      <view class="section-title">
        <text class="title-number">7.</text>
        <text class="title-text">隐私政策的变更</text>
      </view>
      <view class="section-content">
        <text class="content-text">
          我们可能会适时修订本隐私政策。当隐私政策发生变更时，我们会在小程序内通过适当的方式向您展示变更后的隐私政策。
        </text>
      </view>
    </view>

    <!-- 8. 联系我们 -->
    <view class="section-card">
      <view class="section-title">
        <text class="title-number">8.</text>
        <text class="title-text">联系我们</text>
      </view>
      <view class="section-content">
        <text class="content-text">
          如果您对本隐私政策有任何疑问、意见或建议，欢迎随时联系我们。
        </text>
      </view>
    </view>

    <!-- 底部 -->
    <view class="footer">
      <text class="footer-text">感谢您信任并使用我们的服务</text>
    </view>
  </view>
</template>

<script setup lang="ts">
// 隐私政策页面
</script>

<style scoped>
.privacy-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40rpx 30rpx 60rpx;
}

/* 标题区域 */
.header {
  text-align: center;
  padding: 20rpx 0 40rpx;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.update-time {
  display: block;
  font-size: 24rpx;
  color: #999;
}

/* 引言 */
.intro-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
  text-align: justify;
}

/* 卡片样式 */
.section-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

/* 章节标题 */
.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.title-number {
  font-size: 32rpx;
  font-weight: bold;
  color: #07C160;
  margin-right: 8rpx;
}

.title-text {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

/* 章节内容 */
.section-content {
  line-height: 1.8;
}

.content-text {
  display: block;
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
  margin-bottom: 16rpx;
}

/* 信息项 */
.info-item {
  margin-bottom: 20rpx;
  padding-left: 8rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.item-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  line-height: 1.8;
}

.item-desc {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
}

/* 重要提示 */
.important-note {
  display: flex;
  align-items: flex-start;
  background: #fff7e6;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-top: 20rpx;
  border-left: 4rpx solid #ffa940;
}

.note-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
  line-height: 1.8;
}

.note-text {
  flex: 1;
  font-size: 26rpx;
  color: #d46b08;
  line-height: 1.8;
}

/* 底部 */
.footer {
  text-align: center;
  padding: 40rpx 0 20rpx;
}

.footer-text {
  font-size: 24rpx;
  color: #999;
}
</style>


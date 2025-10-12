<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";

onLaunch(() => {
  console.log("App Launch");
});

onShow(() => {
  console.log("App Show");
});

onHide(() => {
  console.log("App Hide");
});
</script>

<style>
/* 全局样式 */
page {
  background-color: #f5f5f5;
}

/* 通用样式 */
.container {
  padding: 20rpx;
}

.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

/* 按钮样式 */
.btn-primary {
  background-color: #07C160;
  color: #ffffff;
  border-radius: 8rpx;
  padding: 24rpx;
  font-size: 32rpx;
  text-align: center;
}

.btn-secondary {
  background-color: #ffffff;
  color: #07C160;
  border: 2rpx solid #07C160;
  border-radius: 8rpx;
  padding: 24rpx;
  font-size: 32rpx;
  text-align: center;
}

/* 文字样式 */
.text-primary {
  color: #07C160;
}

.text-danger {
  color: #FA5151;
}

.text-muted {
  color: #999999;
}

.text-center {
  text-align: center;
}

/* 余额样式 */
.balance-positive {
  color: #07C160;
  font-weight: bold;
}

.balance-negative {
  color: #FA5151;
  font-weight: bold;
}

.balance-zero {
  color: #999999;
}
</style>

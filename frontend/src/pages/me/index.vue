<template>
    <view class="content">
      <view class="text-area">
        <text class="title">{{ title }}</text>
      </view>
    </view>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  const title = ref('我的页面')
  </script>
  
  <style>
  
  </style>
  
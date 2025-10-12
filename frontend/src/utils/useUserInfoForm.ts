/**
 * 用户信息表单 Composable
 * 
 * 封装头像上传和昵称输入逻辑，用于登录页和邀请加入流程
 */

import { ref } from 'vue';
import config from '@/config/env';

/**
 * 用户信息表单 Hook
 * 
 * @returns 响应式数据和处理方法
 */
export function useUserInfoForm() {
  const avatarUrl = ref('');
  const nickname = ref('');
  const isUploading = ref(false);

  /**
   * 处理头像选择
   * 
   * 当用户通过 button open-type="chooseAvatar" 选择头像后触发
   * 微信返回的是临时本地路径，需要立即上传到服务器
   * 
   * @param e - 选择头像事件对象
   * @param e.detail.avatarUrl - 用户选择的头像临时路径
   */
  async function handleChooseAvatar(e: any) {
    const { avatarUrl: tempPath } = e.detail;
    console.log('选择的临时头像路径:', tempPath);

    try {
      // 显示上传中提示
      isUploading.value = true;
      uni.showLoading({ title: '上传头像中...' });
      
      // 上传到后端服务器
      const uploadRes = await uni.uploadFile({
        url: `${config.API_BASE_URL}/upload/avatar`,
        filePath: tempPath,
        name: 'avatar'
      });

      console.log('上传结果:', uploadRes);

      if (uploadRes.statusCode === 200) {
        const response = JSON.parse(uploadRes.data as string);
        // 后端返回统一格式：{ code, message, data: { url } }
        if (response.code === 200 && response.data?.url) {
          // 保存服务器返回的 URL（这个 URL 所有人都能访问）
          avatarUrl.value = response.data.url;
          console.log('头像上传成功，URL:', response.data.url);
          
          uni.showToast({
            title: '头像上传成功',
            icon: 'success',
            duration: 1500
          });
        } else {
          throw new Error(response.message || '上传失败');
        }
      } else {
        throw new Error('上传失败');
      }
    } catch (error) {
      console.error('上传头像失败:', error);
      uni.showToast({
        title: '头像上传失败，请重试',
        icon: 'none',
        duration: 2000
      });
      // 清空头像
      avatarUrl.value = '';
    } finally {
      isUploading.value = false;
      uni.hideLoading();
    }
  }

  /**
   * 处理昵称输入
   * 
   * 当用户在 input type="nickname" 中输入昵称并失去焦点时触发
   * 
   * @param e - 输入框失去焦点事件对象
   * @param e.detail.value - 用户输入的昵称
   */
  function handleNicknameBlur(e: any) {
    const value = e.detail.value?.trim() || '';
    nickname.value = value;
    console.log('用户输入的昵称:', value);
  }

  /**
   * 验证表单是否已填写完整
   * 
   * @returns 是否有效
   */
  function isValid(): boolean {
    return !!avatarUrl.value && !!nickname.value;
  }

  /**
   * 重置表单
   */
  function reset() {
    avatarUrl.value = '';
    nickname.value = '';
    isUploading.value = false;
  }

  return {
    avatarUrl,
    nickname,
    isUploading,
    handleChooseAvatar,
    handleNicknameBlur,
    isValid,
    reset
  };
}


/**
 * 微信 API 工具模块
 * 
 * 提供微信登录相关的 API 调用功能
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const WX_APPID = process.env.WX_APPID || '';
const WX_SECRET = process.env.WX_SECRET || '';

/**
 * 微信登录响应接口
 */
interface WxLoginResponse {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

/**
 * 通过微信登录 code 获取用户 openid
 * 
 * @param code - 微信登录凭证
 * @returns openid 和 session_key，失败返回 null
 * 
 * @example
 * const result = await getWxOpenId('CODE_FROM_FRONTEND');
 * if (result) {
 *   console.log(result.openid);
 * }
 */
export async function getWxOpenId(code: string): Promise<{ openid: string; session_key: string } | null> {
  try {
    const url = 'https://api.weixin.qq.com/sns/jscode2session';
    const response = await axios.get<WxLoginResponse>(url, {
      params: {
        appid: WX_APPID,
        secret: WX_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const data = response.data;

    if (data.errcode) {
      console.error('微信登录失败:', data.errcode, data.errmsg);
      return null;
    }

    if (!data.openid) {
      return null;
    }

    return {
      openid: data.openid,
      session_key: data.session_key || ''
    };
  } catch (error) {
    console.error('调用微信API失败:', error);
    return null;
  }
}


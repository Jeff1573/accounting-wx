/**
 * 微信 API 工具模块
 *
 * 提供微信登录、获取 access_token 以及生成小程序码的能力
 */

import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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

/**
 * access_token 缓存（内存）
 */
let cachedAccessToken: string | null = null;
let accessTokenExpiresAt = 0; // epoch milliseconds

/**
 * 获取微信小程序全局 access_token，并进行内存缓存。
 *
 * 使用稳定版 stable_token API（推荐）
 * 参考：https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/mp-access-token/getStableAccessToken.html
 *
 * 有效期通常为 7200 秒，这里在到期前 120 秒强制刷新。
 *
 * @returns 有效的 access_token 字符串
 * @throws 当调用失败时抛出 Error
 */
export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && now < accessTokenExpiresAt - 120_000) {
    return cachedAccessToken;
  }

  // 使用稳定版 access_token API
  const url = 'https://api.weixin.qq.com/cgi-bin/stable_token';
  const resp = await axios.post(url, {
    grant_type: 'client_credential',
    appid: WX_APPID,
    secret: WX_SECRET,
    force_refresh: false // 不强制刷新，优先使用缓存
  });

  if (resp.data.errcode) {
    throw new Error(`获取 access_token 失败: ${resp.data.errcode} ${resp.data.errmsg}`);
  }

  const token: string = resp.data.access_token;
  const expiresIn: number = resp.data.expires_in || 7200; // seconds
  cachedAccessToken = token;
  accessTokenExpiresAt = now + expiresIn * 1000;
  return token;
}

/**
 * 生成（或复用缓存）小程序码文件路径
 */
function ensureQrcodeDir(): string {
  const dir = path.join(__dirname, '../../uploads/qrcodes');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * 校验 scene 参数，仅允许 32 长度内的字母、数字、下划线与连接符
 */
export function validateScene(scene: string): boolean {
  if (!scene) return false;
  if (scene.length > 32) return false;
  return /^[A-Za-z0-9_\-]+$/.test(scene);
}

export interface CreateWxaCodeOptions {
  scene: string;
  page: string; // e.g., 'pages/entry/index'
  width?: number; // default 430
}

/**
 * 使用微信接口生成「无限制小程序码」（getwxacodeunlimit），并保存为本地文件。
 * 如文件已存在则直接复用，避免重复消耗额度。
 *
 * 参考：
 * https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/qrcode-link/qr-code/getUnlimitedQRCode.html
 *
 * @param options - 生成参数
 * @returns 生成后的本地可访问 URL（通过 /api/uploads 静态服务暴露）
 */
export async function createWxaCodeUnlimit(options: CreateWxaCodeOptions): Promise<string> {
  const { scene, page, width = 430 } = options;

  if (!validateScene(scene)) {
    throw new Error('scene 参数不合法，须为 32 字符以内的字母/数字/下划线/连接符');
  }

  const dir = ensureQrcodeDir();
  const filename = `${scene}.png`;
  const filepath = path.join(dir, filename);

  // 若已存在，直接返回
  if (fs.existsSync(filepath)) {
    return `/api/uploads/qrcodes/${filename}`;
  }

  const accessToken = await getAccessToken();
  const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`;

  const requestBody = {
    scene,
    page,
    width,
    check_path: true
  } as const;

  const resp = await axios.post(url, requestBody, { responseType: 'arraybuffer' });

  // 如果返回的是 JSON，说明失败
  const contentType = resp.headers['content-type'] || '';
  if (String(contentType).includes('application/json')) {
    const json = JSON.parse(Buffer.from(resp.data).toString('utf-8'));
    throw new Error(`生成小程序码失败: ${json.errcode} ${json.errmsg}`);
  }

  // 写入文件
  fs.writeFileSync(filepath, Buffer.from(resp.data));
  return `/api/uploads/qrcodes/${filename}`;
}


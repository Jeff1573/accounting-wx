/**
 * 微信相关 API
 */

import { get } from '@/utils/request';

export interface WxaCodeData {
  url: string;
  scene: string;
}

/**
 * 获取房间邀请用小程序码
 * 
 * @param roomId - 房间ID
 * @param inviteCode - 邀请码（不区分大小写）
 */
export function getRoomWxaCode(roomId: number, inviteCode: string): Promise<WxaCodeData> {
  return get<WxaCodeData>('/wechat/wxacode', { roomId, invite: String(inviteCode).toUpperCase() });
}

/**
 * 通过 scene 直接获取小程序码（预留）
 */
export function getWxaCodeByScene(scene: string): Promise<WxaCodeData> {
  return get<WxaCodeData>('/wechat/wxacode', { scene });
}



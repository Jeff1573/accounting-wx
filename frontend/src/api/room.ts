/**
 * 房间相关 API
 */

import { post, get, put, del } from '@/utils/request';
import type { Room, RoomMember } from '@/stores/room';

/**
 * 创建房间请求参数
 */
export interface CreateRoomParams {
  name?: string;
}

/**
 * 加入房间请求参数
 */
export interface JoinRoomParams {
  invite_code: string;
}

/**
 * 房间列表响应
 */
export interface RoomsResponse {
  rooms: Room[];
}

/**
 * 房间详情响应
 */
export interface RoomDetailResponse {
  room: Room;
  members: RoomMember[];
}

/**
 * 成员关系查询响应
 */
export interface MembershipResponse {
  is_member: boolean;
  room: Pick<Room, 'id' | 'name' | 'invite_code'>;
}

/**
 * 创建房间
 * 
 * @param params - 创建参数
 * @returns Promise<Room>
 */
export function createRoom(params?: CreateRoomParams): Promise<Room> {
  return post<Room>('/rooms', params ?? {});
}

/**
 * 加入房间
 * 
 * @param params - 加入参数
 * @returns Promise<RoomDetailResponse>
 */
export function joinRoom(params: JoinRoomParams): Promise<RoomDetailResponse> {
  return post<RoomDetailResponse>('/rooms/join', params);
}

/**
 * 获取用户的房间列表
 * 
 * @returns Promise<RoomsResponse>
 */
export function getRooms(): Promise<RoomsResponse> {
  return get<RoomsResponse>('/rooms');
}

/**
 * 获取房间详情
 * 
 * @param roomId - 房间ID
 * @returns Promise<RoomDetailResponse>
 */
export function getRoomDetail(roomId: number): Promise<RoomDetailResponse> {
  return get<RoomDetailResponse>(`/rooms/${roomId}`);
}

/**
 * 查询是否为指定房间成员
 * 
 * @param params - 传入 invite_code 或 room_id 其中之一
 */
export function checkMembership(params: { invite_code?: string; room_id?: number }): Promise<MembershipResponse> {
  return get<MembershipResponse>('/rooms/membership', params);
}

/**
 * 更新成员昵称
 * 
 * @param roomId - 房间ID
 * @param memberId - 成员ID
 * @param nickname - 新昵称
 * @returns Promise<any>
 */
export function updateMemberNickname(roomId: number, memberId: number, nickname: string): Promise<any> {
  return put(`/rooms/${roomId}/members/${memberId}`, { custom_nickname: nickname });
}

/**
 * 退出房间
 * 
 * 房主退出：转让房主给下一位成员或删除房间（无其他成员时）
 * 非房主退出：直接退出，交易记录保留
 */
export function leaveRoom(roomId: number): Promise<{ message: string }> {
  return del<{ message: string }>(`/rooms/${roomId}/members/me`);
}

/**
 * 关闭房间（房主）
 * 
 * 删除房间所有成员，房间即关闭。
 * 所有成员将收到通知并返回房间列表。
 * 
 * @param roomId - 房间ID
 * @returns Promise<{ message: string }>
 */
export function closeRoom(roomId: number): Promise<{ message: string }> {
  return post<{ message: string }>(`/rooms/${roomId}/close`);
}
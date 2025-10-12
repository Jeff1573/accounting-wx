/**
 * 房间状态管理 Store
 * 
 * 管理当前房间的状态和数据
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * 房间信息接口
 */
export interface Room {
  id: number;
  name: string;
  invite_code: string;
  member_count?: number;
  created_at?: string;
  joined_at?: string;
}

/**
 * 房间成员接口
 */
export interface RoomMember {
  id: number;
  user_id: number;
  display_name: string;
  avatar: string;
  balance: string;
  joined_at: string;
}

/**
 * 交易记录接口
 */
export interface Transaction {
  id: number;
  payer: {
    id: number;
    nickname: string;
    avatar: string;
  };
  payee: {
    id: number;
    nickname: string;
    avatar: string;
  };
  amount: string;
  created_at: string;
}

/**
 * 房间 Store
 */
export const useRoomStore = defineStore('room', () => {
  // 状态
  const currentRoom = ref<Room | null>(null);
  const members = ref<RoomMember[]>([]);
  const transactions = ref<Transaction[]>([]);

  /**
   * 设置当前房间
   * 
   * @param room - 房间信息
   */
  function setCurrentRoom(room: Room): void {
    currentRoom.value = room;
  }

  /**
   * 设置房间成员
   * 
   * @param memberList - 成员列表
   */
  function setMembers(memberList: RoomMember[]): void {
    members.value = memberList;
  }

  /**
   * 设置交易记录
   * 
   * @param transactionList - 交易记录列表
   */
  function setTransactions(transactionList: Transaction[]): void {
    transactions.value = transactionList;
  }

  /**
   * 添加新交易记录
   * 
   * @param transaction - 新交易记录
   */
  function addTransaction(transaction: Transaction): void {
    transactions.value.unshift(transaction);
  }

  /**
   * 清除房间数据
   */
  function clearRoomData(): void {
    currentRoom.value = null;
    members.value = [];
    transactions.value = [];
  }

  return {
    currentRoom,
    members,
    transactions,
    setCurrentRoom,
    setMembers,
    setTransactions,
    addTransaction,
    clearRoomData
  };
});

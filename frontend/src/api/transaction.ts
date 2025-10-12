/**
 * 交易记录相关 API
 */

import { post, get } from '@/utils/request';
import type { Transaction } from '@/stores/room';

/**
 * 创建交易请求参数
 */
export interface CreateTransactionParams {
  payee_id: number;
  amount: number;
}

/**
 * 交易记录列表响应
 */
export interface TransactionsResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * 余额统计响应
 */
export interface BalancesResponse {
  balances: Array<{
    user_id: number;
    display_name: string;
    avatar: string;
    balance: string;
  }>;
}

/**
 * 创建交易记录
 * 
 * @param roomId - 房间ID
 * @param params - 交易参数
 * @returns Promise<Transaction>
 */
export function createTransaction(roomId: number, params: CreateTransactionParams): Promise<Transaction> {
  return post<Transaction>(`/rooms/${roomId}/transactions`, params);
}

/**
 * 获取房间交易记录
 * 
 * @param roomId - 房间ID
 * @param page - 页码
 * @param limit - 每页条数
 * @returns Promise<TransactionsResponse>
 */
export function getTransactions(roomId: number, page = 1, limit = 20): Promise<TransactionsResponse> {
  return get<TransactionsResponse>(`/rooms/${roomId}/transactions`, { page, limit });
}

/**
 * 获取房间成员余额统计
 * 
 * @param roomId - 房间ID
 * @returns Promise<BalancesResponse>
 */
export function getBalances(roomId: number): Promise<BalancesResponse> {
  return get<BalancesResponse>(`/rooms/${roomId}/balances`);
}

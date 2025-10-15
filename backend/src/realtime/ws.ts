/**
 * 实时通信（WebSocket）模块
 * 
 * - 基于 ws 在路径 /ws 建立长连接
 * - 握手阶段校验 Authorization: Bearer <token>
 * - 通过 query 参数接收 roomId，将连接加入对应房间分组
 * - 提供 broadcast(roomId, event) 在控制器中调用
 */

import type { Server, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import url from 'url';
import { verifyToken } from '../utils/jwt';

/**
 * 事件数据结构
 */
export interface RealtimeEvent<T = any> {
  type: string;
  data?: T;
}

/**
 * 房间 -> (用户 -> 单一连接)
 * 保证同一房间同一用户仅保留一个活跃连接
 */
const roomIdToUserSockets = new Map<number, Map<number, WebSocket>>();

/**
 * 初始化 WebSocket 服务
 * 
 * @param server - HTTP Server（由 app.listen 返回）
 */
export function initWebSocket(server: Server): void {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket: WebSocket, request: IncomingMessage) => {
    try {
      // 1) 鉴权
      const auth = (request.headers['authorization'] || '').toString();
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      const payload = token ? verifyToken(token) : null;
      if (!payload) {
        socket.close(4001, 'unauthorized');
        return;
      }

      // 2) 解析 roomId
      const parsed = url.parse(request.url || '', true);
      const roomIdRaw = parsed.query.roomId as string | undefined;
      const roomId = roomIdRaw ? Number(roomIdRaw) : NaN;
      if (!roomId || Number.isNaN(roomId)) {
        socket.close(4002, 'invalid roomId');
        return;
      }

      // 3) 加入房间分组（同一用户仅保留一个连接）
      const userId = payload.userId;
      let userMap = roomIdToUserSockets.get(roomId);
      if (!userMap) {
        userMap = new Map<number, WebSocket>();
        roomIdToUserSockets.set(roomId, userMap);
      }
      const prev = userMap.get(userId);
      if (prev && prev !== socket) {
        try { prev.close(4000, 'replaced'); } catch {}
      }
      userMap.set(userId, socket);

      // 4) 连接关闭时清理
      (socket as any).on('close', () => {
        const map = roomIdToUserSockets.get(roomId);
        if (map) {
          if (map.get(userId) === socket) {
            map.delete(userId);
          }
          if (map.size === 0) {
            roomIdToUserSockets.delete(roomId);
          }
        }
      });

      // 5) 心跳（可选）：简单 echo 确保连接活跃
      (socket as any).on('pong', () => {
        // no-op
      });
    } catch (e) {
      try { socket.close(1011, 'internal error'); } catch {}
    }
  });
}

/**
 * 向房间内所有连接广播事件
 */
export function broadcast(roomId: number, event: RealtimeEvent): void {
  const userMap = roomIdToUserSockets.get(roomId);
  if (!userMap || userMap.size === 0) return;
  const payload = JSON.stringify(event);
  for (const ws of userMap.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(payload);
      } catch {
        // 忽略单个连接的发送错误
      }
    }
  }
}

/**
 * 主动断开指定用户在指定房间的 WebSocket 连接
 * 
 * @param roomId - 房间ID
 * @param userId - 用户ID
 */
export function disconnectUser(roomId: number, userId: number): void {
  const userMap = roomIdToUserSockets.get(roomId);
  if (!userMap) return;
  
  const socket = userMap.get(userId);
  if (socket) {
    // 关闭连接
    try {
      socket.close(1000, 'user left room');
    } catch (e) {
      // 忽略关闭错误
    }
    // 立即清理映射
    userMap.delete(userId);
    if (userMap.size === 0) {
      roomIdToUserSockets.delete(roomId);
    }
  }
}



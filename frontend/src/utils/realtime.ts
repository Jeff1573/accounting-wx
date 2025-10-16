/**
 * 实时通道封装（UniApp WebSocket）
 *
 * 通过依赖注入获取 token；仅负责连接与事件分发，不依赖 Store。
 * 
 * ========== 重连问题诊断指南 ==========
 * 
 * 常见问题：WebSocket 一直重连
 * 
 * 原因排查：
 * 1. 连接超时（30秒）- 网络差时可能无法在超时前完成握手
 * 2. Token 过期 - 如果 token 无效，服务端会返回 code 4001（未授权）
 * 3. 房间 ID 无效 - 服务端返回 code 4002（房间ID无效）
 * 4. 服务端异常 - 其他业务错误导致连接关闭
 * 
 * 调试方法：
 * 1. 打开浏览器控制台或微信开发工具 Console
 * 2. 搜索 "[WS]" 日志查看连接状态
 * 3. 关键日志：
 *    - "[WS] 开始连接房间 xxx" - 开始连接
 *    - "[WS] 连接成功 xxx" - 连接建立
 *    - "[WS] 连接关闭 xxx 原因: xxx 码: xxxx" - 连接关闭原因
 *    - "[WS] 重连调度 xxx 延迟: xxxx ms" - 安排重连
 *    - "[WS] 达到最大重试次数，停止重连" - 放弃重连
 *    - "[WS] 鉴权失败，停止重连" - Token 无效
 * 
 * 快速修复：
 * 1. 检查 token 是否过期：在登录时刷新 token
 * 2. 检查网络：确保网络连接稳定
 * 3. 检查后端：查看服务端日志是否有错误
 * 4. 检查房间ID：确保房间存在且用户是成员
 */

import config from '@/config/env';

export interface ConnectOptions {
  roomId: number;
  getToken: () => string;
  onEvent: (evt: { type: string; data?: any }) => void;
  onStateChange?: (state: 'connecting' | 'connected' | 'disconnected') => void;
}

export interface RealtimeConnection {
  close: () => void;
}

function toWsUrl(apiBase: string, roomId: number): string {
  // e.g. https://host/api -> wss://host/ws?roomId=xxx
  const isHttps = apiBase.startsWith('https://');
  const isHttp = apiBase.startsWith('http://');
  const origin = apiBase.replace(/^https?:\/\//, '').replace(/\/?api\/?$/, '');
  const scheme = isHttps ? 'wss://' : (isHttp ? 'ws://' : 'wss://');
  return `${scheme}${origin}/ws?roomId=${encodeURIComponent(String(roomId))}`;
}

export function connectRoomWS(options: ConnectOptions): RealtimeConnection {
  const url = toWsUrl(config.API_BASE_URL, options.roomId);
  let closed = false;
  let retries = 0;
  const MAX_RETRIES = 5; // 最多重试5次
  let socket: UniApp.SocketTask | null = null;
  let retryTimer: number | null = null;
  let connectTimeoutTimer: number | null = null;

  const wsLog = (...args: any[]) => {
    // @ts-ignore
    if (import.meta.env.DEV) {
      console.log('[WS]', ...args);
    }
  };

  const connect = async () => {
    if (closed) return;
    
    // 检查是否达到最大重试次数
    if (retries > MAX_RETRIES) {
      wsLog('达到最大重试次数，停止重连', options.roomId);
      options.onStateChange?.('disconnected');
      return;
    }
    
    // 检查 token 是否有效
    const token = options.getToken();
    if (!token) {
      wsLog('token 为空，无法连接', options.roomId);
      options.onStateChange?.('disconnected');
      return;
    }
    
    // 通知连接中状态
    options.onStateChange?.('connecting');
    wsLog('开始连接房间', options.roomId, '重试次数:', retries);
    
    try {
      socket = uni.connectSocket({
        url,
        header: { Authorization: `Bearer ${token}` },
        complete: () => {},
      });

      // 连接超时检测（30秒，从10秒增加到30秒）
      connectTimeoutTimer = setTimeout(() => {
        if (socket && !closed) {
          wsLog('连接超时', options.roomId, '触发重连');
          try { socket.close({ code: 4003, reason: 'connect timeout' }); } catch {}
          scheduleReconnect();
        }
      }, 30000) as unknown as number;

      socket?.onOpen(() => {
        // 清除超时定时器
        if (connectTimeoutTimer) {
          clearTimeout(connectTimeoutTimer as unknown as number);
          connectTimeoutTimer = null;
        }
        
        retries = 0;
        options.onStateChange?.('connected');
        wsLog('连接成功', options.roomId);
      });

      socket?.onMessage((msg) => {
        try {
          const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
          if (data && typeof data.type === 'string') {
            options.onEvent(data);
          }
        } catch {}
      });

      socket?.onClose((res) => {
        // 清除超时定时器
        if (connectTimeoutTimer) {
          clearTimeout(connectTimeoutTimer as unknown as number);
          connectTimeoutTimer = null;
        }
        
        options.onStateChange?.('disconnected');
        wsLog('连接关闭', options.roomId, '原因:', res?.reason || '未知', '码:', res?.code);
        
        // 鉴权失败（4001）或 token 无效，不再重连
        if (res?.code === 4001) {
          wsLog('鉴权失败，停止重连', options.roomId);
          return;
        }
        
        scheduleReconnect();
      });
      
      // @ts-ignore 小程序端存在 onError
      socket?.onError?.(() => {
        // 清除超时定时器
        if (connectTimeoutTimer) {
          clearTimeout(connectTimeoutTimer as unknown as number);
          connectTimeoutTimer = null;
        }
        
        options.onStateChange?.('disconnected');
        wsLog('连接错误', options.roomId);
        scheduleReconnect();
      });
    } catch (err) {
      wsLog('连接异常', options.roomId, err);
      scheduleReconnect();
    }
  };

  const scheduleReconnect = () => {
    if (closed) return;
    if (retryTimer) return;
    
    // 检查是否达到最大重试次数
    if (retries >= MAX_RETRIES) {
      wsLog('达到最大重试次数，停止重连', options.roomId);
      options.onStateChange?.('disconnected');
      return;
    }
    
    const delay = Math.min(30000, 1000 * Math.pow(2, retries));
    wsLog('重连调度', options.roomId, '延迟:', delay + 'ms', '重试次数:', retries);
    retries++;
    // @ts-ignore setTimeout 返回 number
    retryTimer = setTimeout(() => {
      retryTimer = null;
      connect();
    }, delay) as unknown as number;
  };

  const close = () => {
    closed = true;
    wsLog('主动关闭连接', options.roomId);
    
    // 清除所有定时器
    if (retryTimer) {
      clearTimeout(retryTimer as unknown as number);
      retryTimer = null;
    }
    if (connectTimeoutTimer) {
      clearTimeout(connectTimeoutTimer as unknown as number);
      connectTimeoutTimer = null;
    }
    
    try { socket?.close({ code: 1000, reason: 'page unload' }); } catch {}
    socket = null;
  };

  connect();

  return { close };
}



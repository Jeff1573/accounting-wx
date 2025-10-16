/**
 * 实时通道封装（UniApp WebSocket）
 *
 * 通过依赖注入获取 token；仅负责连接与事件分发，不依赖 Store。
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
    
    // 通知连接中状态
    options.onStateChange?.('connecting');
    wsLog('开始连接房间', options.roomId);
    
    try {
      socket = uni.connectSocket({
        url,
        header: { Authorization: `Bearer ${options.getToken()}` },
        complete: () => {},
      });

      // 连接超时检测（10秒）
      connectTimeoutTimer = setTimeout(() => {
        if (socket && !closed) {
          wsLog('连接超时', options.roomId, '触发重连');
          try { socket.close({ code: 4003, reason: 'connect timeout' }); } catch {}
          scheduleReconnect();
        }
      }, 10000) as unknown as number;

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
        wsLog('连接关闭', options.roomId, '原因:', res?.reason || '未知');
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



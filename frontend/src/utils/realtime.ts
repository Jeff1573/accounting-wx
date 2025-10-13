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

  const connect = async () => {
    if (closed) return;
    try {
      socket = uni.connectSocket({
        url,
        header: { Authorization: `Bearer ${options.getToken()}` },
        complete: () => {},
      });

      socket?.onOpen(() => {
        retries = 0;
      });

      socket?.onMessage((msg) => {
        try {
          const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
          if (data && typeof data.type === 'string') {
            options.onEvent(data);
          }
        } catch {}
      });

      socket?.onClose(() => scheduleReconnect());
      // @ts-ignore 小程序端存在 onError
      socket?.onError?.(() => scheduleReconnect());
    } catch {
      scheduleReconnect();
    }
  };

  const scheduleReconnect = () => {
    if (closed) return;
    if (retryTimer) return;
    const delay = Math.min(30000, 1000 * Math.pow(2, retries++));
    // @ts-ignore setTimeout 返回 number
    retryTimer = setTimeout(() => {
      retryTimer = null;
      connect();
    }, delay) as unknown as number;
  };

  const close = () => {
    closed = true;
    if (retryTimer) {
      clearTimeout(retryTimer as unknown as number);
      retryTimer = null;
    }
    try { socket?.close({ code: 1000, reason: 'page unload' }); } catch {}
    socket = null;
  };

  connect();

  return { close };
}



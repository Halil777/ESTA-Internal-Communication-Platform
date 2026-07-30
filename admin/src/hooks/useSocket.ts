import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

type SocketEventHandler = (data: unknown) => void;

let globalSocket: WebSocket | null = null;
let reconnectTimer: number | null = null;

function buildWebSocketUrl(token: string) {
  const configuredUrl = import.meta.env.VITE_WS_URL as string | undefined;
  const url = new URL(configuredUrl || '/ws', window.location.origin);
  if (url.protocol === 'http:') url.protocol = 'ws:';
  if (url.protocol === 'https:') url.protocol = 'wss:';
  url.searchParams.set('token', token);
  return url.toString();
}

function clearReconnectTimer() {
  if (!reconnectTimer) return;
  window.clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

function closeSocket() {
  clearReconnectTimer();
  if (!globalSocket) return;
  globalSocket.close(1000, 'Client disconnect');
  globalSocket = null;
}

export function useSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const handlersRef = useRef<Map<string, SocketEventHandler>>(new Map());

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      closeSocket();
      return;
    }

    const handlers = handlersRef.current;
    let stopped = false;
    let reconnectAttempts = 0;

    const connect = () => {
      if (stopped) return;
      if (
        globalSocket &&
        (globalSocket.readyState === WebSocket.CONNECTING ||
          globalSocket.readyState === WebSocket.OPEN)
      ) {
        return;
      }

      const socket = new WebSocket(buildWebSocketUrl(accessToken));
      globalSocket = socket;

      socket.addEventListener('open', () => {
        reconnectAttempts = 0;
        console.log('[WS] Connected');
      });

      socket.addEventListener('message', (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (typeof payload?.type === 'string') {
            handlers.get(payload.type)?.(payload);
          }
        } catch {
          console.warn('[WS] Invalid message:', event.data);
        }
      });

      socket.addEventListener('close', (event) => {
        if (globalSocket === socket) {
          globalSocket = null;
        }
        console.log('[WS] Disconnected:', event.reason || event.code);

        if (stopped) return;
        const delayMs = Math.min(1000 * 2 ** reconnectAttempts, 30000);
        reconnectAttempts += 1;
        clearReconnectTimer();
        reconnectTimer = window.setTimeout(connect, delayMs);
      });

      socket.addEventListener('error', () => {
        console.warn('[WS] Connection error');
      });
    };

    connect();

    return () => {
      stopped = true;
      closeSocket();
    };
  }, [isAuthenticated, accessToken]);

  const on = useCallback((event: string, handler: SocketEventHandler) => {
    handlersRef.current.set(event, handler);
  }, []);

  const off = useCallback((event: string) => {
    handlersRef.current.delete(event);
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    if (globalSocket?.readyState !== WebSocket.OPEN) return;
    const payload =
      data && typeof data === 'object' && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : { payload: data };
    globalSocket.send(JSON.stringify({ type: event, ...payload }));
  }, []);

  return { on, off, emit, socket: globalSocket };
}

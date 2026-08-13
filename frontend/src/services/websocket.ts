import { useState, useEffect, useCallback, useRef } from 'react';

export interface WatchUpdateData {
  video_id: string;
  title?: string;
  channel_name?: string;
  alignment_score: number;
  classification: string;
  timestamp: string;
}

export interface WebSocketMessage {
  type: string;
  message?: string;
  data?: WatchUpdateData;
}

export const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WatchUpdateData[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const payload: WebSocketMessage = JSON.parse(event.data);
        if (payload.type === 'WATCH_UPDATE' && payload.data) {
          const newItem = payload.data;
          setMessages((prev) => {
            const filtered = prev.filter((item) => item.video_id !== newItem.video_id);
            return [newItem, ...filtered].slice(0, 10);
          });
        }
      } catch (err) {
        console.error('Error parsing WebSocket message', err);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      reconnectTimeout.current = setTimeout(() => {
        connect();
      }, 5000);
    };

    socket.onerror = (err) => {
      console.error('WebSocket error', err);
      socket.close();
    };
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect]);

  return { isConnected, messages };
};

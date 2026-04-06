import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '../services/api';
import { getSocketUrl } from '../services/serverConfig';
import type { ChatMessage } from '../services/chatApi';

export function useChatSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const messageHandlersRef = useRef<Set<(msg: ChatMessage) => void>>(new Set());
  const typingHandlersRef = useRef<Set<(data: { conversationId: string; userId: string }) => void>>(new Set());
  const newMessageHandlersRef = useRef<Set<(msg: ChatMessage) => void>>(new Set());

  const connect = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    const socket = io(`${getSocketUrl()}/chat`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('chat:unread_count', (data: { count: number }) => {
      setUnreadCount(data.count);
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      messageHandlersRef.current.forEach((h) => h(msg));
    });

    socket.on('chat:new_message', (msg: ChatMessage) => {
      newMessageHandlersRef.current.forEach((h) => h(msg));
      setUnreadCount((prev) => prev + 1);
    });

    socket.on('chat:typing', (data: { conversationId: string; userId: string }) => {
      typingHandlersRef.current.forEach((h) => h(data));
    });
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('chat:join', { conversationId });
  }, []);

  const sendTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit('chat:typing', { conversationId });
  }, []);

  const markAsRead = useCallback((conversationId: string) => {
    socketRef.current?.emit('chat:read', { conversationId });
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const onMessage = useCallback((handler: (msg: ChatMessage) => void) => {
    messageHandlersRef.current.add(handler);
    return () => { messageHandlersRef.current.delete(handler); };
  }, []);

  const onNewMessage = useCallback((handler: (msg: ChatMessage) => void) => {
    newMessageHandlersRef.current.add(handler);
    return () => { newMessageHandlersRef.current.delete(handler); };
  }, []);

  const onTyping = useCallback((handler: (data: { conversationId: string; userId: string }) => void) => {
    typingHandlersRef.current.add(handler);
    return () => { typingHandlersRef.current.delete(handler); };
  }, []);

  return {
    isConnected,
    unreadCount,
    connect,
    disconnect,
    joinConversation,
    sendTyping,
    markAsRead,
    onMessage,
    onNewMessage,
    onTyping,
  };
}

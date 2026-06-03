// src/api/SocketContext.tsx — React context exposing the singleton socket
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from './socket';
import { API_CONFIG } from './config';
import { useUserStore } from '@store/userStore';
import { SOCKET_ON } from '@/constants/socketEvents';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  onlineCount: number;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  onlineCount: 0,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useUserStore((s) => s.user);
  const token = useUserStore((s) => s.token);

  const socket = useMemo<Socket | null>(() => {
    if (!user) return null;
    console.log('[SocketContext] Target URL:', API_CONFIG.SOCKET_URL);
    console.log('[SocketContext] URL candidates:', API_CONFIG.SOCKET_URL_CANDIDATES);
    const newSocket = getSocket(token, user.id);
    console.log('[SocketContext] Socket created, connected:', newSocket.connected);
    return newSocket;
  }, [user, token]);

  const [connected, setConnected] = useState<boolean>(!!socket?.connected);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!socket) {
      setConnected(false);
      return;
    }

    const handleConnect = () => {
      console.log('[SocketContext] Connected:', socket.id);
      setConnected(true);
    };
    const handleDisconnect = (reason: string) => {
      console.log('[SocketContext] Disconnected:', reason);
      setConnected(false);
      if (reason === 'io server disconnect') {
        setTimeout(() => socket.connect(), 1000);
      }
    };
    const handleConnectError = (err: Error) => {
      console.error('[SocketContext] Connection error:', err.message);
      setConnected(false);
    };
    const handleReconnectAttempt = (attempt: number) => {
      console.log('[SocketContext] Reconnecting... attempt', attempt);
    };
    const handleReconnect = () => {
      console.log('[SocketContext] Reconnected:', socket.id);
      setConnected(true);
    };
    const handleOnline = (data: { count: number }) => setOnlineCount(data.count);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.io.on('reconnect', handleReconnect);
    socket.on(SOCKET_ON.ONLINE_COUNT, handleOnline);

    // Check initial connection state
    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.io.off('reconnect', handleReconnect);
      socket.off(SOCKET_ON.ONLINE_COUNT, handleOnline);
    };
  }, [socket]);

  // Tear down socket entirely when the user logs out
  useEffect(() => {
    if (!user) disconnectSocket();
  }, [user]);

  const value = useMemo(
    () => ({ socket, connected, onlineCount }),
    [socket, connected, onlineCount],
  );
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export function useSocketContext(): SocketContextValue {
  return useContext(SocketContext);
}

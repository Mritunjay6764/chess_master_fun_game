// src/hooks/useSocket.ts — thin accessor + emit helper
import { useCallback } from 'react';
import { useSocketContext } from '@api/SocketContext';

export function useSocket() {
  const { socket, connected, onlineCount } = useSocketContext();

  const emit = useCallback(
    <T,>(event: string, payload?: T) => {
      if (!socket) {
        console.warn('[useSocket] Socket not available for event:', event);
        return false;
      }
      if (!connected) {
        console.warn('[useSocket] Socket not connected for event:', event);
      }
      socket.emit(event, payload);
      return true;
    },
    [socket, connected],
  );

  return { socket, connected, onlineCount, emit };
}

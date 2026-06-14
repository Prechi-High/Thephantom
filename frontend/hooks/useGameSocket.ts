import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/useGameStore';

export const useGameSocket = (subSessionId: string | null, userId: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  const { updateState, addSpinResult } = useGameStore();

  useEffect(() => {
    if (!subSessionId || !userId) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    socketRef.current = socket;

    socket.emit('join_subsession', { subSessionId, userId });

    socket.on('state_update', (state) => {
      updateState(state);
    });

    socket.on('spin_result', (result) => {
      addSpinResult(result);
    });

    return () => {
      socket.disconnect();
    };
  }, [subSessionId, userId, updateState, addSpinResult]);

  const spin = () => {
    if (socketRef.current) {
      socketRef.current.emit('spin', { subSessionId, userId });
    }
  };

  const buyItem = (itemId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('buy_item', { subSessionId, userId, itemId });
    }
  };

  return { spin, buyItem };
};

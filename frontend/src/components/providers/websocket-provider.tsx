'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-provider';
import toast from 'react-hot-toast';
import { getWsBaseUrl } from '@/lib/api-url';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribe: (event: string, handler: (...args: any[]) => void) => void;
  unsubscribe: (event: string, handler: (...args: any[]) => void) => void;
  emit: (event: string, data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY = 1000; // 1 second
const WS_NAMESPACE = '/admin';

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    // Only connect if user is authenticated and is an admin
    if (!user || user.role !== 'ADMIN') {
      // Clean up existing connection if user is not admin
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      return;
    }

    console.log('[WebSocket] Initializing connection...');

    // Dynamically determine WebSocket URL based on current hostname
    const wsUrl = getWsBaseUrl();

    // Create socket connection
    const newSocket = io(`${wsUrl}${WS_NAMESPACE}`, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: false, // We'll handle reconnection manually
    });

    // Connection successful
    newSocket.on('connected', (data) => {
      console.log('[WebSocket] Connected successfully:', data);
      setIsConnected(true);
      reconnectAttempts.current = 0;
      toast.success('Real-time connection established', {
        duration: 2000,
        position: 'bottom-right',
      });
    });

    // Connection error
    newSocket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      setIsConnected(false);
      handleReconnect(newSocket, token);
    });

    // Disconnection
    newSocket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);

      // Don't reconnect if disconnect was intentional
      if (reason === 'io client disconnect' || reason === 'io server disconnect') {
        return;
      }

      handleReconnect(newSocket, token);
    });

    // Error event
    newSocket.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
      toast.error('Real-time connection error', {
        duration: 3000,
        position: 'bottom-right',
      });
    });

    // Heartbeat response
    newSocket.on('heartbeat', () => {
      // Connection is alive, send pong
      newSocket.emit('pong');
    });

    // Admin connection/disconnection events
    newSocket.on('admin:connected', (data) => {
      console.log('[WebSocket] Admin connected:', data.adminEmail);
    });

    newSocket.on('admin:disconnected', (data) => {
      console.log('[WebSocket] Admin disconnected:', data.userId);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('[WebSocket] Cleaning up connection');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      newSocket.disconnect();
    };
  }, [user]);

  // Handle reconnection with exponential backoff
  const handleReconnect = useCallback((socket: Socket, token: string) => {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WebSocket] Max reconnection attempts reached');
      toast.error('Unable to establish real-time connection', {
        duration: 5000,
        position: 'bottom-right',
      });
      return;
    }

    const delay = RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts.current);
    reconnectAttempts.current += 1;

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('[WebSocket] Attempting to reconnect...');
      socket.auth = { token };
      socket.connect();
    }, delay);
  }, []);

  // Subscribe to an event
  const subscribe = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (!socket) {
      console.warn('[WebSocket] Cannot subscribe, socket not initialized');
      return;
    }

    console.log(`[WebSocket] Subscribing to event: ${event}`);
    socket.on(event, handler);
  }, [socket]);

  // Unsubscribe from an event
  const unsubscribe = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (!socket) {
      console.warn('[WebSocket] Cannot unsubscribe, socket not initialized');
      return;
    }

    console.log(`[WebSocket] Unsubscribing from event: ${event}`);
    socket.off(event, handler);
  }, [socket]);

  // Emit an event
  const emit = useCallback((event: string, data: any) => {
    if (!socket || !isConnected) {
      console.warn('[WebSocket] Cannot emit, socket not connected');
      return;
    }

    console.log(`[WebSocket] Emitting event: ${event}`, data);
    socket.emit(event, data);
  }, [socket, isConnected]);

  const value = {
    socket,
    isConnected,
    subscribe,
    unsubscribe,
    emit,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

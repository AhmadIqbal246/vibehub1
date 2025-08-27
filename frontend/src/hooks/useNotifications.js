import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotificationCounts,
  updateFromWebSocketData,
  setWebSocketConnected,
  setWebSocketInstance,
  setNotificationError,
  incrementUnreadCount,
  decrementUnreadCount,
  resetConversationCount,
  selectTotalUnreadCount,
  selectConversationUnreadCount,
  selectAllConversationCounts,
  selectNotificationConnectionStatus,
  selectNotificationError,
  selectWebSocketInstance,
  selectActiveConversationId
} from '../store/notifications/notificationSlice';
import ENV from '../config';

export const useNotifications = ({ enabled = true } = {}) => {
  const dispatch = useDispatch();
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  // Selectors
  const totalUnreadCount = useSelector(selectTotalUnreadCount);
  const conversationCounts = useSelector(selectAllConversationCounts);
  const isConnected = useSelector(selectNotificationConnectionStatus);
  const error = useSelector(selectNotificationError);
  const websocketInstance = useSelector(selectWebSocketInstance);

  // Connect to notification WebSocket
  const connectNotificationWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close();
    }

    try {
      const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
      const token = localStorage.getItem('access_token');
      const wsUrl = `${wsScheme}://localhost:8000/ws/notifications/${token ? `?token=${token}` : ''}`;

      wsRef.current = new WebSocket(wsUrl);
      dispatch(setWebSocketInstance(wsRef.current));

      wsRef.current.onopen = () => {
        dispatch(setWebSocketConnected(true));
        dispatch(setNotificationError(null));
        
        // Request current counts on connection to ensure initial sync
        wsRef.current.send(JSON.stringify({ type: 'request_counts' }));
        
        // Also fetch via API to ensure data consistency
        dispatch(fetchNotificationCounts());
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'notification_count_update') {
            dispatch(updateFromWebSocketData(data.notification_data));
          } else if (data.type === 'pong') {
            // Handle pong response
            console.log('Notification WebSocket pong received');
          }
        } catch (error) {
          console.error('Error parsing notification WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Notification WebSocket error:', error);
        dispatch(setNotificationError('WebSocket connection error'));
      };

      wsRef.current.onclose = (event) => {
        dispatch(setWebSocketConnected(false));
        
        // Don't attempt to reconnect on authentication failures (code 4001) or manual disconnect (code 1000)
        if (event.code !== 1000 && event.code !== 4001) {
          // Attempt to reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            // Only reconnect if still enabled
            if (enabled) {
              connectNotificationWebSocket();
            }
          }, 5000);
        }
      };

    } catch (error) {
      console.error('Failed to create notification WebSocket:', error);
      dispatch(setNotificationError('Failed to create WebSocket connection'));
    }
  }, [dispatch, enabled]);

  // Disconnect WebSocket
  const disconnectNotificationWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    dispatch(setWebSocketConnected(false));
    dispatch(setWebSocketInstance(null));
  }, [dispatch]);

  // Fetch initial notification counts
  const fetchInitialCounts = useCallback(() => {
    dispatch(fetchNotificationCounts());
  }, [dispatch]);

  // Manual actions for components to use
  const incrementCount = useCallback((conversationId, increment = 1) => {
    dispatch(incrementUnreadCount({ conversationId, increment }));
  }, [dispatch]);

  const decrementCount = useCallback((conversationId, decrement = 1) => {
    dispatch(decrementUnreadCount({ conversationId, decrement }));
  }, [dispatch]);

  const resetCount = useCallback((conversationId) => {
    dispatch(resetConversationCount({ conversationId }));
  }, [dispatch]);

  // Get conversation-specific count
  const getConversationCount = useCallback((conversationId) => {
    return conversationCounts[conversationId] || 0;
  }, [conversationCounts]);

  // Send ping to keep connection alive
  const sendPing = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  // Auto-connect on mount and cleanup on unmount, but only when enabled
  useEffect(() => {
    if (!enabled) {
      // If disabled, ensure we cleanup any existing connections
      disconnectNotificationWebSocket();
      return;
    }

    // Only connect when enabled
    connectNotificationWebSocket();
    
    // Fetch initial counts
    fetchInitialCounts();
    
    // Setup ping interval to keep connection alive
    const pingInterval = setInterval(sendPing, 30000); // Ping every 30 seconds
    
    return () => {
      clearInterval(pingInterval);
      disconnectNotificationWebSocket();
    };
  }, [enabled, connectNotificationWebSocket, fetchInitialCounts, sendPing, disconnectNotificationWebSocket]);

  return {
    // State
    totalUnreadCount,
    conversationCounts,
    isConnected,
    error,
    websocketInstance,
    
    // Actions
    fetchInitialCounts,
    incrementCount,
    decrementCount,
    resetCount,
    getConversationCount,
    
    // WebSocket methods
    connectNotificationWebSocket,
    disconnectNotificationWebSocket,
    sendPing
  };
};

export default useNotifications;

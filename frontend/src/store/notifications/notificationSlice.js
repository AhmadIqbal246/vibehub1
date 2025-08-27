import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosConfig';
import ENV from '../../config';

// Async thunks for API calls
export const fetchNotificationCounts = createAsyncThunk(
  'notifications/fetchCounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`${ENV.BASE_API_URL}/chat/api/notifications/count/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch notification counts');
    }
  }
);

export const markConversationAsRead = createAsyncThunk(
  'notifications/markConversationRead',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `${ENV.BASE_API_URL}/chat/api/conversation/${conversationId}/mark-read/`
      );
      return { conversationId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to mark conversation as read');
    }
  }
);

// Initial state
const initialState = {
  // Total unread count across all conversations
  totalUnreadCount: 0,
  
  // Individual conversation unread counts
  conversationCounts: {},
  
  // WebSocket connection status
  isConnected: false,
  
  // Loading states
  loading: false,
  error: null,
  
  // Last update timestamp
  lastUpdated: null,
  
  // WebSocket instance reference
  websocketInstance: null,
  
  // Track currently active conversation to prevent notifications
  activeConversationId: null
};

// Notification slice
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Set total unread count
    setTotalUnreadCount: (state, action) => {
      state.totalUnreadCount = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    
    // Set individual conversation unread count
    setConversationUnreadCount: (state, action) => {
      const { conversationId, count } = action.payload;
      if (count > 0) {
        state.conversationCounts[conversationId] = count;
      } else {
        delete state.conversationCounts[conversationId];
      }
      
      // Recalculate total from conversation counts
      state.totalUnreadCount = Object.values(state.conversationCounts).reduce((total, count) => total + count, 0);
      state.lastUpdated = new Date().toISOString();
    },
    
    // Increment unread count for a conversation
    incrementUnreadCount: (state, action) => {
      const { conversationId, increment = 1 } = action.payload;
      const currentCount = state.conversationCounts[conversationId] || 0;
      const newCount = currentCount + increment;
      
      state.conversationCounts[conversationId] = newCount;
      state.totalUnreadCount += increment;
      state.lastUpdated = new Date().toISOString();
    },
    
    // Decrement unread count for a conversation
    decrementUnreadCount: (state, action) => {
      const { conversationId, decrement = 1 } = action.payload;
      const currentCount = state.conversationCounts[conversationId] || 0;
      const newCount = Math.max(0, currentCount - decrement);
      
      if (newCount > 0) {
        state.conversationCounts[conversationId] = newCount;
      } else {
        delete state.conversationCounts[conversationId];
      }
      
      state.totalUnreadCount = Math.max(0, state.totalUnreadCount - decrement);
      state.lastUpdated = new Date().toISOString();
    },
    
    // Reset conversation count to zero
    resetConversationCount: (state, action) => {
      const { conversationId } = action.payload;
      const previousCount = state.conversationCounts[conversationId] || 0;
      
      delete state.conversationCounts[conversationId];
      state.totalUnreadCount = Math.max(0, state.totalUnreadCount - previousCount);
      state.lastUpdated = new Date().toISOString();
    },
    
    // Update multiple conversation counts at once
    updateConversationCounts: (state, action) => {
      const { conversationCounts } = action.payload;
      
      // Update individual counts
      state.conversationCounts = { ...conversationCounts };
      
      // Recalculate total
      state.totalUnreadCount = Object.values(conversationCounts).reduce((total, count) => total + count, 0);
      state.lastUpdated = new Date().toISOString();
    },
    
    // Update from WebSocket data
    updateFromWebSocketData: (state, action) => {
      const { total_unread_count, conversation_counts } = action.payload;
      
      // Update the raw counts first
      const newConversationCounts = { ...conversation_counts };
      const newTotalCount = total_unread_count || 0;
      
      // If there's an active conversation, always exclude it from notifications
      if (state.activeConversationId) {
        // Remove active conversation from notification counts
        delete newConversationCounts[state.activeConversationId];
        
        // Recalculate total without active conversation
        const recalculatedTotal = Object.values(newConversationCounts).reduce((sum, count) => sum + count, 0);
        
        state.totalUnreadCount = Math.max(0, recalculatedTotal);
        state.conversationCounts = newConversationCounts;
      } else {
        // No active conversation, use counts as-is
        state.totalUnreadCount = Math.max(0, newTotalCount);
        state.conversationCounts = newConversationCounts;
      }
      
      state.lastUpdated = new Date().toISOString();
    },
    
    // WebSocket connection status
    setWebSocketConnected: (state, action) => {
      state.isConnected = action.payload;
    },
    
    // Set WebSocket instance
    setWebSocketInstance: (state, action) => {
      state.websocketInstance = action.payload;
    },
    
    // Error handling
    setNotificationError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    clearNotificationError: (state) => {
      state.error = null;
    },
    
    // Loading state
    setNotificationLoading: (state, action) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    
    // Set active conversation ID
    setActiveConversation: (state, action) => {
      const newActiveId = action.payload;
      state.activeConversationId = newActiveId;
      
      // When setting a new active conversation, also remove its count from notifications
      if (newActiveId && state.conversationCounts[newActiveId]) {
        const countToRemove = state.conversationCounts[newActiveId];
        delete state.conversationCounts[newActiveId];
        state.totalUnreadCount = Math.max(0, state.totalUnreadCount - countToRemove);
        state.lastUpdated = new Date().toISOString();
      }
    },
    
    // Clear active conversation ID
    clearActiveConversation: (state) => {
      state.activeConversationId = null;
    },
    
    // Reset all notification state
    resetNotificationState: () => {
      return { ...initialState };
    }
  },
  
  // Handle async thunks
  extraReducers: (builder) => {
    // Fetch notification counts
    builder
      .addCase(fetchNotificationCounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationCounts.fulfilled, (state, action) => {
        state.loading = false;
        state.totalUnreadCount = action.payload.total_unread_count || 0;
        state.conversationCounts = action.payload.conversation_counts || {};
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchNotificationCounts.rejected, (state, action) => {
        state.loading = false;
        // Don't set error for authentication issues - these are expected when not authenticated
        if (action.payload && action.payload !== 'Request failed with status code 401') {
          state.error = action.payload;
        }
        // Reset counts on auth failure to prevent stale data
        if (action.error && action.error.message && action.error.message.includes('401')) {
          state.totalUnreadCount = 0;
          state.conversationCounts = {};
        }
      });
    
    // Mark conversation as read
    builder
      .addCase(markConversationAsRead.pending, (state) => {
        state.error = null;
      })
      .addCase(markConversationAsRead.fulfilled, (state, action) => {
        const { conversationId } = action.payload;
        // Reset the conversation count optimistically
        const previousCount = state.conversationCounts[conversationId] || 0;
        delete state.conversationCounts[conversationId];
        state.totalUnreadCount = Math.max(0, state.totalUnreadCount - previousCount);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(markConversationAsRead.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

// Export actions
export const {
  setTotalUnreadCount,
  setConversationUnreadCount,
  incrementUnreadCount,
  decrementUnreadCount,
  resetConversationCount,
  updateConversationCounts,
  updateFromWebSocketData,
  setWebSocketConnected,
  setWebSocketInstance,
  setNotificationError,
  clearNotificationError,
  setNotificationLoading,
  setActiveConversation,
  clearActiveConversation,
  resetNotificationState
} = notificationSlice.actions;

// Selectors
export const selectTotalUnreadCount = (state) => state.notifications.totalUnreadCount;
export const selectConversationUnreadCount = (conversationId) => (state) => 
  state.notifications.conversationCounts[conversationId] || 0;
export const selectAllConversationCounts = (state) => state.notifications.conversationCounts;
export const selectNotificationConnectionStatus = (state) => state.notifications.isConnected;
export const selectNotificationLoading = (state) => state.notifications.loading;
export const selectNotificationError = (state) => state.notifications.error;
export const selectNotificationLastUpdated = (state) => state.notifications.lastUpdated;
export const selectWebSocketInstance = (state) => state.notifications.websocketInstance;
export const selectActiveConversationId = (state) => state.notifications.activeConversationId;

// Export reducer
export default notificationSlice.reducer;

import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import ProtectedRoute from "./store/ProtectedRoute";
import useNotifications from './hooks/useNotifications';

// Pages
import LoginPage from "./pages/RegisterationPage/LoginPage";
import SignupPage from "./pages/RegisterationPage/SignupPage";
import UserProfile from "./pages/UserProfile";
import ChatPage from "./pages/ChatDashboardPage/ChatPage";
import ConversationList from "./components/mutualcomponents/Conversations/ConversationList";
import NewConversation from "./components/mutualcomponents/Conversations/NewConversation";
import ChatDashboard from "./pages/ChatDashboardPage/ChatDashboard";
import ChatInterface from "./components/chat/ChatInterface";

/**
 * App Component - Handles only routing logic
 * Redux Provider is handled in index.js or main.js
 */
function App() {
  const { isAuthenticated, isInitialized } = useSelector((state) => state.auth);
  
  // Only initialize notification WebSocket when user is authenticated AND auth is initialized
  // This prevents making API calls before tokens are loaded
  const shouldInitializeNotifications = isAuthenticated && isInitialized;
  useNotifications({ enabled: shouldInitializeNotifications });
  
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Protected Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:conversationId"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/phone/:recipientPhone"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conversations"
          element={
            <ProtectedRoute>
              <ConversationList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/new-conversation"
          element={
            <ProtectedRoute>
              <NewConversation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat-dashboard"
          element={
            <ProtectedRoute>
              <ChatDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

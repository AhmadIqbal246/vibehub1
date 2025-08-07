import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./store/ProtectedRoute";

// Pages
import LoginPage from "./pages/RegisterationPage/LoginPage";
import SignupPage from "./pages/RegisterationPage/SignupPage";
import UserProfile from "./pages/UserProfile";
import ChatPage from "./pages/ChatDashboardPage/ChatPage";
import ConversationList from "./components/mutualcomponents/Conversations/ConversationList";
import NewConversation from "./components/mutualcomponents/Conversations/NewConversation";
import ChatDashboard from "./pages/ChatDashboardPage/ChatDashboard";

/**
 * App Component - Handles only routing logic
 * Redux Provider is handled in index.js or main.js
 */
function App() {
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

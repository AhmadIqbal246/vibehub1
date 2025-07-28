import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider, useSelector } from 'react-redux';
import store from './store/store';
import { initializeAuthState } from './store/auth/authActions';
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoginPage from "./pages/RegisterationPage/LoginPage";
import SignupPage from "./pages/RegisterationPage/SignupPage";
import UserProfile from "./pages/UserProfile";
import ChatPage from "./pages/ChatDashboardPage/ChatPage";
import ConversationList from "./components/mutualcomponents/Conversations/ConversationList";
import NewConversation from "./components/mutualcomponents/Conversations/NewConversation";
import ChatDashboard from "./pages/ChatDashboardPage/ChatDashboard";

const AppContent = () => {
  const { isInitialized } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isInitialized) {
      store.dispatch(initializeAuthState());
    }
  }, [isInitialized]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
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
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;

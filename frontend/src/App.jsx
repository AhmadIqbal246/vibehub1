import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import UserProfile from "./components/UserProfile";
import ChatPage from "./components/ChatPage"; // ✅ Import ChatPage
import ConversationList from "./components/ConversationList";
import NewConversation from "./components/NewConversation";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/chat/:conversationId" element={<ChatPage />} />
        <Route path="/conversations" element={<ConversationList />} />
        <Route path="/new-conversation" element={<NewConversation />} />
      </Routes>
    </Router>
  );
}

export default App;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosConfig";
import ENV from "../../config";
import ConversationList from "../../components/mutualcomponents/Conversations/ConversationList";
import ChatInterface from "../../components/chat/ChatInterface";

function getCurrentUsername() {
  return localStorage.getItem("username");
}

function ChatPage() {
  const { conversationId, recipientPhone } = useParams();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const currentUsername = getCurrentUsername();
  // Add state for mobile view management
  const [showChatInterface, setShowChatInterface] = useState(false);

  // Load conversation when component mounts with conversationId
  useEffect(() => {
    if (conversationId) {
      const loadInitialConversation = async () => {
        try {
          const res = await axiosInstance.get(
            `${ENV.BASE_API_URL}/chat/api/conversations/`
          );
          if (res.status === 200) {
            const conversations = res.data.conversations || res.data;
            const conversation = conversations.find(conv => conv.id.toString() === conversationId);
            if (conversation) {
              setSelectedConversation(conversation);
            }
          }
        } catch (err) {
          console.error("Failed to load conversation", err);
        }
      };

      loadInitialConversation();
      // Show chat interface on mobile when conversationId is present
      setShowChatInterface(true);
    } else if (recipientPhone) {
      // No conversation yet, clear selected conversation
      setSelectedConversation(null);
      // Show chat interface on mobile when recipientPhone is present
      setShowChatInterface(true);
    } else {
      // No conversation or recipient, show conversation list on mobile
      setShowChatInterface(false);
      setSelectedConversation(null);
    }
  }, [conversationId, recipientPhone]);

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    navigate(`/chat/${conversation.id}`);
    // Show chat interface on mobile when conversation is selected
    setShowChatInterface(true);
  };

  // Handle back button click for mobile
  const handleBackClick = () => {
    setShowChatInterface(false);
    setSelectedConversation(null);
    navigate('/chat');
  };

  // Handle conversation creation from recipient phone
  const handleConversationCreated = (conversation) => {
    setSelectedConversation(conversation);
    // Update URL to reflect new conversation
    navigate(`/chat/${conversation.id}`, { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Conversation List Panel - Hidden on mobile when chat is active */}
      <div className={`${showChatInterface ? 'hidden md:block' : 'block'} md:block`}>
        <ConversationList onConversationSelect={handleConversationSelect} selectedConversationId={selectedConversation?.id} />
      </div>

      {/* Chat Interface - Hidden on mobile when conversation list is active */}
      <div className={`${showChatInterface ? 'block' : 'hidden md:block'} md:block flex-2`}>
        <ChatInterface
          selectedConversation={selectedConversation}
          recipientPhone={recipientPhone}
          currentUsername={currentUsername}
          onBackClick={handleBackClick}
          showMobileBackButton={true}
          onConversationCreated={handleConversationCreated}
          onConversationSelect={handleConversationSelect}
          className="h-full"
        />
      </div>
    </div>
  );
}

export default ChatPage;

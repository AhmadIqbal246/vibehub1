import React, { useEffect, useState } from "react";
import axios from "axios";
import ENV from "../../../config";
import { useNavigate } from "react-router-dom";
import { User, MessageCircle, Clock, Check, CheckCheck, Search } from "lucide-react";
import { Navbar } from "../Navbar/Navbar";
import InputField from "../../common/InputField";
import Avatar from "../../common/Avatar";

function ConversationList({ onConversationSelect, selectedConversationId }) {
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const currentUsername = localStorage.getItem("username");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${ENV.BASE_API_URL}/chat/api/conversations/`, {
        withCredentials: true,
      })
      .then((res) => {
        setConversations(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch conversations");
        setLoading(false);
      });
  }, []);

  const getOtherParticipant = (participants) => {
    return participants.find(p => p.username !== currentUsername) || participants[0];
  };

  const getUserInitials = (user) => {
    if (!user) return '';
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    }
    return user.username.charAt(0).toUpperCase();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv.participants);
    return other.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (other.first_name && other.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (other.last_name && other.last_name.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const handleConversationClick = (conversation) => {
    if (onConversationSelect) {
      onConversationSelect(conversation);
    }
    navigate(`/chat/${conversation.id}`);
  };

  return (
    <>
      {/* Navbar - Fixed on the left */}
      <Navbar />
      
      {/* Conversation List - Next to navbar */}
      <div className="ml-16 md:ml-64 flex-1 flex">
        <div className="w-full max-w-md border-r border-gray-200 bg-white">
          {/* Header */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
              <button
                onClick={() => navigate('/new-conversation')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <MessageCircle size={20} />
                <span>New Chat</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="mt-4">
              <InputField
                id="search-conversations"
                name="search-conversations"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="m-4">
              <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                {error}
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div className="h-[calc(100vh-180px)] overflow-y-auto">
            {loading ? (
              // Loading Skeletons
              [...Array(6)].map((_, i) => (
                <div key={i} className="px-4 py-4 border-b border-gray-100 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3 mt-2"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : filteredConversations.length === 0 ? (
              // Empty state remains the same
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
                {searchTerm ? (
                  <>
                    <p className="text-lg font-medium mb-2">No matching conversations</p>
                    <p className="text-gray-500">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">No conversations yet</p>
                    <p className="text-gray-500">Start a new conversation to begin chatting</p>
                  </>
                )}
              </div>
            ) : (
              // Modified Conversation List items
              filteredConversations.map((conv) => {
                const otherParticipant = getOtherParticipant(conv.participants);
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleConversationClick(conv)}
                    className={`block px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 relative cursor-pointer ${
                      selectedConversationId === conv.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative flex-shrink-0">
                        <Avatar
                          src={otherParticipant.profile_picture_url}
                          initials={getUserInitials(otherParticipant)}
                          alt={otherParticipant.username}
                          size="md"
                        />
                        {conv.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h3 className="font-semibold text-gray-900 truncate">
                              {otherParticipant.first_name
                                ? `${otherParticipant.first_name} ${otherParticipant.last_name}`
                                : otherParticipant.username}
                            </h3>
                            <p className="text-sm text-black-500 font-semibold">
                              {otherParticipant.phone_number || 'No phone number'}
                            </p>
                          </div>
                          {conv.last_message && (
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                              {formatTime(conv.last_message.timestamp)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center mt-1">
                          <p className="text-sm text-gray-600 truncate flex-1">
                            {conv.last_message ? conv.last_message.content : "No messages yet"}
                          </p>
                          {conv.last_message && conv.last_message.sender_username === currentUsername && (
                            <div className="ml-2 flex-shrink-0 text-gray-400">
                              {conv.last_message.is_read ? (
                                <CheckCheck size={16} className="text-blue-500" />
                              ) : (
                                <Check size={16} />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ConversationList;
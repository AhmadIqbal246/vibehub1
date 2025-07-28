import React, { useEffect, useState } from "react";
import axios from "axios";
// import ENV from "../../config";
import { Link } from "react-router-dom";
// import { Navbar } from "./Navbar";
import { User, MessageCircle, Clock, Check, CheckCheck, Search } from "lucide-react";

function ConversationList() {
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const currentUsername = localStorage.getItem("username");

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

  return (
    <div className="flex h-screen bg-gray-50">
      <Navbar />
      
      {/* Main Content */}
      <div className="flex flex-1 ml-16 md:ml-64">
        {/* Conversation List Panel - Increased width */}
        <div className="w-full max-w-md border-r border-gray-200 bg-white">
          {/* Header */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
              <Link
                to="/new-conversation"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <MessageCircle size={20} />
                <span>New Chat</span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
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
                  <Link
                    key={conv.id}
                    to={`/chat/${conv.id}`}
                    className="block px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 relative"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative flex-shrink-0">
                        {otherParticipant.profile_picture_url ? (
                          <img
                            src={`${ENV.BASE_API_URL}${otherParticipant.profile_picture_url}`}
                            alt={otherParticipant.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-black-500 font-bold" />
                          </div>
                        )}
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
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Empty Chat Area remains the same */}
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Conversation</h3>
            <p className="text-gray-500">Choose a conversation from the list to start chatting</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConversationList;
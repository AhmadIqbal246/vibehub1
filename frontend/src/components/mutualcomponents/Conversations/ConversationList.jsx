import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../../../utils/axiosConfig";
import ENV from "../../../config";
import { useNavigate } from "react-router-dom";
import { User, MessageCircle, Clock, Check, CheckCheck, Search, Trash, ChevronDown } from "lucide-react";
import { Navbar } from "../Navbar/Navbar";
import InputField from "../../common/InputField";
import Avatar from "../../common/Avatar";
import Popup from "../../common/Popup";
import usePagination from '../../../hooks/usePagination';

function ConversationList({ onConversationSelect, selectedConversationId }) {
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const currentUsername = localStorage.getItem("username");
  const navigate = useNavigate();
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Pagination hook for conversations
  const {
    currentPage,
    hasNext,
    hasPrevious,
    totalItems,
    updatePaginationData,
    nextPage,
    previousPage,
    loading: paginationLoading,
    setLoading: setPaginationLoading
  } = usePagination(6); // 6 conversations per page

  // WebSocket connection for real-time conversation updates
  useEffect(() => {
    const connectConversationWebSocket = () => {
      try {
        const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
        const wsUrl = `${wsScheme}://localhost:8000/ws/conversations/`;
        
        ws.current = new WebSocket(wsUrl);
        
        ws.current.onopen = () => {
          console.log('Conversation WebSocket connected');
          // Send a ping to keep connection alive
          ws.current.send(JSON.stringify({ type: 'ping' }));
        };
        
        ws.current.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            
            if (data.type === 'conversation_update') {
              const updatedConversation = data.conversation;
              
              setConversations((prevConversations) => {
                const existingIndex = prevConversations.findIndex(
                  conv => conv.id === updatedConversation.id
                );
                
                if (existingIndex >= 0) {
                  // Update existing conversation
                  const updated = [...prevConversations];
                  updated[existingIndex] = updatedConversation;
                  // Move to top for new messages
                  const [conversation] = updated.splice(existingIndex, 1);
                  return [conversation, ...updated];
                } else {
                  // Add new conversation to the top
                  return [updatedConversation, ...prevConversations];
                }
              });
            } else if (data.type === 'conversation_delete') {
              setConversations((prevConversations) =>
                prevConversations.filter(conv => conv.id !== data.conversation_id)
              );
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };
        
        ws.current.onerror = (error) => {
          console.error('Conversation WebSocket error:', error);
        };
        
        ws.current.onclose = (event) => {
          console.log('Conversation WebSocket closed:', event.code);
          // Attempt to reconnect after 5 seconds
          if (event.code !== 1000) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connectConversationWebSocket();
            }, 5000);
          }
        };
      } catch (error) {
        console.error('Failed to create conversation WebSocket:', error);
      }
    };
    
    // Connect to WebSocket
    connectConversationWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close(1000, 'Component unmounting');
      }
    };
  }, []);
  
  // Load initial conversations
  useEffect(() => {
    fetchConversations();
  }, [currentPage]);

  const fetchConversations = async () => {
    try {
      // Only show loading skeleton for initial load (page 1)
      if (currentPage === 1) {
        setLoading(true);
      }
      setPaginationLoading(true);
      
      const response = await axiosInstance.get(
        `${ENV.BASE_API_URL}/chat/api/conversations/?page=${currentPage}&page_size=8`
      );
      
      console.log('Conversations API Response:', response.data);
      
      if (currentPage === 1) {
        setConversations(response.data.conversations);
      } else {
        setConversations((prev) => [...prev, ...response.data.conversations]);
      }
      
      if (response.data.pagination) {
        console.log('Conversations Pagination Data:', response.data.pagination);
        updatePaginationData(response.data.pagination);
      }
    } catch (err) {
      setError("Failed to fetch conversations");
    } finally {
      if (currentPage === 1) {
        setLoading(false);
      }
      setPaginationLoading(false);
    }
  };

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

  // Show popup instead of confirm
  const handleDeleteButtonClick = (conversationId, e) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setShowDeletePopup(true);
  };

  // Only perform deletion if confirmed in popup
  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;
    try {
      console.log(`Attempting to delete conversation ${conversationToDelete}`);
      console.log('Current user:', currentUsername);
      
      const response = await axiosInstance.delete(`${ENV.BASE_API_URL}/chat/api/conversation/${conversationToDelete}/delete/`);
      console.log('Delete response:', response.data);
      
      setConversations(prev => prev.filter(conv => conv.id !== conversationToDelete));
      setShowDeletePopup(false);
      setConversationToDelete(null);
      setError(""); // Clear any previous errors
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      let errorMessage = "Failed to delete conversation";
      if (error.response?.status === 403) {
        errorMessage = "Access denied. You don't have permission to delete this conversation.";
      } else if (error.response?.status === 404) {
        errorMessage = "Conversation not found.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setError(errorMessage);
      setShowDeletePopup(false);
      setConversationToDelete(null);
    }
  };

  return (
    <>
      {/* Delete Confirmation Popup */}
      <Popup
        open={showDeletePopup}
        onClose={() => { setShowDeletePopup(false); setConversationToDelete(null); }}
        title="Delete Conversation"
        description="Are you sure you want to delete this conversation? This will only remove it from your view."
        showClose={false}
      >
        <div className="flex justify-end space-x-2 mt-4">
          <button
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold shadow-sm transition cursor-pointer"
            onClick={() => { setShowDeletePopup(false); setConversationToDelete(null); }}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-bold shadow-lg transition cursor-pointer"
            onClick={handleDeleteConversation}
          >
            Delete
          </button>
        </div>
      </Popup>
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
                    className={`block px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 relative cursor-pointer group ${
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
                          <div className="flex items-center space-x-2">
                            {conv.last_message && (
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                {formatTime(conv.last_message.timestamp)}
                              </span>
                            )}
                            {/* Delete button - visible on hover */}
                            <button
                              onClick={(e) => handleDeleteButtonClick(conv.id, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
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
            
            {/* Load More Button */}
            {hasNext && (
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={nextPage}
                  disabled={paginationLoading}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {paginationLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div>
                  ) : (
                    <ChevronDown size={16} />
                  )}
                  {paginationLoading ? 'Loading...' : 'Load More Conversations'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ConversationList;

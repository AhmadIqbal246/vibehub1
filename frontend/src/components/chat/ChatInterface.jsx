import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../../utils/axiosConfig";
import ENV from "../../config";
import { User, Send, Phone, Video, MoreVertical, MessageCircle, Check, CheckCheck, Mic, StopCircle, Edit, Trash, X, Smile, ArrowLeft, ChevronUp, Play, Pause } from "lucide-react";
import InputField from "../common/InputField";
import Avatar from "../common/Avatar";
import EmojiPicker from 'emoji-picker-react';
import usePagination from '../../hooks/usePagination';
import AudioMessage from './AudioMessage';

function ChatInterface({ 
  selectedConversation, 
  recipientPhone, 
  currentUsername,
  onBackClick,
  showMobileBackButton = true,
  onConversationCreated,
  onConversationSelect,
  className = ""
}) {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  // Add state for recipient phone chat
  const [recipientProfile, setRecipientProfile] = useState(null);
  // Add state for message options on mobile
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  // Add state for typing indicator
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  // Add state for tracking visible messages for read receipts
  const visibleMessagesRef = useRef(new Set());
  const lastReadMessageRef = useRef(null);
  
  // Pagination state for messages
  const {
    currentPage: messagePage,
    hasNext: hasMoreMessages,
    updatePaginationData: updateMessagePagination,
    nextPage: loadMoreMessages,
    loading: messagesLoading,
    setLoading: setMessagesLoading,
    reset: resetMessagePagination
  } = usePagination(15); // 15 messages per page
  
  // State to track if we should show "see older messages" button
  const [showLoadOlderButton, setShowLoadOlderButton] = useState(false);
  const messagesContainerRef = useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load messages when component mounts with conversationId
  useEffect(() => {
    if (selectedConversation) {
      const loadInitialConversation = async () => {
        try {
          resetMessagePagination();
          const res = await axiosInstance.get(
            `${ENV.BASE_API_URL}/chat/api/conversation/${selectedConversation.id}/messages/?page=1&page_size=15`
          );
          if (res.status === 200) {
            console.log('Messages API Response:', res.data);
            setMessages(res.data.messages || res.data);
            if (res.data.pagination) {
              console.log('Messages Pagination Data:', res.data.pagination);
              updateMessagePagination(res.data.pagination);
            }
            // Auto-scroll to bottom on initial load to show latest messages
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          } else {
            setError("Failed to fetch messages");
          }
        } catch (err) {
          setError("Failed to load messages");
        }
      };

      loadInitialConversation();
      connectWebSocket(selectedConversation.id);
    } else if (recipientPhone) {
      // No conversation yet, clear messages
      setMessages([]);
      setError("");
    } else {
      // No conversation or recipient, clear everything
      setMessages([]);
      setError("");
    }
  }, [selectedConversation, recipientPhone]);

  // WebSocket connection
  const connectWebSocket = (convId) => {
    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
      ws.current.close();
    }

    setTimeout(() => {
      try {
        const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
        // Get JWT token from localStorage and add it as query parameter
        const token = localStorage.getItem('access_token');
        const wsUrl = `${wsScheme}://localhost:8000/ws/chat/${convId}/${token ? `?token=${token}` : ''}`;

        setConnectionStatus("Connecting...");
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          setConnectionStatus("Connected");
          setError("");
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        };

        ws.current.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.error) {
              setError(data.error);
              return;
            }
            
            // Handle different action types
            if (data.action_type === 'edit') {
              // Update the edited message
              setMessages((prev) => {
                return prev.map(msg => {
                  if (msg.id == data.id) {
                    return { ...msg, content: data.content };
                  }
                  return msg;
                });
              });
              return;
            } else if (data.action_type === 'delete') {
              // Remove the deleted message
              setMessages((prev) => {
                return prev.filter(msg => msg.id != data.id);
              });
              return;
            } else if (data.action_type === 'typing_indicator') {
              // Handle typing indicator
              const { username, is_typing } = data;
              if (username !== currentUsername) {
                setTypingUsers((prev) => {
                  const newSet = new Set(prev);
                  if (is_typing) {
                    newSet.add(username);
                  } else {
                    newSet.delete(username);
                  }
                  return newSet;
                });
              }
              return;
            } else if (data.action_type === 'read_receipt') {
              // Handle read receipt
              const { message_id, reader_username } = data;
              if (reader_username !== currentUsername) {
                setMessages((prev) => {
                  return prev.map(msg => {
                    if (msg.id == message_id) {
                      return { ...msg, is_read: true };
                    }
                    return msg;
                  });
                });
              }
              return;
            } else if (data.action_type === 'new_message') {
              // Handle new message
              const newMessage = {
                content: data.content,
                sender_username: data.sender_username,
                timestamp: data.timestamp,
                is_read: data.is_read,
                id: data.id,
                sender_profile_picture: data.sender_profile_picture,
                message_type: data.message_type || 'text',
                audio_data_base64: data.audio_data_base64
              };

              setMessages((prev) => {
                const ids = new Set(prev.map((msg) => msg.id));
                if (ids.has(newMessage.id)) return prev;
                return [...prev, newMessage];
              });

              // Also update the conversation list in real-time
              if (typeof window.updateConversationList === 'function') {
                window.updateConversationList(data.conversation_id, newMessage);
              }

              return; // Return after handling new message
            }

            // Handle new message
            const newMessage = {
              content: data.content,
              sender_username: data.sender_username,
              timestamp: data.timestamp,
              is_read: data.is_read,
              id: data.id,
              sender_profile_picture: data.sender_profile_picture,
              message_type: data.message_type || 'text',
              audio_data_base64: data.audio_data_base64
            };

            setMessages((prev) => {
              const ids = new Set(prev.map((msg) => msg.id));
              if (ids.has(newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          } catch (err) {
            console.error("Error parsing message", err);
            setError("Error parsing message from server");
          }
        };

        ws.current.onerror = () => {
          setConnectionStatus("Error");
          setError("WebSocket connection error");
        };

        ws.current.onclose = (event) => {
          setConnectionStatus("Disconnected");
          if (event.code !== 1000) {
            setError(`Connection closed unexpectedly (Code: ${event.code})`);
            reconnectTimeoutRef.current = setTimeout(() => connectWebSocket(convId), 5000);
          }
        };
      } catch (err) {
        setError("Failed to create WebSocket connection");
        setConnectionStatus("Error");
      }
    }, 100);
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        // Release the microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("Error accessing microphone: " + err.message);
    }
  };
  
  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Send message (text or audio)
  const handleSend = async (e) => {
    e.preventDefault();
    
    // If in edit mode, update the message instead of sending a new one
    if (editingMessageId) {
      handleUpdateMessage();
      return;
    }
    
    if ((!content.trim() && !audioBlob) || (!selectedConversation && !recipientPhone)) return;

    if (selectedConversation) {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        if (audioBlob) {
          // Send audio message
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            // Extract base64 data from the DataURL
            const base64Data = reader.result.split(',')[1];
            const messageData = {
              content: "Audio message", // Placeholder text for audio messages
              sender_username: currentUsername,
              message_type: 'audio',
              audio_data_base64: base64Data
            };
            ws.current.send(JSON.stringify(messageData));
            setAudioBlob(null);
          };
        } else {
          // Send text message
          const messageData = {
            content: content.trim(),
            sender_username: currentUsername,
            message_type: 'text'
          };
          ws.current.send(JSON.stringify(messageData));
          setContent("");
        }
      } else {
        setError("WebSocket not connected. Attempting to reconnect...");
        connectWebSocket(selectedConversation.id);
      }
    } else if (recipientPhone) {
      // No conversation yet, send first message via REST API
      try {
        let messageData = { recipient_phone: recipientPhone };
        if (audioBlob) {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          await new Promise((resolve) => {
            reader.onloadend = resolve;
          });
          const base64Data = reader.result.split(',')[1];
          messageData = {
            ...messageData,
            content: "Audio message",
            message_type: "audio",
            audio_data_base64: base64Data,
          };
        } else {
          messageData = {
            ...messageData,
            content: content.trim(),
            message_type: "text",
          };
        }
        const res = await axiosInstance.post(
          `${ENV.BASE_API_URL}/chat/api/send-message/`,
          messageData
        );
        
        // Clear form after successful send
        setContent("");
        setAudioBlob(null);
        
        // Instead of navigating, update the current state
        if (res.data && res.data.conversation_id) {
          // Set the conversation and connect WebSocket
          const conversationData = res.data.conversation;
          
          // Add the message to local state
          const newMessage = {
            ...res.data.message,
            sender_username: currentUsername,
          };
          setMessages([newMessage]);
          
          // Connect to WebSocket for real-time messaging
          connectWebSocket(res.data.conversation_id);
          
          // Notify parent components about the new conversation
          if (onConversationCreated) {
            onConversationCreated(conversationData);
          }
          if (onConversationSelect) {
            onConversationSelect(conversationData);
          }
        }
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to send message");
      }
    }
  };
  
  // Start editing a message
  const handleEditMessage = (message) => {
    if (message.message_type !== 'text') {
      setError("Only text messages can be edited");
      return;
    }
    
    setEditingMessageId(message.id);
    setEditContent(message.content);
    setContent(message.content);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
    setContent("");
  };
  
  // Handle typing status
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        const typingData = {
          action_type: 'typing',
          sender_username: currentUsername
        };
        ws.current.send(JSON.stringify(typingData));
      }
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        const stopTypingData = {
          action_type: 'stop_typing',
          sender_username: currentUsername
        };
        ws.current.send(JSON.stringify(stopTypingData));
      }
    }, 3000);
  };

  // Update message via WebSocket
  const handleUpdateMessage = () => {
    if (!editingMessageId || !content.trim() || !selectedConversation) return;
    
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const messageData = {
        action_type: 'edit',
        message_id: editingMessageId,
        content: content.trim(),
        sender_username: currentUsername
      };
      ws.current.send(JSON.stringify(messageData));
      setContent("");
      setEditingMessageId(null);
      setEditContent("");
    } else {
      setError("WebSocket not connected. Attempting to reconnect...");
      connectWebSocket(selectedConversation.id);
    }
  };
  
  // Delete message via WebSocket
  const handleDeleteMessage = (messageId) => {
    if (!messageId || !selectedConversation) return;
    
    if (window.confirm("Are you sure you want to delete this message?")) {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        const messageData = {
          action_type: 'delete',
          message_id: messageId,
          sender_username: currentUsername
        };
        ws.current.send(JSON.stringify(messageData));
      } else {
        setError("WebSocket not connected. Attempting to reconnect...");
        connectWebSocket(selectedConversation.id);
      }
    }
  };

  // Send read receipts for messages via WebSocket
  const markMessagesAsRead = (messageIds) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && messageIds.length > 0) {
      const readData = {
        action_type: 'mark_read',
        reader_username: currentUsername,
        message_ids: messageIds
      };
      ws.current.send(JSON.stringify(readData));
      console.log('Sent read receipts for messages:', messageIds);
    }
  };

  // Scroll to bottom only for new real-time messages or initial load
  useEffect(() => {
    if (messages.length === 0) return;
    
    const prevMessages = messagesRef.current || [];
    const currentMessages = messages;
    
    // Check if this is initial load (first time messages are set)
    if (prevMessages.length === 0 && currentMessages.length > 0) {
      // Initial load - scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else if (currentMessages.length > prevMessages.length) {
      // Check if new messages were added at the end (real-time messages)
      const lastOldMessage = prevMessages[prevMessages.length - 1];
      const lastNewMessage = currentMessages[currentMessages.length - 1];
      
      if (!lastOldMessage || lastOldMessage.id !== lastNewMessage.id) {
        // New message at the end - scroll to bottom
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
    
    messagesRef.current = messages;
  }, [messages]);

  // Mark messages as read when they become visible
  useEffect(() => {
    if (messages.length > 0 && selectedConversation) {
      // Get unread messages from other users that need to be marked as read
      const unreadMessages = messages.filter(msg => 
        msg.sender_username !== currentUsername && !msg.is_read
      );
      
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg.id);
        // Mark as read after a short delay (user has time to see them)
        const readTimeout = setTimeout(() => {
          markMessagesAsRead(messageIds);
        }, 1000);
        
        return () => clearTimeout(readTimeout);
      }
    }
  }, [messages, currentUsername, selectedConversation]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close(1000, "Component unmounting");
      }
    };
  }, []);

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find(
      (participant) => participant.username !== currentUsername
    );
  };

  const getUserInitials = (user) => {
    if (!user) return '';
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    }
    if (user.sender_username) { // For message objects
        return user.sender_username.charAt(0).toUpperCase();
    }
    return user.username.charAt(0).toUpperCase();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle message selection for mobile options
  const handleMessageSelect = (messageId) => {
    setSelectedMessageId(selectedMessageId === messageId ? null : messageId);
  };

  // Close message options
  const closeMessageOptions = () => {
    setSelectedMessageId(null);
  };
  
  // Fetch older messages if available
  const handleLoadOlderMessages = async () => {
    if (!selectedConversation) return;

    setMessagesLoading(true);
    
    try {
      const res = await axiosInstance.get(
        `${ENV.BASE_API_URL}/chat/api/conversation/${selectedConversation.id}/messages/?page=${messagePage + 1}&page_size=15`
      );

      if (res.status === 200) {
        console.log('Load More Messages API Response:', res.data);
        setMessages((prevMessages) => [...res.data.messages, ...prevMessages]);
        if (res.data.pagination) {
          console.log('Load More Messages Pagination Data:', res.data.pagination);
          updateMessagePagination(res.data.pagination);
        }
      }
    } catch (error) {
      setError('Error loading older messages.');
    } finally {
      setMessagesLoading(false);
    }
  };

  // If no conversation or recipient, show empty state on desktop only
  if (!selectedConversation && !recipientPhone) {
    return (
      <div className={`flex flex-col bg-white relative ${className}`}>
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="flex items-center justify-center h-full text-gray-500">
            <MessageCircle className="w-12 h-12" />
            <p className="ml-2 text-lg">Select a conversation or start a new chat</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white relative ${className}`}>
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          {/* Back button for mobile */}
          {showMobileBackButton && onBackClick && (
            <button 
              onClick={onBackClick}
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div className="relative">
            {selectedConversation ? (
              <Avatar
                src={getOtherParticipant(selectedConversation).profile_picture_url}
                initials={getUserInitials(getOtherParticipant(selectedConversation))}
                alt={getOtherParticipant(selectedConversation).username}
                size="md"
              />
            ) : (
              <Avatar initials={recipientPhone.charAt(0)} alt={recipientPhone} size="md" />
            )}
          </div>
          <div className="ml-4">
            <h2 className="font-semibold text-gray-900">
              {selectedConversation
                ? (getOtherParticipant(selectedConversation).first_name
                    ? `${getOtherParticipant(selectedConversation).first_name} ${getOtherParticipant(selectedConversation).last_name}`
                    : getOtherParticipant(selectedConversation).username)
                : `Chat with ${recipientPhone}`}
            </h2>
            <p className="text-sm text-gray-500">
              {typingUsers.size > 0 ? (
                <span className="text-green-500 font-medium">
                  {Array.from(typingUsers)[0]} is typing...
                </span>
              ) : (
                selectedConversation
                  ? getOtherParticipant(selectedConversation).phone_number
                  : `Phone: ${recipientPhone}`
              )}
            </p>
          </div>
        </div>
        {selectedConversation && (
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Video className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div 
        className="h-[calc(100vh-200px)] overflow-y-auto p-6 space-y-4 bg-gray-50"
        onClick={closeMessageOptions}
      >
        {/* Load Older Messages Button */}
        {hasMoreMessages && (
          <div className="flex justify-center py-4">
            <button
              onClick={handleLoadOlderMessages}
              disabled={messagesLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {messagesLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div>
              ) : (
                <ChevronUp size={16} />
              )}
              {messagesLoading ? 'Loading...' : 'See Older Messages'}
            </button>
          </div>
        )}
        {messages.length > 0 ? messages.map((msg) => {
          const isCurrentUser = msg.sender_username === currentUsername;
          return (
            <div
              key={msg.id}
              className={`flex items-end space-x-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isCurrentUser && (
                <div className="flex-shrink-0">
                  <Avatar
                    src={msg.sender_profile_picture}
                    initials={getUserInitials(msg)}
                    alt={msg.sender_username}
                    size="xs"
                  />
                </div>
              )}
              {msg.message_type === 'audio' ? (
                <div className="relative group">
                  {/* Mobile 3-dots menu for current user's messages */}
                  {isCurrentUser && (
                    <div className="absolute -top-2 -right-2 opacity-100 group-hover:opacity-100 transition-opacity md:hidden z-10">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMessageSelect(msg.id);
                        }}
                        className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-lg transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  )}
                  {/* Edit/Delete buttons for current user's messages - Desktop */}
                  {isCurrentUser && (
                    <div className="absolute right-0 top-0 transform translate-x-1 -translate-y-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex z-10">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMessage(msg.id);
                        }}
                        className="p-1 bg-white text-red-500 rounded-full shadow-md hover:bg-red-50 transition-colors"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  )}
                  
                  <AudioMessage 
                    audioData={msg.audio_data_base64} 
                    isCurrentUser={isCurrentUser}
                    messageId={msg.id}
                  />
                  
                  {/* Mobile options for current user's messages */}
                  {isCurrentUser && selectedMessageId === msg.id && (
                    <div className="absolute top-0 right-0 mt-2 mr-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 md:hidden">
                      <div className="flex flex-col">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMessage(msg.id);
                            closeMessageOptions();
                          }}
                          className="flex items-center px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash size={16} className="mr-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    isCurrentUser
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                  } relative group`}
                >
                  {/* Mobile 3-dots menu for current user's messages */}
                  {isCurrentUser && (
                    <div className="absolute -top-2 -right-2 opacity-100 group-hover:opacity-100 transition-opacity md:hidden">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMessageSelect(msg.id);
                        }}
                        className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-lg transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  )}
                  {/* Edit/Delete buttons for current user's messages - Desktop */}
                  {isCurrentUser && (
                    <div className="absolute right-0 top-0 transform translate-x-1 -translate-y-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMessage(msg);
                        }}
                        className="p-1 bg-white text-blue-500 rounded-full shadow-md hover:bg-blue-50 transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMessage(msg.id);
                        }}
                        className="p-1 bg-white text-red-500 rounded-full shadow-md hover:bg-red-50 transition-colors"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  )}
                  
                  <div className="text-gray-800">
                    {msg.content}
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>{formatTime(msg.timestamp)}</span>
                      {isCurrentUser && (
                        <div className="ml-2 flex-shrink-0">
                          {msg.is_read ? (
                            <CheckCheck size={16} className="text-yellow-400" />
                          ) : (
                            <Check size={16} className="text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Mobile options for current user's messages */}
                  {isCurrentUser && selectedMessageId === msg.id && (
                    <div className="absolute top-0 right-0 mt-2 mr-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 md:hidden">
                      <div className="flex flex-col">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMessage(msg);
                            closeMessageOptions();
                          }}
                          className="flex items-center px-4 py-3 text-blue-600 hover:bg-blue-50 transition-colors border-b border-gray-100"
                        >
                          <Edit size={16} className="mr-3" />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMessage(msg.id);
                            closeMessageOptions();
                          }}
                          className="flex items-center px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash size={16} className="mr-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }) : null}
        {error && <p className="text-center text-red-500">{error}</p>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white relative">
        {showEmojiPicker && (
          <div 
            ref={emojiPickerRef} 
            className="absolute bottom-16 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200"
          >
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                setContent((prevContent) => prevContent + emojiData.emoji);
                // Do NOT close the picker here - let users pick multiple emojis
              }}
              width={300}
              height={400}
              searchDisabled={false}
              skinTonesDisabled={false}
            />
          </div>
        )}
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          {audioBlob ? (
            <div className="flex-1 flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
              <div className="text-sm text-gray-600 flex-1">Audio message ready to send</div>
              <button 
                type="button" 
                onClick={() => setAudioBlob(null)} 
                className="text-red-500 hover:text-red-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <InputField
              id="message-input"
              name="message"
              placeholder={editingMessageId ? "Edit your message..." : "Type a message..."}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                handleTyping();
              }}
              className="flex-1"
              disabled={isRecording}
            />
          )}
          {!isRecording && !audioBlob && !editingMessageId && (
            <button
              type="button"
              onClick={startRecording}
              className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
          {isRecording && (
            <button
              type="button"
              onClick={stopRecording}
              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors animate-pulse"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              console.log('Emoji picker button clicked, current state:', showEmojiPicker);
              setShowEmojiPicker(!showEmojiPicker);
            }}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={!content.trim() && !audioBlob}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatInterface;

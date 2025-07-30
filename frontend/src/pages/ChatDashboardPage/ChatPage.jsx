import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosConfig";
import ENV from "../../config";
import { Navbar } from "../../components/mutualcomponents/Navbar/Navbar";
import ConversationList from "../../components/mutualcomponents/Conversations/ConversationList";
import { User, Send, Phone, Video, MoreVertical, MessageCircle, Check, CheckCheck, Mic, StopCircle, Edit, Trash, X, Smile, ArrowLeft } from "lucide-react";
import InputField from "../../components/common/InputField";
import Avatar from "../../components/common/Avatar";
import EmojiPicker from 'emoji-picker-react';

function getCurrentUsername() {
  return localStorage.getItem("username");
}

function ChatPage() {
  const { conversationId, recipientPhone } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const currentUsername = getCurrentUsername();
  // Add state for recipient phone chat
  const [recipientProfile, setRecipientProfile] = useState(null);
  // Add state for mobile view management
  const [showChatInterface, setShowChatInterface] = useState(false);
  // Add state for message options on mobile
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  // Load messages when component mounts with conversationId
  useEffect(() => {
    if (conversationId) {
      const loadInitialConversation = async () => {
        try {
          const res = await fetch(
            `${ENV.BASE_API_URL}/chat/api/conversation/${conversationId}/messages/`,
            { credentials: "include" }
          );
          if (res.ok) {
            const data = await res.json();
            setMessages(data);
          } else {
            setError("Failed to fetch messages");
          }
        } catch (err) {
          setError("Failed to load messages");
        }
      };

      loadInitialConversation();
      connectWebSocket(conversationId);
      
      // Show chat interface on mobile when conversationId is present
      setShowChatInterface(true);
    } else if (recipientPhone) {
      // No conversation yet, clear messages
      setMessages([]);
      setSelectedConversation(null);
      setError("");
      
      // Show chat interface on mobile when recipientPhone is present
      setShowChatInterface(true);
    } else {
      // No conversation or recipient, show conversation list on mobile
      setShowChatInterface(false);
      setSelectedConversation(null);
    }
  }, [conversationId, recipientPhone]);

  // WebSocket connection
  const connectWebSocket = (convId) => {
    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
      ws.current.close();
    }

    setTimeout(() => {
      try {
        const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
        const wsUrl = `${wsScheme}://localhost:8000/ws/chat/${convId}/`;

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

  // Handle conversation selection
  const handleConversationSelect = async (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    setError("");
    navigate(`/chat/${conversation.id}`);

    try {
      const res = await fetch(
        `${ENV.BASE_API_URL}/chat/api/conversation/${conversation.id}/messages/`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      } else {
        setError("Failed to fetch messages");
      }
    } catch (err) {
      setError("Failed to load messages");
    }

    connectWebSocket(conversation.id);
    
    // Show chat interface on mobile when conversation is selected
    setShowChatInterface(true);
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
        // After first message, redirect to the new conversation page
        if (res.data && res.data.conversation_id) {
          navigate(`/chat/${res.data.conversation_id}`);
        } else if (res.data && res.data.conversation) {
          // fallback if conversation object is returned
          navigate(`/chat/${res.data.conversation.id}`);
        } else {
          // fallback: reload conversations
          navigate(`/conversations`);
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

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  // Handle back button click for mobile
  const handleBackClick = () => {
    setShowChatInterface(false);
    // Don't navigate, just hide chat interface and show conversation list
  };

  // Handle message selection for mobile options
  const handleMessageSelect = (messageId) => {
    setSelectedMessageId(selectedMessageId === messageId ? null : messageId);
  };

  // Close message options
  const closeMessageOptions = () => {
    setSelectedMessageId(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversation List Panel - Hidden on mobile when chat is active */}
      <div className={`${showChatInterface && (selectedConversation || recipientPhone) ? 'hidden md:block' : 'block'} md:block`}>
        <ConversationList onConversationSelect={handleConversationSelect} selectedConversationId={selectedConversation?.id} />
      </div>

      {/* Chat Area - Hidden on mobile when conversation list is active or no conversation selected */}
      <div className={`${showChatInterface && (selectedConversation || recipientPhone) ? 'block' : 'hidden md:block'} md:block flex-2 flex flex-col bg-white relative`}>
          {(selectedConversation || recipientPhone) ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center">
                  {/* Back button for mobile */}
                  <button 
                    onClick={handleBackClick}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
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
                      {selectedConversation
                        ? getOtherParticipant(selectedConversation).phone_number
                        : `Phone: ${recipientPhone}`}
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
                className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 md:pb-24 h-full"
                onClick={closeMessageOptions}
              >
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
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          isCurrentUser
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                        } relative group`}
                      >
                        {/* Mobile 3-dots menu for current user's messages */}
                        {isCurrentUser && (msg.message_type === 'text' || msg.message_type === 'audio') && (
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
                        {isCurrentUser && (msg.message_type === 'text' || msg.message_type === 'audio') && (
                          <div className="absolute right-0 top-0 transform translate-x-1 -translate-y-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex">
                            {msg.message_type === 'text' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditMessage(msg);
                                }}
                                className="p-1 bg-white text-blue-500 rounded-full shadow-md hover:bg-blue-50 transition-colors"
                              >
                                <Edit size={14} />
                              </button>
                            )}
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
                        {msg.message_type === 'audio' ? (
                          <div className="audio-message flex items-center space-x-2 py-1">
                            <div className="audio-player-container w-full relative">
                              <div className="flex items-center space-x-2" data-loading="true">
                                <div className="absolute inset-0 flex items-center justify-center audio-loading z-10 bg-opacity-50 bg-white rounded-lg" style={{display: 'flex'}}>
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const audio = e.currentTarget.parentNode.querySelector('audio');
                                    if (audio.paused) {
                                      audio.play();
                                      e.currentTarget.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
                                    } else {
                                      audio.pause();
                                      e.currentTarget.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
                                    }
                                  }}
                                  className={`p-2 rounded-full flex-shrink-0 ${isCurrentUser ? 'bg-blue-400 hover:bg-blue-300 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-5 h-5">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                  </svg>
                                </button>
                                <div className="w-full">
                                  <div 
                                    className={`h-1.5 rounded-full w-full ${isCurrentUser ? 'bg-blue-300' : 'bg-gray-300'} cursor-pointer`}
                                    onClick={(e) => {
                                      const audio = e.currentTarget.parentNode.parentNode.querySelector('audio');
                                      const progressBar = e.currentTarget.querySelector('.audio-progress');
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const clickPosition = (e.clientX - rect.left) / rect.width;
                                      audio.currentTime = clickPosition * audio.duration;
                                      progressBar.style.width = `${clickPosition * 100}%`;
                                    }}
                                  >
                                    <div className={`h-full rounded-full ${isCurrentUser ? 'bg-white' : 'bg-gray-500'} w-0 audio-progress`}></div>
                                  </div>
                                  <div className="flex justify-between text-xs mt-1 text-gray-500">
                                    <span className="audio-current-time">0:00</span>
                                    <span className="audio-duration">0:00</span>
                                  </div>
                                </div>
                                <audio 
                                  src={`data:audio/webm;base64,${msg.audio_data_base64}`} 
                                  className="hidden"
                                  onLoadedMetadata={(e) => {
                                    const audio = e.target;
                                    const container = e.target.parentNode.parentNode;
                                    const durationEl = container.querySelector('.audio-duration');
                                    const loadingEl = container.querySelector('.audio-loading');
                                    if (loadingEl) {
                                      loadingEl.style.display = 'none';
                                    }
                                    container.setAttribute('data-loading', 'false');
                                    let minutes = 0, seconds = 0;
                                    if (isFinite(audio.duration) && !isNaN(audio.duration)) {
                                      minutes = Math.floor(audio.duration / 60);
                                      seconds = Math.floor(audio.duration % 60);
                                    }
                                    durationEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                                  }}
                                  onTimeUpdate={(e) => {
                                    const audio = e.target;
                                    const progressBar = e.target.parentNode.parentNode.querySelector('.audio-progress');
                                    const currentTimeEl = e.target.parentNode.parentNode.querySelector('.audio-current-time');
                                    const percent = (audio.currentTime / audio.duration) * 100;
                                    progressBar.style.width = `${percent}%`;
                                    let minutes = 0, seconds = 0;
                                    if (isFinite(audio.currentTime) && !isNaN(audio.currentTime)) {
                                      minutes = Math.floor(audio.currentTime / 60);
                                      seconds = Math.floor(audio.currentTime % 60);
                                    }
                                    currentTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                                  }}
                                  onEnded={(e) => {
                                    const playButton = e.target.parentNode.parentNode.querySelector('button');
                                    playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-800">
                            {msg.content}
                            <div className="text-xs text-gray-500 mt-1">
                              {formatTime(msg.timestamp)}
                            </div>
                          </div>
                        )}
                        
                        {/* Mobile options for current user's messages */}
                        {isCurrentUser && (msg.message_type === 'text' || msg.message_type === 'audio') && selectedMessageId === msg.id && (
                          <div className="absolute top-0 right-0 mt-2 mr-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 md:hidden">
                            <div className="flex flex-col">
                              {msg.message_type === 'text' && (
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
                              )}
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
                    </div>
                  );
                }) : null}
                {error && <p className="text-center text-red-500">{error}</p>}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area - Fixed to bottom of chat interface on desktop */}
              <div className="p-4 border-t border-gray-200 bg-white relative md:sticky md:bottom-0 md:left-0 md:right-0 md:z-10">
                {showEmojiPicker && (
                  <div className="absolute bottom-full mb-2 z-50 bg-white rounded shadow-lg p-2">
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        setContent((prevContent) => prevContent + emojiData.emoji);
                        // Do NOT close the picker here
                      }}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(false)}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
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
                      onChange={(e) => setContent(e.target.value)}
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
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
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
            </>
          ) : (
            // On mobile, show conversation list instead of empty message when no conversation is selected
            <div className="md:flex md:items-center md:justify-center md:h-full md:text-gray-500 hidden">
              <div className="flex items-center justify-center h-full text-gray-500">
                <MessageCircle className="w-12 h-12" />
                <p className="ml-2 text-lg">Select a conversation or start a new chat</p>
              </div>
            </div>
          )}
        </div>
      </div>

  );
}

export default ChatPage;
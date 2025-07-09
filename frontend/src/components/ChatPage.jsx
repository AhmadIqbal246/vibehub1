import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import ENV from "../config";

function getCurrentUsername() {
  return localStorage.getItem("username") || "ahmadiqbalhsp@gmail.com";
}

function ChatPage() {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const USERNAME = getCurrentUsername();

  const connectWebSocket = () => {
    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
      ws.current.close();
    }

    setTimeout(() => {
      try {
        const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
        const wsUrl = `${wsScheme}://localhost:8000/ws/chat/${conversationId}/`;

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

            const newMessage = {
              content: data.content || data.body || data.message || "",
              sender: data.sender || data.sender_username || "Unknown",
              id: data.id || `${Date.now()}-${Math.random()}`,
            };

            setMessages((prev) => {
              const ids = new Set(prev.map((msg) => msg.id));
              if (ids.has(newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          } catch  {
            console.error("Error parsing message");
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
            reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5173);
          }
        };
      } catch  {
        setError("Failed to create WebSocket connection");
        setConnectionStatus("Error");
      }
    }, 100);
  };

  useEffect(() => {
    fetchInitialMessages();
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close(1000, "Component unmounting");
      }
    };
    // eslint-disable-next-line
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchInitialMessages = async () => {
    try {
      const res = await fetch(
        `${ENV.BASE_API_URL}/chat/api/conversation/${conversationId}/messages/`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(
          data.map((m) => ({
            content: m.content || m.body || m.message || "",
            sender: m.sender_username || m.sender || "Unknown",
            id: m.id || `${Date.now()}-${Math.random()}`,
          }))
        );
      } else {
        setError("Failed to fetch messages");
      }
    } catch  {
      setError("Failed to load messages");
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const messageData = {
        content: content,
        sender_username: USERNAME,
      };

      ws.current.send(JSON.stringify(messageData));
      setContent("");
    } else {
      setError("WebSocket not connected. Attempting to reconnect...");
      connectWebSocket();
    }
  };

  const handleReconnect = () => {
    connectWebSocket();
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2>Conversation</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              color:
                connectionStatus === "Connected"
                  ? "green"
                  : connectionStatus === "Connecting..."
                  ? "orange"
                  : "red",
            }}
          >
            {connectionStatus}
          </span>
          {connectionStatus !== "Connected" && (
            <button
              onClick={handleReconnect}
              style={{ fontSize: 12, padding: "4px 8px" }}
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          height: 350,
          overflowY: "auto",
          border: "1px solid #ccc",
          marginBottom: 12,
          padding: 8,
          borderRadius: 6,
          background: "#fafbfc",
        }}
      >
        {messages.map((m, index) => (
          <div
            key={`${m.id}-${index}`}
            style={{
              color: "blue",
              margin: "8px 0",
              textAlign: m.sender === USERNAME ? "right" : "left",
            }}
          >
            <b>{m.sender}:</b> {m.content}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      <form onSubmit={handleSend} style={{ display: "flex", gap: 8 }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={2}
          style={{ flex: 1, resize: "none" }}
          placeholder="Type your message..."
          disabled={connectionStatus !== "Connected"}
        />
        <button
          type="submit"
          style={{ padding: "0 24px" }}
          disabled={connectionStatus !== "Connected"}
        >
          Send
        </button>
      </form>

      {error && <div style={{ marginTop: 10, color: "red" }}>{error}</div>}
    </div>
  );
}

export default ChatPage;

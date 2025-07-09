import React, { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import ENV from "../config";
import { useNavigate } from "react-router-dom";

function NewConversation() {
  const [recipientPhone, setRecipientPhone] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(
        `${ENV.BASE_API_URL}/chat/api/create-conversation/`,
        { recipient_phone: recipientPhone },
        {
          withCredentials: true,
          headers: { "X-CSRFToken": Cookies.get("csrftoken") },
        }
      );
      // Redirect to the conversation page (e.g., /chat/42)
      navigate(`/chat/${res.data.id}`);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to start conversation");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 40 }}>
      <h2>Start a new conversation</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Recipient Phone"
          value={recipientPhone}
          onChange={(e) => setRecipientPhone(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 10, padding: 8 }}
        />
        <button type="submit" style={{ width: "100%", padding: 10 }}>
          Start Conversation
        </button>
      </form>
      {error && (
        <div style={{ marginTop: 10, color: "red" }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default NewConversation;
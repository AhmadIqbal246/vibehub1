import React, { useEffect, useState } from "react";
import axios from "axios";
import ENV from "../config";
import { Link } from "react-router-dom";

function ConversationList() {
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${ENV.BASE_API_URL}/chat/api/conversations/`, {
        withCredentials: true,
      })
      .then((res) => setConversations(res.data))
      .catch((err) => setError("Failed to fetch conversations"));
  }, []);

  return (
    <div>
      <h2>Your Conversations</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <ul>
        {conversations.map((c) => (
          <li key={c.id}>
            {c.participants.join(", ")}{" "}
            <Link to={`/chat/${c.id}`}>Open Chat</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ConversationList;
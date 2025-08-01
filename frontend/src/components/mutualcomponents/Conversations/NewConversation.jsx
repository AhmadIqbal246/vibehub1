import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Popup from "../../common/Popup";

function NewConversation() {
  const [recipientPhone, setRecipientPhone] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(true); // Always open on page
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setOpen(false);
    navigate(`/chat/phone/${recipientPhone}`);
  };

  const handleCancel = () => {
    setOpen(false);
    navigate('/chat/1');
  };

  return (
    <Popup
      open={open}
      // Do not pass onClose to remove the cross button
      title="Start a New Conversation"
      description="Enter the phone number of the person you want to chat with."
      showClose={false}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          placeholder="Recipient Phone"
          value={recipientPhone}
          onChange={(e) => setRecipientPhone(e.target.value)}
          required
          className="w-full px-5 py-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-pink-200 text-lg bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 placeholder-gray-400 shadow-sm transition"
        />
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="px-6 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold shadow-sm transition"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold shadow-lg hover:from-blue-600 hover:to-pink-600 transition"
          >
            Start Conversation
          </button>
        </div>
      </form>
    </Popup>
  );
}

export default NewConversation;
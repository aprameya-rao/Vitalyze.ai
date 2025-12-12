import React, { useState } from "react";
import '../App.css'

function Chatbot() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi, I am Vitalyze Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Simulate sending and receiving a reply
    const newMessages = [
      ...messages,
      { from: "user", text: trimmed },
      { from: "bot", text: "Thanks for your message. A smarter reply can be added here later." }
    ];
    setMessages(newMessages);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    // Note: Removed 'chatbot-center-wrapper' as the centering margin is usually handled by 'chatbot-container' max-width/margin-auto in app.css
    <div className="chatbot-container">
      {/* ADDED chat-header for better styling */}
      <div className="chat-header">Vitalyze AI Chatbot</div> 
      
      <div className="chat-messages">
        {messages.map((m, idx) => (
          <div
            key={idx}
            // Mapped to .message, .user-message, and .ai-message from app.css
            className={`message ${m.from === "bot" ? "ai-message" : "user-message"}`}
          >
            {m.text}
          </div>
        ))}
      </div>
      
      <div className="chat-input-area">
        <input
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          // Mapped to .chat-input and global .input-field styles
          className="chat-input input-field" 
        />
        <button 
          onClick={handleSend}
          // Mapped to .send-button from app.css
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chatbot;
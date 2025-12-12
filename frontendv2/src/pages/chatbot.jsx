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
    <div className="chatbot-container">
      <div className="chat-header">Vitalyze AI Chatbot</div> 
      
      <div className="chat-messages">
        {messages.map((m, idx) => (
          <div
            key={idx}
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
          className="chat-input input-field" 
        />
        <button 
          onClick={handleSend}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chatbot;
import React, { useState } from "react";

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
    <div className="chatbot-center-wrapper">
      <div className="chatbot-container">
        <div className="chatbot-messages">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`chatbot-message ${m.from === "bot" ? "bot" : "user"}`}
            >
              {m.text}
            </div>
          ))}
        </div>
        <div className="chatbot-input-area">
          <input
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;

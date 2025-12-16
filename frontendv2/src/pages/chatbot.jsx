import React, { useState, useRef, useEffect } from "react";
import api from "../services/api";
import '../App.css';

function Chatbot() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi, I am Vitalyze AI. I can answer your medical questions. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Auto-scroll to bottom of chat
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // 1. Add User Message immediately
    const newMessages = [...messages, { from: "user", text: trimmed }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // 2. Call Backend API
      const response = await api.post("/chat/", { message: trimmed });
      
      // 3. Add AI Response
      const botReply = response.data.response;
      setMessages((prev) => [...prev, { from: "bot", text: botReply }]);

    } catch (err) {
      console.error("Chat Error:", err);
      setMessages((prev) => [
        ...prev, 
        { from: "bot", text: "Sorry, I'm having trouble connecting to the server right now. Please try again later." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) handleSend();
  };

  return (
    <div className="chatbot-container">
      <div className="chat-header">
        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Vitalyze AI Assistant</span>
        <span style={{ fontSize: '0.8rem', opacity: 0.8, display: 'block' }}>Powered by Gemini Medical AI</span>
      </div> 
      
      <div className="chat-messages">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`message ${m.from === "bot" ? "ai-message" : "user-message"}`}
          >
            {m.text}
          </div>
        ))}
        
        {loading && (
          <div className="message ai-message typing-indicator">
            <span>●</span><span>●</span><span>●</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-area">
        <input
          placeholder="Ask a medical question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="chat-input input-field" 
          disabled={loading}
        />
        <button 
          onClick={handleSend}
          className="send-button"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chatbot;
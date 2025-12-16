import React, { useState, useEffect } from "react";
import api from "../services/api";
import "../App.css";

function Reminders() {
  const [activeTab, setActiveTab] = useState("daily"); // 'daily' or 'refill'
  const [userId, setUserId] = useState(localStorage.getItem("user_id") || "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Daily Reminder State
  const [dailyForm, setDailyForm] = useState({
    medicine_name: "",
    timings: []
  });

  // Refill Reminder State
  const [refillForm, setRefillForm] = useState({
    medicine_name: "",
    initial_quantity: 10,
    frequency_per_day: 1
  });

  const handleTimingChange = (timing) => {
    setDailyForm(prev => {
      const exists = prev.timings.includes(timing);
      if (exists) return { ...prev, timings: prev.timings.filter(t => t !== timing) };
      return { ...prev, timings: [...prev.timings, timing] };
    });
  };

  const handleDailySubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setMsg("Error: Missing User ID. Please Register again to generate one.");
      return;
    }
    setLoading(true);
    setMsg("");

    try {
      await api.post(`/reminders/daily/${userId}`, dailyForm);
      setMsg("✅ Daily reminder set successfully!");
      setDailyForm({ medicine_name: "", timings: [] });
    } catch (err) {
      setMsg("❌ Failed to set reminder: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRefillSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setMsg("Error: Missing User ID.");
      return;
    }
    setLoading(true);
    setMsg("");

    try {
      const response = await api.post(`/reminders/refill/${userId}`, refillForm);
      setMsg(`✅ Refill reminder set! Next refill date: ${new Date(response.data.refill_date).toLocaleDateString()}`);
      setRefillForm({ medicine_name: "", initial_quantity: 10, frequency_per_day: 1 });
    } catch (err) {
      setMsg("❌ Failed to set refill reminder: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reminders-container" style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Medicine Reminders</h1>
      
      {/* Dev Helper: Input ID manually if missing from Login */}
      {!userId && (
        <div style={{ background: "#fff3cd", padding: "10px", marginBottom: "20px", fontSize: "0.9rem" }}>
          <strong>Dev Note:</strong> User ID not found. <br />
          <input 
            placeholder="Paste User ID here (from Register response)" 
            value={userId} 
            onChange={(e) => {
              setUserId(e.target.value);
              localStorage.setItem("user_id", e.target.value);
            }}
            style={{ width: "100%", marginTop: "5px", padding: "5px" }}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button 
          className={activeTab === "daily" ? "btn-primary" : "btn-secondary"}
          onClick={() => setActiveTab("daily")}
        >
          Daily Intake
        </button>
        <button 
          className={activeTab === "refill" ? "btn-primary" : "btn-secondary"}
          onClick={() => setActiveTab("refill")}
        >
          Refill Tracker
        </button>
      </div>

      {msg && <div className={`status-msg ${msg.includes("Error") || msg.includes("Failed") ? "error-msg" : "success-msg"}`} style={{ marginBottom: "15px", padding: "10px", background: msg.includes("✅") ? "#d4edda" : "#f8d7da", borderRadius: "5px" }}>{msg}</div>}

      {/* Daily Form */}
      {activeTab === "daily" && (
        <form onSubmit={handleDailySubmit} className="details-form">
          <label>Medicine Name</label>
          <input 
            className="details-input"
            value={dailyForm.medicine_name}
            onChange={(e) => setDailyForm({...dailyForm, medicine_name: e.target.value})}
            required
            placeholder="e.g., Paracetamol"
          />
          
          <label>Select Timings</label>
          <div style={{ display: "flex", gap: "15px", margin: "10px 0" }}>
            {["morning", "afternoon", "evening"].map(time => (
              <label key={time} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                <input 
                  type="checkbox" 
                  checked={dailyForm.timings.includes(time)}
                  onChange={() => handleTimingChange(time)}
                />
                {time.charAt(0).toUpperCase() + time.slice(1)}
              </label>
            ))}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Scheduling..." : "Set Daily Reminder"}
          </button>
        </form>
      )}

      {/* Refill Form */}
      {activeTab === "refill" && (
        <form onSubmit={handleRefillSubmit} className="details-form">
          <label>Medicine Name</label>
          <input 
            className="details-input"
            value={refillForm.medicine_name}
            onChange={(e) => setRefillForm({...refillForm, medicine_name: e.target.value})}
            required
          />

          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <label>Current Quantity (Tablets)</label>
              <input 
                type="number" 
                className="details-input"
                value={refillForm.initial_quantity}
                onChange={(e) => setRefillForm({...refillForm, initial_quantity: parseInt(e.target.value)})}
                min="1"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Daily Frequency</label>
              <input 
                type="number" 
                className="details-input"
                value={refillForm.frequency_per_day}
                onChange={(e) => setRefillForm({...refillForm, frequency_per_day: parseInt(e.target.value)})}
                min="1"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Calculating..." : "Set Refill Reminder"}
          </button>
        </form>
      )}
    </div>
  );
}

export default Reminders;
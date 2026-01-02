import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { authService } from "../services/api";
import "../App.css";

function SigninPage({ setUser }) {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!phone || !password) {
      setError("Please enter both phone number and password.");
      setLoading(false);
      return;
    }

    try {
      const data = await authService.login(phone, password);
      localStorage.setItem("access_token", data.access_token);
      
      // Store user ID if provided in login response (optional improvement)
      if (data.user_id) localStorage.setItem("user_id", data.user_id);

      setUser({ phone: phone }); 
      navigate("/");
      
    } catch (err) {
      console.error("Login Error:", err);
      const msg = err.response?.data?.detail || "Invalid Credentials. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <h2>Sign In to Vitalyze</h2>
      {error && <p className="error-msg">{error}</p>}

      <form onSubmit={handleLogin} className="details-form">
        <label>Phone Number</label>
        <PhoneInput
          international
          defaultCountry="IN"
          value={phone}
          onChange={setPhone}
          className="phone-input-custom"
        />

        <label style={{ marginTop: 15, display: 'block' }}>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="details-input"
          required
        />

        <button 
          type="submit" 
          className="btn-primary" 
          style={{ marginTop: 20 }}
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <p style={{ marginTop: 25, color: '#8b949e', fontSize: '0.9rem' }}>
        New User? <Link to="/register" className="text-link">Create an Account</Link>
      </p>
    </div>
  );
}

export default SigninPage;
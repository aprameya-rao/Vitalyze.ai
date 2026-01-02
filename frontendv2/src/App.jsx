import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Home from "./pages/home.jsx";
import SigninPage from "./pages/signin.jsx";
import RegisterPage from "./pages/register.jsx";
import ReportAnalyser from "./pages/report_analyser.jsx"; 
import Chatbot from "./pages/chatbot.jsx";
import MedicalLocator from "./pages/medical_locator.jsx";
import Trend from "./pages/trend.jsx";
import Reminders from "./pages/reminders.jsx"; 

import "./App.css";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Analyser", path: "/report-analyser" },
  { name: "Reminders", path: "/reminders" },
  { name: "Chatbot", path: "/chatbot" },
  { name: "Locator", path: "/medical-locator" },
  { name: "Trend", path: "/trend" },
];

function NavBar({ user, setUser }) {
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id"); 
    setUser(null);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo-link">
        <div className="logo">
          <span style={{ fontWeight: "bold", fontSize: "1.5rem", letterSpacing: "1px" }}>
            Vitalyze.ai
          </span>
        </div>
      </Link>

      <div className="nav-links">
        {navLinks.map(link => (
          <Link key={link.name} to={link.path} className="nav-link">
            {link.name}
          </Link>
        ))}
        
        {user ? (
          /* Using 'nav-link' class makes it look exactly like the other links */
          <button className="nav-link" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <Link to="/signin" className="nav-link">
            Signin
          </Link>
        )}
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(localStorage.getItem("access_token") ? { loggedIn: true } : null);

  return (
    <Router>
      <NavBar user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SigninPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/report-analyser" element={<ReportAnalyser />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/medical-locator" element={<MedicalLocator />} />
        <Route path="/trend" element={<Trend />} />
        <Route path="/reminders" element={<Reminders />} />
      </Routes>
    </Router>
  );
}

export default App;
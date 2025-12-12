import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// Import all page components
import Home from "./pages/home.jsx";
import SigninPage from "./pages/signin.jsx";
import ReportAnalyser from "./pages/report_analyser.jsx"; 
import Chatbot from "./pages/chatbot.jsx";
import MedicalLocator from "./pages/medical_locator.jsx";
import Trend from "./pages/trend.jsx";

import "./App.css";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Report Analyser", path: "/report-analyser" },
  { name: "Chatbot", path: "/chatbot" },
  { name: "Medical Locator", path: "/medical-locator" },
  { name: "Trend", path: "/trend" },
];

function NavBar({ user, setUser }) {
  const handleLogout = () => setUser(null);

  // Determine which sign-in/out link to show
  const signinPath = "/signin";

  return (
    <nav className="navbar">
      {/* 1. WRAP LOGO IN LINK TO REDIRECT TO HOME PAGE (/) */}
      <Link to="/" className="logo-link">
        <div className="logo">
          <img
            src="/logo.png"
            alt="Vitalyze Logo"
            style={{ height: 40, marginRight: 10 }}
          />
          <span>Vitalyze</span>
        </div>
      </Link>

      <div className="nav-links">
        {navLinks.map(link => (
          <Link key={link.name} to={link.path} className="nav-link">
            {link.name}
          </Link>
        ))}
        
        {/* Conditional Signin/Logout button */}
        {user ? (
          <button className="btn-logout nav-link" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <Link to={signinPath} className="nav-link">
            Signin
          </Link>
        )}
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      {/* NavBar now manages the logo click functionality */}
      <NavBar user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<Home user={user} setUser={setUser} />} />
        {/* Pass setUser to SigninPage so it can update the user state */}
        <Route path="/signin" element={<SigninPage setUser={setUser} />} />
        <Route path="/report-analyser" element={<ReportAnalyser />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/medical-locator" element={<MedicalLocator />} />
        <Route path="/trend" element={<Trend />} />
        {/* Note: I removed the redundant Signin Link from navLinks array and made it conditional here. */}
      </Routes>
    </Router>
  );
}

export default App;
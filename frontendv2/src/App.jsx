import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

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

  const signinPath = "/signin";

  return (
    <nav className="navbar">
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
      <NavBar user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<Home user={user} setUser={setUser} />} />
        <Route path="/signin" element={<SigninPage setUser={setUser} />} />
        <Route path="/report-analyser" element={<ReportAnalyser />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/medical-locator" element={<MedicalLocator />} />
        <Route path="/trend" element={<Trend />} />
      </Routes>
    </Router>
  );
}

export default App;
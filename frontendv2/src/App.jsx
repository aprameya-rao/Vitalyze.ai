import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Home from "./pages/home";
import SigninPage from "./pages/signin";
import ReportAnalyser from "./pages/report_analyser"; 
import Chatbot from "./pages/chatbot";
import MedicalLocator from "./pages/medical_locator";
import Trend from "./pages/trend";

import "./App.css";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Report Analyser", path: "/report-analyser" },
  { name: "Chatbot", path: "/chatbot" },
  { name: "Medical Locator", path: "/medical-locator" },
  { name: "Trend", path: "/trend" },
  { name: "Signin", path: "/signin" }
];

function NavBar({ user, setUser }) {
  const handleLogout = () => setUser(null);

  return (
    <nav className="navbar">
      <div className="logo">
        <img
          src="/logo.png"
          alt="Vitalyze Logo"
          style={{ height: 40, marginRight: 10 }}
        />

        <span>Vitalyze</span>
      </div>
      <div className="nav-links">
        {navLinks.map(link => (
          <Link key={link.name} to={link.path} className="nav-link">
            {link.name}
          </Link>
        ))}
        {user && (
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
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

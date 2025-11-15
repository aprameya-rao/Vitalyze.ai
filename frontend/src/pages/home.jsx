import React from 'react';
import './home.css';

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Report Analyser", path: "/report-analyser" },
  { name: "Chatbot", path: "/chatbot" },
  { name: "Medical Locator", path: "/medical-locator" },
  { name: "Trend", path: "/trend" },
  { name: "Signin", path: "/signin" },
  { name: "Logout", path: "/logout" },
];

function Home() {
  return (
    <div>
      <nav className="navbar">
        <div className="logo">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Vitalyze Logo" style={{height: 40, marginRight: 10}} />
          <span>Vitalyze</span>
        </div>
        <div className="nav-links">
          {navLinks.map(link => (
            <a key={link.name} href={link.path} className="nav-link">{link.name}</a>
          ))}
        </div>
      </nav>

      <header className="header-section">
        <div>
          <h1>Welcome to Vitalyze</h1>
          <p>
            Upload your medical prescription and instantly find the nearest medical stores.<br />
            Smart, fast, and reliable healthcare at your fingertips.
          </p>
          <a href="/report-analyser" className="btn-primary">Get Started</a>
        </div>
        <img src={`${process.env.PUBLIC_URL}/pharmacy.png`} alt="Medical" className="header-img"/>
      </header>

      <section className="features-section">
        <h2>Why Choose Vitalyze?</h2>
        <div className="features-grid">
          <div className="feature-item">
            <h3>Easy Prescription Upload</h3>
            <p>Simply upload your prescription and let us do the rest with our AI-powered analyser.</p>
          </div>
          <div className="feature-item">
            <h3>Nearest Medical Stores</h3>
            <p>Locate trusted pharmacies near you within seconds and get your medicines hassle-free.</p>
          </div>
          <div className="feature-item">
            <h3>Integrated Chatbot</h3>
            <p>Have questions? Our chatbot provides instant assistance 24/7.</p>
          </div>
        </div>
      </section>

      <section className="call-to-action">
        <h2>Start Your Health Journey Today!</h2>
        <a href="/signin" className="btn-secondary">Sign In</a>
        <a href="/signup" className="btn-primary">Create Account</a>
      </section>

      <footer className="footer">
        <p>© 2025 Vitalyze. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;

import React from "react";
import {Link} from 'react-router-dom';


function Home() {
  return (
    <div>
      <header className="header-section">
        <div className="centered-content"> 
          <h1>Welcome to Vitalyze</h1>
          <p>
            Upload your medical prescription and instantly find the nearest
            medical stores.
            <br />
            Smart, fast, and reliable healthcare at your fingertips.
          </p>
        </div>
      </header>

      <section className="features-section">
        <h2>Why Choose Vitalyze?</h2>
        <div className="features-grid">
          <div className="feature-item">
            <h3>Easy Prescription Upload</h3>
            <p>
              Simply upload your prescription and let us do the rest with our
              AI-powered analyser.
            </p>
          </div>
          <div className="feature-item">
            <h3>Nearest Medical Stores</h3>
            <p>
              Locate trusted pharmacies near you within seconds and get your
              medicines hassle-free.
            </p>
          </div>
          <div className="feature-item">
            <h3>Integrated Chatbot</h3>
            <p>Have questions? Our chatbot provides instant assistance 24/7.</p>
          </div>
        </div>
      </section>

      <section className="call-to-action">
        <h2>Start Your Health Journey Today!</h2>
      </section>

      <footer className="footer">
        <p>© 2025 Vitalyze. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
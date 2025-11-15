import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// --- Import Layout Components (Assume these are in src/components) ---
// Since we don't have these, we'll keep them commented out initially:
// import Navbar from './components/Navbar';
// import Footer from './components/Footer';

// --- Import All Pages (Must match your file names and extensions) ---
import HomePage from './pages/home.jsx'; 
import MedicalLocator from './pages/medical_locator.jsx'; 
import TrendPage from './pages/trend.jsx'; 

// Pages assigned to your teammate (assuming the names based on your file structure)
import ChatbotPage from './pages/chatbot.jsx'; 
import ReportAnalyserPage from './pages/report_analyser.jsx'; 
import SigninPage from './pages/signin.jsx';
// We'll also need a RegisterPage, likely
import RegisterPage from './pages/register.jsx'; 


function App() {
  return (
    // The <Router> is required once at the root of the application
    <Router>
      {/* This is the shared layout. Every page component rendered 
        inside the <Routes> will be placed between the Navbar and Footer.
      */}
      {/* <Navbar /> */}
      
      <main className="min-h-screen"> 
        <Routes>
          {/* Your Core Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/medical-locator" element={<MedicalLocator />} />
          <Route path="/trend" element={<TrendPage />} />

          {/* Teammate's Pages */}
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/report-analyser" element={<ReportAnalyserPage />} />
          <Route path="/signin" element={<SigninPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Optional: Add a catch-all route for 404 pages 
            <Route path="*" element={<div>404 Not Found</div>} />
          */}
        </Routes>
      </main>
      
      {/* <Footer /> */}
    </Router>
  );
}

export default App;
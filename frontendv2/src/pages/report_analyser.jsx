import React, { useState } from "react";
import ReactMarkdown from 'react-markdown';
import api from "../services/api";
import "../App.css";

function ReportAnalyser() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("idle"); 
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setErrorMsg("");
      setStatus("idle");
      setAnalysisResult(null);
    } else {
      setSelectedFile(null);
      setErrorMsg("Please select a valid PDF file.");
    }
  };

  const pollTaskStatus = (taskId) => {
    const intervalId = setInterval(async () => {
      try {
        const response = await api.get(`/reports/status/${taskId}`);
        const taskState = response.data.status;

        if (taskState === "SUCCESS") {
          clearInterval(intervalId);
          setAnalysisResult(response.data.result);
          setStatus("completed");
        } else if (taskState === "FAILURE") {
          clearInterval(intervalId);
          setErrorMsg("Analysis failed. " + (response.data.error || "Unknown error"));
          setStatus("error");
        } else {
          console.log("Analysis in progress...");
        }
      } catch (err) {
        clearInterval(intervalId);
        console.error("Polling Error:", err);
        setErrorMsg("Lost connection to server while checking status.");
        setStatus("error");
      }
    }, 2000); 
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setStatus("uploading");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await api.post("/reports/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatus("analyzing");
      pollTaskStatus(response.data.task_id);
    } catch (err) {
      console.error("Upload Error:", err);
      setStatus("error");
      setErrorMsg(err.response?.data?.detail || "Failed to upload.");
    }
  };

  // --- FILTERING LOGIC ---
  // If the backend sent 'vital_indicators', use them. Otherwise fallback to entities.
  const rawData = (analysisResult?.vital_indicators && analysisResult.vital_indicators.length > 0) 
    ? analysisResult.vital_indicators 
    : (analysisResult?.structured_entities || []);

  const hasVitals = analysisResult?.vital_indicators && analysisResult.vital_indicators.length > 0;

  // STRICT FILTER: Remove junk rows explicitly in the frontend
  const cleanedData = rawData.filter(item => {
    const label = hasVitals ? item.Indicator : item.Description;
    const value = hasVitals ? item.Value : item.Description; // check both for junk
    
    if (!label) return false;
    const lowerLabel = label.toLowerCase();
    
    // 1. Remove Junk Keywords
    const junkWords = ["qr code", "scanner", "page", "result", "visit", "date", "generated", "unit"];
    if (junkWords.some(word => lowerLabel.includes(word))) return false;

    // 2. Remove Labels that are just numbers (e.g. "3.0")
    if (!isNaN(parseFloat(label)) && isFinite(label)) return false;

    return true;
  });

  return (
    <div className="report-analyser-container">
      <h1>Report Analyser</h1>
      <p>Upload your medical report (PDF) to get a simplified AI summary.</p>

      {/* Upload Section */}
      <div className="upload-section">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="file-input"
          disabled={status === 'uploading' || status === 'analyzing'}
        />
        <button 
          onClick={handleUpload} 
          className="btn-primary"
          style={{ width: '100%', marginTop: '10px' }}
          disabled={!selectedFile || status === 'uploading' || status === 'analyzing'}
        >
          {status === 'uploading' ? 'Uploading...' : status === 'analyzing' ? 'Processing...' : 'Analyze Report'}
        </button>
      </div>

      {status === 'analyzing' && (
        <div className="status-message">
          <h3>⏳ Analyzing your report...</h3>
          <p>We are extracting text, identifying medical entities, and generating a summary.</p>
        </div>
      )}

      {errorMsg && <div className="error-msg">{errorMsg}</div>}

      {status === 'completed' && analysisResult && (
        <div className="analysis-result">
          
          <div className="summary-card">
            <h2>✨ AI Summary</h2>
            <div className="summary-text">
               <ReactMarkdown>{analysisResult.simple_summary}</ReactMarkdown>
            </div>
          </div>

          <div className="entities-card">
            <h3>🔍 Extracted Medical Details</h3>
            
            {cleanedData.length > 0 ? (
              <div className="table-container">
                <table className="entities-table">
                  <thead>
                    <tr>
                      <th>{hasVitals ? "Medical Indicator" : "Detected Entity"}</th>
                      <th>{hasVitals ? "Measured Value" : "Confidence Score"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cleanedData.map((item, idx) => (
                      <tr key={idx}>
                        {hasVitals ? (
                          <>
                            <td style={{ fontWeight: '600' }}>{item.Indicator}</td>
                            <td className="value-cell">{item.Value}</td>
                          </>
                        ) : (
                          <>
                            <td>{item.Description}</td>
                            <td style={{ color: '#8b949e' }}>
                              Confidence: {(item.Confidence * 100).toFixed(0)}%
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No specific entities detected.</p>
            )}
          </div>
        </div>
      )}

      {status === 'idle' && (
        <section className="helpful-info">
          <h2>Privacy & Tips</h2>
          <ul>
            <li>Your report is processed securely using our Healthcare AI pipeline.</li>
            <li>We only accept PDF files currently.</li>
            <li>Results are for informational purposes only. Always consult a doctor.</li>
          </ul>
        </section>
      )}
    </div>
  );
}

export default ReportAnalyser;
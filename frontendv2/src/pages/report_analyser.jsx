import React, { useState, useEffect } from "react";
import api from "../services/api";
import "../App.css";

function ReportAnalyser() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("idle"); // 'idle', 'uploading', 'analyzing', 'completed', 'error'
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Clean up state when user changes file
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

  // Function to check if the background task is done
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
          // Task is PENDING or STARTED, keep waiting...
          console.log("Analysis in progress...");
        }
      } catch (err) {
        clearInterval(intervalId);
        console.error("Polling Error:", err);
        setErrorMsg("Lost connection to server while checking status.");
        setStatus("error");
      }
    }, 2000); // Check every 2 seconds
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setStatus("uploading");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // 1. Upload File
      const response = await api.post("/reports/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const { task_id } = response.data;
      setStatus("analyzing");
      
      // 2. Start Polling for results
      pollTaskStatus(task_id);

    } catch (err) {
      console.error("Upload Error:", err);
      setStatus("error");
      setErrorMsg(
        err.response?.data?.detail || "Failed to upload report. Ensure you are logged in."
      );
    }
  };

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
          disabled={!selectedFile || status === 'uploading' || status === 'analyzing'}
        >
          {status === 'uploading' ? 'Uploading...' : 'Analyze Report'}
        </button>
      </div>

      {/* Loading Status */}
      {status === 'analyzing' && (
        <div className="status-message" style={{ marginTop: '20px', textAlign: 'center' }}>
          <h3>⏳ Analyzing your report...</h3>
          <p>We are extracting text, identifying medical entities, and generating a summary.</p>
        </div>
      )}

      {errorMsg && <div className="error-message">{errorMsg}</div>}

      {/* Results Display */}
      {status === 'completed' && analysisResult && (
        <div className="analysis-result">
          
          {/* AI Summary Card */}
          <div className="result-card summary-card" style={{ background: '#f0f9ff', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
            <h2 style={{ color: '#0056b3' }}>✨ AI Summary</h2>
            <div className="summary-text" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
               {analysisResult.simple_summary}
            </div>
          </div>

          {/* Structured Data Table */}
          <div className="result-card entities-card" style={{ marginTop: '30px' }}>
            <h3>🔍 Extracted Medical Details</h3>
            {analysisResult.structured_entities && analysisResult.structured_entities.length > 0 ? (
              <table className="entities-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr style={{ background: '#eee', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Entity</th>
                    <th style={{ padding: '10px' }}>Category</th>
                    <th style={{ padding: '10px' }}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisResult.structured_entities.map((entity, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '10px' }}>{entity.Description}</td>
                      <td style={{ padding: '10px' }}>{entity.Type}</td>
                      <td style={{ padding: '10px' }}>{entity.Confidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No specific entities detected.</p>
            )}
          </div>
        </div>
      )}

      {status === 'idle' && (
        <section className="helpful-info">
          <h3>Privacy & Tips</h3>
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
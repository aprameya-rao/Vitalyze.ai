import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area
} from "recharts";
import api from "../services/api";
import "../App.css";

const metricOptions = [
  { value: "bp", name: "Blood Pressure (Sys)", keywords: ["blood pressure", "bp", "systolic"] },
  { value: "sugar", name: "Blood Sugar / Glucose", keywords: ["sugar", "glucose", "fasting"] },
  { value: "hemoglobin", name: "Hemoglobin", keywords: ["hemoglobin", "hb"] },
  { value: "wbc", name: "White Blood Cells", keywords: ["wbc", "white blood"] },
];

function Trend() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMetric, setSelectedMetric] = useState("bp");

  // Helper: extract numeric values from report entities based on keywords
  const findValueInEntities = (entities, keywords) => {
    if (!entities) return null;
    
    // Look for a matching entity
    const match = entities.find(e => 
      keywords.some(k => e.Description.toLowerCase().includes(k))
    );

    if (match) {
      // Try to extract the first number found in the text description
      // This is a basic parser; for production, regex might need tuning based on specific report formats.
      const numMatch = match.Description.match(/(\d+(\.\d+)?)/);
      return numMatch ? parseFloat(numMatch[0]) : null;
    }
    return null;
  };

  const processReportsData = (reports) => {
    // Transform backend reports into chart-friendly data
    // Sort by date (oldest first)
    const sortedReports = reports.sort((a, b) => new Date(a.upload_date) - new Date(b.upload_date));

    return sortedReports.map(report => {
      const dateStr = new Date(report.upload_date).toLocaleDateString();
      
      // Attempt to find values in the structured entities
      return {
        date: dateStr,
        bp: findValueInEntities(report.structured_entities, metricOptions[0].keywords),
        sugar: findValueInEntities(report.structured_entities, metricOptions[1].keywords),
        hemoglobin: findValueInEntities(report.structured_entities, metricOptions[2].keywords),
        wbc: findValueInEntities(report.structured_entities, metricOptions[3].keywords),
        fileName: report.filename
      };
    });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get("/reports/history");
        const processed = processReportsData(response.data);
        setData(processed);
        
        if (processed.length === 0) {
          setError("No report history found. Upload a report to see trends!");
        }
      } catch (err) {
        console.error("Trend Fetch Error:", err);
        setError("Failed to load health history. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const currentMetricName = metricOptions.find(m => m.value === selectedMetric)?.name;

  return (
    <div className="trend-page">
      <h2 className="trend-title">Your Health Trends</h2>
      
      <div className="trend-controls">
        <label htmlFor="metric">Track Indicator:</label>
        <select
          id="metric"
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
        >
          {metricOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.name}</option>
          ))}
        </select>
      </div>

      {loading && <p>Loading your history...</p>}
      
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && data.length > 0 && (
        <>
          <div className="trend-chart-card">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data} margin={{ top: 30, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip" style={{ background: '#fff', padding: '10px', border: '1px solid #ccc' }}>
                          <p className="label">{`Date: ${label}`}</p>
                          <p className="intro">{`${currentMetricName}: ${payload[0].value}`}</p>
                          <p className="desc" style={{fontSize:'0.8em', color:'#666'}}>{`Source: ${payload[0].payload.fileName}`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={selectedMetric} 
                  stroke="#1890ff" 
                  strokeWidth={3}
                  activeDot={{ r: 8 }} 
                  connectNulls={true} // Vital: connects points even if some reports miss this metric
                />
                <Area type="monotone" dataKey={selectedMetric} fill="#bae7ff" stroke="#1890ff" opacity={0.1} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="trend-summary">
            <h3>Insight</h3>
            <p>
              Showing data extracted from <b>{data.length}</b> reports. 
              {data.filter(d => d[selectedMetric] !== null).length === 0 && 
                ` Note: We couldn't find explicit values for "${currentMetricName}" in your reports yet.`
              }
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default Trend;
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

  const findValueInEntities = (entities, keywords) => {
    if (!entities) return null;
    const match = entities.find(e => 
      keywords.some(k => e.Description.toLowerCase().includes(k))
    );
    if (match) {
      const numMatch = match.Description.match(/(\d+(\.\d+)?)/);
      return numMatch ? parseFloat(numMatch[0]) : null;
    }
    return null;
  };

  const processReportsData = (reports) => {
    const sortedReports = reports.sort((a, b) => new Date(a.upload_date) - new Date(b.upload_date));
    return sortedReports.map(report => {
      const dateStr = new Date(report.upload_date).toLocaleDateString();
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
        <label htmlFor="metric" style={{ marginRight: '15px' }}>Track Indicator:</label>
        {/* Applied the new class here */}
        <select
          id="metric"
          className="trend-dropdown"
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
        >
          {metricOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.name}</option>
          ))}
        </select>
      </div>

      {loading && <p className="loading-spinner">Loading your history...</p>}
      
      {error && <p className="error-message" style={{padding: '15px', borderRadius: '8px'}}>{error}</p>}

      {!loading && !error && data.length > 0 && (
        <>
          <div className="trend-chart-card">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data} margin={{ top: 30, right: 30, left: 10, bottom: 10 }}>
                {/* Changed Grid color to be subtle in dark mode */}
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis dataKey="date" stroke="#8b949e" />
                <YAxis domain={['auto', 'auto']} stroke="#8b949e" />
                
                {/* Updated Tooltip to use CSS class instead of inline white styles */}
                <Tooltip 
                  cursor={{ stroke: '#00bcd4', strokeWidth: 1 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p className="label">{`Date: ${label}`}</p>
                          <p className="intro">{`${currentMetricName}: ${payload[0].value}`}</p>
                          <p className="desc">{`Source: ${payload[0].payload.fileName}`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                <Line 
                  type="monotone" 
                  dataKey={selectedMetric} 
                  stroke="#00bcd4" /* Primary Cyan */
                  strokeWidth={3}
                  activeDot={{ r: 8, fill: '#00bcd4', stroke: '#fff' }} 
                  connectNulls={true}
                  dot={{ r: 4, fill: '#161b22', stroke: '#00bcd4', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey={selectedMetric} fill="#00bcd4" stroke="#00bcd4" opacity={0.1} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="trend-summary">
            <h3>Insight</h3>
            <ul style={{ margin: 0 }}>
              <li>Showing data extracted from <b>{data.length}</b> reports.</li>
              {data.filter(d => d[selectedMetric] !== null).length === 0 && 
                 <li>Note: We couldn't find explicit values for "{currentMetricName}" in your reports yet.</li>
              }
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default Trend;
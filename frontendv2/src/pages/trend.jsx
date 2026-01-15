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
  { value: "platelet", name: "Platelet Count", keywords: ["platelet", "plt"] },
  { value: "creatinine", name: "Creatinine", keywords: ["creatinine", "creat"] },
];

function Trend() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMetric, setSelectedMetric] = useState("bp");

  const findValueInEntities = (entities, keywords) => {
    if (!entities || !Array.isArray(entities)) return null;

    // 1. Find the matching entity
    const match = entities.find(e => {
      const textToSearch = (e.Indicator || e.Description || "").toLowerCase();
      return keywords.some(k => textToSearch.includes(k));
    });

    if (match) {
      // 2. Extract the string containing the number
      const valueString = match.Value || match.Description || "";

      // 3. Regex to find the first valid number (integer or decimal)
      const numMatch = valueString.match(/(\d+(\.\d+)?)/);
      
      // Return the float if found
      return numMatch ? parseFloat(numMatch[0]) : null;
    }
    return null;
  };

  const processReportsData = (reports) => {
    // Sort by date (Oldest -> Newest)
    const sortedReports = reports.sort((a, b) => new Date(a.upload_date) - new Date(b.upload_date));

    return sortedReports.map((report, index) => {
      const dateObj = new Date(report.upload_date);
      
      const dataPoint = {
        // Use timestamp (number) + index to ensure uniqueness even if dates are identical
        timestamp: dateObj.getTime() + index,
        displayDate: dateObj.toLocaleDateString(),
        fileName: report.filename
      };

      // Populate all metrics for this report
      metricOptions.forEach(metric => {
        dataPoint[metric.value] = findValueInEntities(report.structured_entities, metric.keywords);
      });

      return dataPoint;
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
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                
                {/* XAxis Updated:
                   - type="number": Treat X-axis as continuous numbers (timestamps)
                   - dataKey="timestamp": Unique ID for every point
                   - tickFormatter: Converts timestamp back to readable date
                   - padding: Adds space on left/right so dots aren't on the edge
                */}
                <XAxis 
                  dataKey="timestamp" 
                  type="number"
                  domain={['dataMin', 'dataMax']} 
                  tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString()}
                  stroke="#8b949e" 
                  padding={{ left: 30, right: 30 }}
                />

                {/* YAxis Updated:
                   - domain={[0, 'auto']}: Forces graph to start at 0
                */}
                <YAxis domain={[0, 'auto']} stroke="#8b949e" />
                
                <Tooltip 
                  cursor={{ stroke: '#00bcd4', strokeWidth: 1 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const val = payload[0].value;
                      const src = payload[0].payload.fileName;
                      const dateDisplay = payload[0].payload.displayDate; // Use pre-formatted date
                      
                      return (
                        <div className="custom-tooltip">
                          <p className="label">{`Date: ${dateDisplay}`}</p>
                          <p className="intro">{`${currentMetricName}: ${val}`}</p>
                          <p className="desc">{`Source: ${src}`}</p>
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
                  stroke="#00bcd4" 
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
              <li>
                <b>{data.filter(d => d[selectedMetric] !== null).length}</b> reports contained data for {currentMetricName}.
              </li>
              {data.filter(d => d[selectedMetric] !== null).length === 0 && 
                 <li style={{color: '#ff7b72', marginTop: '10px'}}>
                    No data points found for this metric. Try extracting a report that contains {currentMetricName}.
                 </li>
              }
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default Trend;
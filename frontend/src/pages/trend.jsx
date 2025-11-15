import React, { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";
import "./trend.css";

// Sample data — replace with your actual backend/API data
const sampleData = [
  { date: "2025-11-01", bp: 120, sugar: 95 },
  { date: "2025-11-03", bp: 118, sugar: 97 },
  { date: "2025-11-05", bp: 115, sugar: 93 },
  { date: "2025-11-07", bp: 130, sugar: 120 },
  { date: "2025-11-09", bp: 126, sugar: 110 },
  { date: "2025-11-11", bp: 122, sugar: 102 }
];

const metricOptions = [
  { value: "bp", name: "Blood Pressure" },
  { value: "sugar", name: "Blood Sugar" },
];

function Trend() {
  const [selectedMetric, setSelectedMetric] = useState("bp");

  return (
    <div className="trend-page">
      <h2 className="trend-title">Your Health Trends</h2>
      <div className="trend-controls">
        <label htmlFor="metric">Choose Metric:</label>
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
      <div className="trend-chart-card">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={sampleData} margin={{ top: 30, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={selectedMetric} stroke="#1890ff" activeDot={{ r: 8 }} />
            <Area type="monotone" dataKey={selectedMetric} fill="#bae7ff" stroke="#1890ff" opacity={0.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="trend-summary">
        <h3>Summary</h3>
        <ul>
          <li>
            Most recent {metricOptions.find(m => m.value === selectedMetric)?.name}: <b>{sampleData[sampleData.length - 1][selectedMetric]}</b>
          </li>
          <li>
            Change over period: <b>{sampleData[sampleData.length - 1][selectedMetric] - sampleData[0][selectedMetric]}</b>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Trend;

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// --- MOCK API SETUP ---
// In a real app, this would be imported from src/api/axios.js
const mockStores = [
  { id: 1, name: "City Center Pharmacy", address: "123 Main St, Anytown", distance: "2.1 km", phone: "555-0101" },
  { id: 2, name: "Express Meds", address: "456 Oak Ave, Anytown", distance: "3.5 km", phone: "555-0102" },
  { id: 3, name: "Vital Health Drugstore", address: "789 Pine Ln, Anytown", distance: "4.8 km", phone: "555-0103" },
];

const mockApi = {
  get: (endpoint, config) => {
    console.log(`MOCK API CALL: GET ${endpoint}`, config.params);
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ data: mockStores });
      }, 1000); // Simulate network latency
    });
  }
};

// --- STYLES FOR THE PREVIEW (Normally in medical_locator.css) ---
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1rem',
    fontFamily: 'Inter, sans-serif',
    backgroundColor: '#f9fafb',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    padding: '1.5rem',
    marginBottom: '1rem',
  },
  h1: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: '1rem',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: '0.5rem',
  },
  searchControls: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  select: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#f3f4f6',
    cursor: 'pointer',
    fontSize: '1rem',
    flexGrow: 1,
    minWidth: '150px'
  },
  storeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
    borderBottom: '1px solid #e5e7eb',
  },
  storeInfo: {
    flexGrow: 1,
  },
  storeName: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '0.25rem',
  },
  storeDetail: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginRight: '1rem',
  },
  actionButton: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    marginLeft: '1rem',
    transition: 'background-color 0.2s',
  },
  error: {
    color: '#ef4444',
    padding: '1rem',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.125rem',
    color: '#4f46e5',
  },
  // Navbar/Footer mock styles
  nav: {
    backgroundColor: '#4f46e5',
    padding: '1rem',
    color: 'white',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#374151',
    padding: '1rem',
    color: 'white',
    textAlign: 'center',
    marginTop: '2rem',
  }
};

// --- Mock Components for Layout ---
const Navbar = () => (
  <nav style={styles.nav}>
    <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>Vitalyze</Link>
    <span style={{ marginLeft: '1rem' }}>| Medical Locator Preview</span>
  </nav>
);
const Footer = () => <footer style={styles.footer}>© 2025 Vitalyze.ai</footer>;
const HomePage = () => <div style={styles.container}><h2>Home Page Content</h2><p>This is a placeholder for the main landing page.</p></div>;
const TrendPage = () => <div style={styles.container}><h2>Trend Page Content</h2><p>Placeholder for Health Trends.</p></div>;
const PlaceholderPage = ({ name }) => <div style={styles.container}><h2>{name}</h2><p>Placeholder for {name} functionality.</p></div>;


// --- MedicalLocator Component (Core Content) ---
const MedicalLocator = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [radius, setRadius] = useState(5); // Default search radius in km

  const fetchStores = async (lat, lng, searchRadius) => {
    setLoading(true);
    setError(null);
    try {
      // Using mockApi instead of the imported 'api' for the preview environment
      const response = await mockApi.get('/pharmacies/nearby', {
        params: { latitude: lat, longitude: lng, radius: searchRadius }
      });
      setStores(response.data);
    } catch (err) {
      console.error("API Fetch Error:", err);
      setError("Could not fetch nearby locations. Please check your network or backend status.");
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location) {
      // Fetch stores whenever location or radius changes
      fetchStores(location.lat, location.lng, radius);
    } else {
      // Get user's current location
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocation({ lat: latitude, lng: longitude });
          },
          (err) => {
            console.error("Geolocation Error:", err);
            setError("Location access denied. Please enable location services to use this feature.");
            setLoading(false);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        setError("Geolocation is not supported by your browser.");
        setLoading(false);
      }
    }
  }, [location, radius]); // Dependency array: fetches when location is first set, and when radius changes

  const handleRadiusChange = (e) => {
    const newRadius = parseInt(e.target.value);
    setRadius(newRadius);
    // Note: The useEffect dependency on 'radius' handles the refetching logic
  };

  const handleCall = (phone) => {
    // This is the correct way to trigger a call on a device
    window.location.href = `tel:${phone}`;
  };


  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>Find Nearby Pharmacies & Clinics</h1>

      {error && <div style={styles.error}>{error}</div>}

      {location && (
        <div style={styles.searchControls}>
          <div style={styles.storeDetail}>
            Current Location (Lat/Lng): {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </div>
          <select 
            value={radius} 
            onChange={handleRadiusChange} 
            disabled={loading}
            style={styles.select}
          >
            <option value={1}>Search within 1 km</option>
            <option value={3}>Search within 3 km</option>
            <option value={5}>Search within 5 km (Default)</option>
            <option value={10}>Search within 10 km</option>
          </select>
        </div>
      )}

      {loading && (
        <div style={styles.loading}>
          <div className="spinner" role="status" aria-label="Loading stores...">
            {/* Simple CSS Loading Spinner */}
            <svg style={{marginRight: '0.5rem'}} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 10.8954 4.89543 10 6 10C7.10457 10 8 10.8954 8 12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C10.8954 8 10 7.10457 10 6C10 4.89543 10.8954 4 12 4Z" fill="currentColor" opacity="0.4"/>
              <path d="M12 4C13.0454 4 13.9786 4.39706 14.6713 5.06847C15.364 5.73988 15.75 6.64333 15.75 7.60002C15.75 8.75163 15.2891 9.85593 14.4578 10.6872C13.6265 11.5185 12.5222 11.9794 11.3706 11.9794C10.219 11.9794 9.11475 11.5185 8.28345 10.6872C7.45215 9.85593 6.99121 8.75163 6.99121 7.60002C6.99121 6.64333 7.37722 5.73988 8.06992 5.06847C8.76262 4.39706 9.69584 4 10.7412 4H12Z" fill="currentColor"/>
            </svg>
            Fetching locations near you...
          </div>
        </div>
      )}

      {!loading && !error && stores.length === 0 && location && (
        <div style={styles.card}>
          <p className="text-gray-600">No pharmacies found within {radius} km. Try increasing the search radius.</p>
        </div>
      )}

      {!loading && !error && stores.length > 0 && (
        <div style={styles.card}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>
            {stores.length} Results Found
          </h2>
          <div className="store-list">
            {stores.map((store) => (
              <div key={store.id} style={styles.storeItem}>
                <div style={styles.storeInfo}>
                  <div style={styles.storeName}>{store.name}</div>
                  <div style={styles.storeDetail}>Address: {store.address}</div>
                  <div style={{ ...styles.storeDetail, color: '#4f46e5', fontWeight: 500 }}>
                    Distance: {store.distance}
                  </div>
                </div>
                <button 
                  style={styles.actionButton}
                  onClick={() => handleCall(store.phone)}
                >
                  Call ({store.phone})
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


// --- Main App Setup ---

export default MedicalLocator;


import React, { useState, useEffect } from "react";
import '../App.css'

// Mock data for now
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
      }, 1000);
    });
  }
};

const MedicalLocator = () => {
  const [stores, setStores] = useState([]);
  // Initial loading is set to TRUE to ensure data fetch runs, but the UI block is removed.
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [radius, setRadius] = useState(5);

  const fetchStores = async (lat, lng, searchRadius) => {
    setLoading(true);
    setError(null);
    try {
      const response = await mockApi.get("/pharmacies/nearby", {
        params: { latitude: lat, longitude: lng, radius: searchRadius },
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
      fetchStores(location.lat, location.lng, radius);
    } else {
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
  }, [location, radius]);

  const handleRadiusChange = (e) => {
    const newRadius = parseInt(e.target.value, 10);
    setRadius(newRadius);
  };

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="medical-locator-container">
      {/* Mapped to .main-title and .subtitle from app.css */}
      <h1 className="main-title">Medical Locator</h1>
      <p className="subtitle">Find Nearby Pharmacies & Clinics</p>

      {/* Mapped to .error-message from app.css */}
      {error && <div className="error-message">{error}</div>}

      {location && (
        <div className="search-controls">
          {/* Mapped to .location-info from app.css */}
          <div className="location-info">
            Current Location (Lat/Lng): {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </div>
          {/* Mapped to .radius-dropdown (uses base input styles) */}
          <select
            value={radius}
            onChange={handleRadiusChange}
            disabled={loading}
            className="radius-dropdown"
          >
            <option value={1}>Search within 1 km</option>
            <option value={3}>Search within 3 km</option>
            <option value={5}>Search within 5 km (Default)</option>
            <option value={10}>Search within 10 km</option>
          </select>
        </div>
      )}

      {/* Removed the loading animation block as requested */}

      {!loading && !error && stores.length === 0 && location && (
        // Mapped to .no-results-message from app.css
        <div className="no-results-message">
          <p>No pharmacies found within {radius} km. Try increasing the search radius.</p>
        </div>
      )}

      {!loading && !error && stores.length > 0 && (
        <div className="store-list">
          <h2 className="subtitle">{stores.length} Results Found</h2>
          {stores.map((store) => (
            // Mapped to .store-card from app.css
            <div key={store.id} className="store-card">
              <div className="store-header">
                <div className="store-name">{store.name}</div>
                {/* Distance uses .store-distance badge style */}
                <div className="store-distance">{store.distance}</div>
              </div>
              
              {/* Address with Icon placeholder */}
              <div className="store-address">
                <span className="icon-small">📍</span> {store.address} 
              </div>
              
              {/* Phone with Icon placeholder */}
              <div className="store-phone">
                <span className="icon-small">📞</span> {store.phone}
              </div>
              
              {/* Button uses the defined futuristic call-button style */}
              <button
                className="call-button"
                onClick={() => handleCall(store.phone)}
              >
                Call Store
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalLocator;
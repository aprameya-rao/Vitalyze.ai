import React, { useState, useEffect } from "react";

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
    <div className="medloc-container">
      <h1 className="medloc-title">Find Nearby Pharmacies & Clinics</h1>

      {error && <div className="medloc-error">{error}</div>}

      {location && (
        <div className="medloc-controls">
          <div className="medloc-location">
            Current Location (Lat/Lng): {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </div>
          <select
            value={radius}
            onChange={handleRadiusChange}
            disabled={loading}
            className="medloc-radius-select"
          >
            <option value={1}>Search within 1 km</option>
            <option value={3}>Search within 3 km</option>
            <option value={5}>Search within 5 km (Default)</option>
            <option value={10}>Search within 10 km</option>
          </select>
        </div>
      )}

      {loading && (
        <div className="medloc-loading">
          <div className="spinner" role="status" aria-label="Loading stores...">
            Fetching locations near you...
          </div>
        </div>
      )}

      {!loading && !error && stores.length === 0 && location && (
        <div className="medloc-card">
          <p>No pharmacies found within {radius} km. Try increasing the search radius.</p>
        </div>
      )}

      {!loading && !error && stores.length > 0 && (
        <div className="medloc-card">
          <h2 className="medloc-results-title">{stores.length} Results Found</h2>
          <div className="medloc-store-list">
            {stores.map((store) => (
              <div key={store.id} className="medloc-store-item">
                <div className="medloc-store-info">
                  <div className="medloc-store-name">{store.name}</div>
                  <div className="medloc-store-detail">Address: {store.address}</div>
                  <div className="medloc-store-detail medloc-store-distance">
                    Distance: {store.distance}
                  </div>
                </div>
                <button
                  className="medloc-call-btn"
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

export default MedicalLocator;

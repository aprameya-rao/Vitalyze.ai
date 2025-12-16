import React, { useState, useEffect } from "react";
import api from "../services/api"; // Import the API service
import '../App.css';

const MedicalLocator = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [radius, setRadius] = useState(5000); // Default 5000 meters (5km)

  // Helper: Calculate distance between two coords (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1); // Return distance in km with 1 decimal
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const fetchStores = async (lat, lng, searchRadius) => {
    setLoading(true);
    setError(null);
    try {
      // Backend expects radius in METERS
      const response = await api.get("/maps/pharmacies", {
        params: { lat: lat, lng: lng, radius: searchRadius },
      });
      
      // Process result to add distance
      const resultsWithDistance = response.data.map(store => ({
        ...store,
        distanceVal: calculateDistance(lat, lng, store.geometry.lat, store.geometry.lng)
      }));

      // Sort by distance
      resultsWithDistance.sort((a, b) => a.distanceVal - b.distanceVal);
      
      setStores(resultsWithDistance);
    } catch (err) {
      console.error("API Fetch Error:", err);
      // Handle the specific error if API key is missing
      if (err.response && err.response.status === 503) {
        setError("Maps Service Unavailable (Server Config Error).");
      } else {
        setError("Could not fetch pharmacies. Ensure you are logged in.");
      }
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
    // 1. Get User Location on Mount
    if (!location) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocation({ lat: latitude, lng: longitude });
          },
          (err) => {
            console.error("Geolocation Error:", err);
            // Show a more specific error based on the code
            if (err.code === 1) {
              setError("Location permission denied. Please allow location access in your browser.");
            } else if (err.code === 2) {
              setError("Location unavailable. Check your device's location services.");
            } else if (err.code === 3) {
              setError("Location request timed out. Please refresh or try again.");
            } else {
              setError("An unknown error occurred getting your location.");
            }
            setLoading(false);
          },
          // FIX IS HERE:
          // enableHighAccuracy: false -> Uses Wi-Fi/IP (Faster, works indoors)
          // timeout: 20000 -> Wait 20 seconds before failing
          { enableHighAccuracy: false, timeout: 20000, maximumAge: 0 }
        );
      } else {
        setError("Geolocation is not supported by your browser.");
        setLoading(false);
      }
    } else {
      // 2. Fetch stores whenever location or radius changes
      fetchStores(location.lat, location.lng, radius);
    }
  }, [location, radius]);

  const handleRadiusChange = (e) => {
    setRadius(parseInt(e.target.value, 10));
  };

  const handleViewMap = (placeId) => {
    // Open Google Maps with the specific Place ID
    const url = `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${placeId}`;
    window.open(url, '_blank');
  };

  return (
    <div className="medical-locator-container">
      <h1 className="main-title">Medical Locator</h1>
      <p className="subtitle">Find Trusted Pharmacies Near You</p>

      {/* Show Error if exists */}
      {error && <div className="error-message">{error}</div>}

      {/* Controls */}
      {location && (
        <div className="search-controls">
          <div className="location-info">
            Current Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </div>
          <select
            value={radius}
            onChange={handleRadiusChange}
            disabled={loading}
            className="radius-dropdown"
          >
            <option value={1000}>Search within 1 km</option>
            <option value={3000}>Search within 3 km</option>
            <option value={5000}>Search within 5 km</option>
            <option value={10000}>Search within 10 km</option>
          </select>
        </div>
      )}

      {loading && <div className="loading-spinner">Locating Pharmacies...</div>}

      {/* Results */}
      {!loading && !error && stores.length === 0 && location && (
        <div className="no-results-message">
          <p>No pharmacies found within {(radius/1000)} km.</p>
        </div>
      )}

      {!loading && !error && stores.length > 0 && (
        <div className="store-list">
          <h2 className="subtitle">{stores.length} Results Found</h2>
          {stores.map((store, index) => (
            <div key={store.place_id || index} className="store-card">
              <div className="store-header">
                <div className="store-name">{store.name}</div>
                <div className="store-distance">{store.distanceVal} km</div>
              </div>
              
              <div className="store-address">
                <span className="icon-small">📍</span> {store.vicinity || "Address not available"}
              </div>
              
              <div className="store-rating">
                <span className="icon-small">⭐</span> 
                {store.rating ? `${store.rating} (${store.user_ratings_total || 0} reviews)` : "No ratings yet"}
              </div>
              
              <button
                className="call-button"
                onClick={() => handleViewMap(store.place_id)}
              >
                View on Map ↗
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalLocator;
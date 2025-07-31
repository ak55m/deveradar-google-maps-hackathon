import { GoogleMap, Marker, useJsApiLoader, HeatmapLayer, InfoWindow } from "@react-google-maps/api";
import { useEffect, useState, useMemo } from "react";
import { getDevelopers, subscribeToDevelopers } from "./supabaseHelpers";
import { supabase } from "./supabaseClient";

// Static libraries array to prevent recreation on every render
const GOOGLE_MAPS_LIBRARIES = ["visualization"];

export default function MapView() {
  const [developers, setDevelopers] = useState([]);
  const [mapError, setMapError] = useState(null);
  const [hoveredDeveloper, setHoveredDeveloper] = useState(null);
  const [isReloading, setIsReloading] = useState(false);

  // 🔑 Get API key from environment variable or use placeholder
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY";
  const isApiKeyConfigured = apiKey !== "YOUR_GOOGLE_MAPS_API_KEY";

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: "google-map-script",
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const loadDevelopers = async () => {
    try {
      const devs = await getDevelopers();
      setDevelopers(devs || []);
    } catch (error) {
      console.error("Error loading developers:", error);
      setMapError("Failed to load developers");
    }
  };

  const handleReload = async () => {
    setIsReloading(true);
    await loadDevelopers();
    setTimeout(() => setIsReloading(false), 1000);
  };

  useEffect(() => {
    loadDevelopers();

    const channel = subscribeToDevelopers(async () => {
      const devs = await getDevelopers();
      setDevelopers(devs || []);
    });

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Create heatmap data
  const heatmapData = useMemo(() => {
    if (!window.google?.maps) return [];
    return developers.map(dev => ({
      location: new window.google.maps.LatLng(dev.latitude, dev.longitude),
      weight: 1
    })).filter(item => item.location);
  }, [developers]);

  // Custom map styles for DoorDash-like appearance
  const mapStyles = [
    {
      featureType: "all",
      elementType: "geometry",
      stylers: [{ color: "#242f3e" }]
    },
    {
      featureType: "all",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#242f3e" }]
    },
    {
      featureType: "all",
      elementType: "labels.text.fill",
      stylers: [{ color: "#746855" }]
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }]
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }]
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }]
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }]
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }]
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }]
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }]
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }]
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }]
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }]
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }]
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }]
    }
  ];

  // Show configuration error with test mode
  if (!isApiKeyConfigured) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        textAlign: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white"
      }}>
        <h2>🚨 Google Maps API Key Not Configured</h2>
        <p>To fix this:</p>
        <ol style={{ textAlign: "left", maxWidth: "500px" }}>
          <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener" style={{color: "#ffd700"}}>Google Cloud Console</a></li>
          <li>Enable <strong>Maps JavaScript API</strong></li>
          <li>Create an API key</li>
          <li>Add it to your <code>.env</code> file as <code>VITE_GOOGLE_MAPS_API_KEY</code></li>
        </ol>
        
        {/* Test Mode - Show developers as list */}
        <div style={{ marginTop: "2rem", width: "100%", maxWidth: "600px" }}>
          <h3>🧪 Test Mode - Live Developer Updates</h3>
          <p>Even without Google Maps, you can see real-time updates here:</p>
          <div style={{ 
            background: "rgba(255,255,255,0.1)", 
            padding: "1rem", 
            borderRadius: "8px",
            maxHeight: "400px",
            overflowY: "auto",
            backdropFilter: "blur(10px)"
          }}>
            {developers.length === 0 ? (
              <p>No developers checked in yet. Try checking in from the form above!</p>
            ) : (
              developers.map(dev => (
                <div key={dev.id} style={{
                  background: "rgba(255,255,255,0.1)",
                  padding: "1rem",
                  margin: "0.5rem 0",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,0.2)"
                }}>
                  <strong>{dev.name}</strong>
                  {dev.skills && dev.skills.length > 0 && (
                    <div>Skills: {dev.skills.join(", ")}</div>
                  )}
                  <div style={{ fontSize: "0.8rem", color: "#ccc" }}>
                    Location: {dev.latitude.toFixed(4)}, {dev.longitude.toFixed(4)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show loading error
  if (loadError) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        padding: "2rem",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white"
      }}>
        <h2>❌ Google Maps Error</h2>
        <p>Error: {loadError.message}</p>
        <p>Please check your API key and billing settings.</p>
      </div>
    );
  }

  // Show loading
  if (!isLoaded) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontSize: "1.2rem",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🌍</div>
          Loading DevRadar Map...
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        style={{ position: "relative", height: "100vh", width: "100vw" }}
      >
        <GoogleMap
          center={{ lat: 32.7767, lng: -96.7970 }}
          zoom={5}
          mapContainerStyle={{ height: "100vh", width: "100%" }}
          options={{
            styles: mapStyles,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: true
          }}
        >
          {/* Heatmap Layer */}
          {heatmapData.length > 0 && (
            <HeatmapLayer
              data={heatmapData}
              options={{
                radius: 8,
                opacity: 0.5,
                gradient: [
                  'rgba(0, 255, 255, 0)',
                  'rgba(0, 255, 255, 0.3)',
                  'rgba(0, 191, 255, 0.5)',
                  'rgba(0, 127, 255, 0.7)',
                  'rgba(0, 63, 255, 0.8)',
                  'rgba(0, 0, 255, 0.9)',
                  'rgba(0, 0, 223, 1)',
                  'rgba(0, 0, 191, 1)',
                  'rgba(0, 0, 159, 1)',
                  'rgba(0, 0, 127, 1)',
                  'rgba(63, 0, 91, 1)',
                  'rgba(127, 0, 63, 1)',
                  'rgba(191, 0, 31, 1)',
                  'rgba(255, 0, 0, 1)'
                ]
              }}
            />
          )}
          
          {/* Custom Markers */}
          {developers.map((dev, index) => {
            // Check if this developer has the same fingerprint as previous ones
            const sameFingerprintDevs = developers.filter(d => d.fingerprint === dev.fingerprint);
            const devIndex = sameFingerprintDevs.findIndex(d => d.id === dev.id);
            
            // Add small offset for markers from same fingerprint
            const offset = devIndex > 0 ? devIndex * 0.0001 : 0;
            
            return (
              <Marker 
                key={dev.id} 
                position={{ 
                  lat: dev.latitude + offset, 
                  lng: dev.longitude + offset 
                }}
                title={dev.name}
                onMouseOver={(e) => {
                  console.log("Marker hovered:", dev.name);
                  setHoveredDeveloper(dev);
                }}
                onMouseOut={() => {
                  console.log("Marker unhovered:", dev.name);
                  setHoveredDeveloper(null);
                }}
                options={{
                  icon: {
                    path: window.google?.maps?.SymbolPath?.CIRCLE,
                    scale: 2.5,
                    fillColor: "#00ff88",
                    fillOpacity: 0.9,
                    strokeColor: "#ffffff",
                    strokeWeight: 1
                  }
                }}
              />
            );
          })}
          
          {/* InfoWindow for hover details */}
          {hoveredDeveloper && (
            <InfoWindow
              position={{ 
                lat: hoveredDeveloper.latitude, 
                lng: hoveredDeveloper.longitude 
              }}
              onCloseClick={() => setHoveredDeveloper(null)}
            >
              <div style={{ padding: "8px", maxWidth: "200px" }}>
                <div style={{ fontWeight: "600", marginBottom: "4px", color: "#00ff88" }}>
                  {hoveredDeveloper.name}
                </div>
                {hoveredDeveloper.skills && hoveredDeveloper.skills.length > 0 && (
                  <div style={{ fontSize: "0.8rem", color: "#666", marginBottom: "4px" }}>
                    <strong>Skills:</strong> {hoveredDeveloper.skills.join(", ")}
                  </div>
                )}
                {hoveredDeveloper.communication && (
                  <div style={{ fontSize: "0.8rem", color: "#00ccff", marginBottom: "4px" }}>
                    <strong>Contact:</strong> {hoveredDeveloper.communication}
                  </div>
                )}
                <div style={{ fontSize: "0.7rem", color: "#999" }}>
                  📍 {hoveredDeveloper.latitude.toFixed(4)}, {hoveredDeveloper.longitude.toFixed(4)}
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
        
        {/* Developer Count Overlay */}
        <div style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "0.5rem 1rem",
          borderRadius: "20px",
          fontSize: "0.9rem",
          zIndex: 1000,
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <div>
            🌍 {developers.length} Developer{developers.length !== 1 ? 's' : ''} Online
          </div>
          <div style={{
            width: "1px",
            height: "20px",
            background: "rgba(255,255,255,0.3)"
          }}></div>
          <button
            onClick={handleReload}
            disabled={isReloading}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "white",
              padding: "4px 8px",
              borderRadius: "12px",
              fontSize: "0.8rem",
              cursor: isReloading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              opacity: isReloading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isReloading) {
                e.target.style.background = "rgba(255,255,255,0.2)";
                e.target.style.borderColor = "rgba(255,255,255,0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isReloading) {
                e.target.style.background = "rgba(255,255,255,0.1)";
                e.target.style.borderColor = "rgba(255,255,255,0.3)";
              }
            }}
          >
            {isReloading ? (
              <>
                <div style={{
                  width: "12px",
                  height: "12px",
                  border: "1px solid transparent",
                  borderTop: "1px solid white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }}></div>
                Reloading...
              </>
            ) : (
              <>
                🔄 Reload
              </>
            )}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
} 
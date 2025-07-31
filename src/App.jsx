import { useState, useEffect } from "react";
import MapView from "./MapView";
import CheckInForm from "./CheckInForm";
import { supabase } from "./supabaseClient";

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState("Checking connection...");

  useEffect(() => {
    // Test Supabase connection
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from("developers").select("count").limit(1);
        if (error) {
          if (error.message.includes("relation") || error.message.includes("does not exist")) {
            setConnectionStatus("⚠️ Database table not found. Please run the SQL setup in Supabase.");
          } else if (error.message.includes("JWT")) {
            setConnectionStatus("⚠️ Supabase not configured. Check your .env file.");
          } else {
            setConnectionStatus(`⚠️ Database error: ${error.message}`);
          }
        } else {
          setConnectionStatus("✅ Connected to Supabase");
        }
      } catch (err) {
        setConnectionStatus("❌ Cannot connect to Supabase");
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw" }}>
      <CheckInForm />
      <MapView />
      
      {/* Connection Status */}
      <div style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "0.5rem 1rem",
        borderRadius: "4px",
        fontSize: "0.8rem",
        zIndex: 1001
      }}>
        {connectionStatus}
      </div>
    </div>
  );
}

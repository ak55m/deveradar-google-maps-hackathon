import { useState, useEffect } from "react";
import { addDeveloper, getCurrentUserLimits, getMyDevelopers, updateDeveloperLocation, toggleDeveloperStatus, updateDeveloperProfile } from "./supabaseHelpers";
import { getFingerprint } from "./fingerprint";

export default function CheckInForm() {
  const [name, setName] = useState("");
  const [skills, setSkills] = useState("");
  const [communication, setCommunication] = useState("");
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [status, setStatus] = useState("");
  const [userLimits, setUserLimits] = useState(null);
  const [myDevelopers, setMyDevelopers] = useState([]);
  const [showMyDevelopers, setShowMyDevelopers] = useState(false);
  const [editingDeveloper, setEditingDeveloper] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editCommunication, setEditCommunication] = useState("");

  // Load user limits and my developers on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const limits = await getCurrentUserLimits();
      setUserLimits(limits);
      
      const myDevs = await getMyDevelopers();
      setMyDevelopers(myDevs);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleCheckIn = async () => {
    if (!name.trim()) {
      alert("Please enter your name!");
      return;
    }

    if (!userLimits?.can_check_in) {
      setStatus("You've reached your maximum check-ins. You can update your location or toggle online/offline status.");
      return;
    }

    setIsCheckingIn(true);
    setStatus("Getting your location...");
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          setStatus("Saving to database...");
          await addDeveloper({
            name: name.trim(),
            skills: skills.split(",").map(s => s.trim()).filter(s => s),
            communication: communication.trim(),
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
          
          setName("");
          setSkills("");
          setCommunication("");
          setStatus("Successfully checked in! 🎉");
          
          // Reload user data
          await loadUserData();
          
          setTimeout(() => setStatus(""), 3000);
        } catch (error) {
          console.error("Error checking in:", error);
          setStatus(`Error: ${error.message}`);
          setTimeout(() => setStatus(""), 5000);
        } finally {
          setIsCheckingIn(false);
        }
      }, (error) => {
        console.error("Geolocation error:", error);
        setStatus("Unable to get location. Please enable location services.");
        setTimeout(() => setStatus(""), 5000);
        setIsCheckingIn(false);
      });
    } else {
      setStatus("Geolocation not supported by this browser.");
      setTimeout(() => setStatus(""), 5000);
      setIsCheckingIn(false);
    }
  };

  const handleUpdateLocation = async (developerId) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          setStatus("Updating location...");
          await updateDeveloperLocation(developerId, pos.coords.latitude, pos.coords.longitude);
          setStatus("Location updated successfully! 🎉");
          await loadUserData();
          setTimeout(() => setStatus(""), 3000);
        } catch (error) {
          setStatus(`Error updating location: ${error.message}`);
          setTimeout(() => setStatus(""), 5000);
        }
      });
    } else {
      setStatus("Geolocation not supported.");
      setTimeout(() => setStatus(""), 3000);
    }
  };

  const handleToggleStatus = async (developerId, currentStatus) => {
    try {
      setStatus("Updating status...");
      await toggleDeveloperStatus(developerId, !currentStatus);
      setStatus(`Status updated to ${!currentStatus ? 'online' : 'offline'}! 🎉`);
      await loadUserData();
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus(`Error updating status: ${error.message}`);
      setTimeout(() => setStatus(""), 5000);
    }
  };

  const handleStartEdit = (developer) => {
    setEditingDeveloper(developer.id);
    setEditName(developer.name);
    setEditSkills(developer.skills ? developer.skills.join(", ") : "");
    setEditCommunication(developer.communication || "");
  };

  const handleSaveEdit = async (developerId) => {
    try {
      setStatus("Saving changes...");
      await updateDeveloperProfile(developerId, {
        name: editName.trim(),
        skills: editSkills.split(",").map(s => s.trim()).filter(s => s),
        communication: editCommunication.trim() || null
      });
      setStatus("Profile updated successfully! 🎉");
      setEditingDeveloper(null);
      await loadUserData();
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus(`Error updating profile: ${error.message}`);
      setTimeout(() => setStatus(""), 5000);
    }
  };

  const handleCancelEdit = () => {
    setEditingDeveloper(null);
    setEditName("");
    setEditSkills("");
    setEditCommunication("");
  };

  return (
    <div style={{ 
      padding: "1.5rem", 
      background: "rgba(255,255,255,0.95)", 
      position: "absolute", 
      top: "20px", 
      left: "20px", 
      zIndex: 1000,
      borderRadius: "16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.2)",
      minWidth: "320px",
      maxWidth: "400px"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "1rem"
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          background: userLimits?.can_check_in 
            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            : "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: "12px",
          fontSize: "1.2rem"
        }}>
          {userLimits?.can_check_in ? "🌍" : "⏰"}
        </div>
        <div>
          <h3 style={{ 
            margin: "0", 
            color: "#333", 
            fontSize: "1.1rem",
            fontWeight: "600"
          }}>
            {userLimits?.can_check_in ? "Check In" : "Limit Reached"}
          </h3>
          <p style={{ 
            margin: "0", 
            fontSize: "0.8rem", 
            color: "#666",
            marginTop: "2px"
          }}>
            {userLimits?.can_check_in 
              ? `Check-ins: ${userLimits.check_in_count}/${userLimits.max_check_ins}`
              : "You can update location or toggle status"
            }
          </p>
        </div>
      </div>
      
      {userLimits?.can_check_in ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          <div>
            <label style={{
              display: "block",
              fontSize: "0.8rem",
              color: "#555",
              marginBottom: "4px",
              fontWeight: "500"
            }}>
              Your Name
            </label>
            <input
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ 
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #e1e5e9",
                fontSize: "0.9rem",
                transition: "all 0.2s ease",
                boxSizing: "border-box"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e1e5e9";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
          
          <div>
            <label style={{
              display: "block",
              fontSize: "0.8rem",
              color: "#555",
              marginBottom: "4px",
              fontWeight: "500"
            }}>
              Skills (comma separated)
            </label>
            <input
              placeholder="React, Node.js, Python..."
              value={skills}
              onChange={e => setSkills(e.target.value)}
              style={{ 
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #e1e5e9",
                fontSize: "0.9rem",
                transition: "all 0.2s ease",
                boxSizing: "border-box"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e1e5e9";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
          
          <div>
            <label style={{
              display: "block",
              fontSize: "0.8rem",
              color: "#555",
              marginBottom: "4px",
              fontWeight: "500"
            }}>
              How to Contact You
            </label>
            <input
              placeholder="Discord: username#1234, Reddit: u/username..."
              value={communication}
              onChange={e => setCommunication(e.target.value)}
              style={{ 
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #e1e5e9",
                fontSize: "0.9rem",
                transition: "all 0.2s ease",
                boxSizing: "border-box"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e1e5e9";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
          
          <button 
            onClick={handleCheckIn} 
            disabled={isCheckingIn}
            style={{ 
              background: isCheckingIn 
                ? "#ccc" 
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              padding: "14px",
              borderRadius: "8px",
              cursor: isCheckingIn ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
              fontWeight: "600",
              transition: "all 0.2s ease",
              transform: isCheckingIn ? "scale(0.98)" : "scale(1)",
              boxShadow: isCheckingIn 
                ? "none" 
                : "0 4px 12px rgba(102, 126, 234, 0.3)"
            }}
            onMouseEnter={(e) => {
              if (!isCheckingIn) {
                e.target.style.transform = "scale(1.02)";
                e.target.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isCheckingIn) {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
              }
            }}
          >
            {isCheckingIn ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid transparent",
                  borderTop: "2px solid white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  marginRight: "8px"
                }}></div>
                Checking In...
              </span>
            ) : (
              "Check In"
            )}
          </button>
          
          {myDevelopers.length > 0 && (
            <button
              onClick={() => setShowMyDevelopers(!showMyDevelopers)}
              style={{
                background: "rgba(102, 126, 234, 0.1)",
                color: "#667eea",
                border: "1px solid #667eea",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#667eea";
                e.target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(102, 126, 234, 0.1)";
                e.target.style.color = "#667eea";
              }}
            >
              {showMyDevelopers ? "Hide My Developers" : "Manage My Developers"}
            </button>
          )}
        </div>
      ) : (
        <div style={{ 
          background: "rgba(231, 76, 60, 0.1)",
          padding: "1rem",
          borderRadius: "8px",
          border: "1px solid #e74c3c",
          marginBottom: "1rem"
        }}>
          <div style={{ 
            fontSize: "0.9rem", 
            color: "#e74c3c",
            fontWeight: "600",
            marginBottom: "8px"
          }}>
            ⏰ Check-in Limit Reached
          </div>
          
          <div style={{ fontSize: "0.8rem", color: "#666", marginBottom: "8px" }}>
            You've used {userLimits?.check_in_count}/{userLimits?.max_check_ins} check-ins.
            You can still update your location or toggle online/offline status.
          </div>
          
          {myDevelopers.length > 0 && (
            <button
              onClick={() => setShowMyDevelopers(!showMyDevelopers)}
              style={{
                background: "#e74c3c",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                width: "100%"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#c0392b";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#e74c3c";
              }}
            >
              Manage My Developers
            </button>
          )}
        </div>
      )}
      
      {/* My Developers Management */}
      {showMyDevelopers && myDevelopers.length > 0 && (
        <div style={{ 
          marginTop: "1rem",
          padding: "1rem",
          background: "rgba(102, 126, 234, 0.05)",
          borderRadius: "8px",
          border: "1px solid rgba(102, 126, 234, 0.2)"
        }}>
          <h4 style={{ margin: "0 0 0.8rem 0", fontSize: "0.9rem", color: "#333" }}>
            My Developers ({myDevelopers.length})
          </h4>
          {myDevelopers.map(dev => (
            <div key={dev.id} style={{
              background: "white",
              padding: "0.8rem",
              margin: "0.5rem 0",
              borderRadius: "6px",
              border: "1px solid #e1e5e9"
            }}>
              {editingDeveloper === dev.id ? (
                // Edit Mode
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div>
                    <label style={{ fontSize: "0.7rem", color: "#555", fontWeight: "500" }}>Name:</label>
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        borderRadius: "4px",
                        border: "1px solid #e1e5e9",
                        fontSize: "0.8rem",
                        marginTop: "2px"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.7rem", color: "#555", fontWeight: "500" }}>Skills:</label>
                    <input
                      value={editSkills}
                      onChange={e => setEditSkills(e.target.value)}
                      placeholder="React, Node.js, Python..."
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        borderRadius: "4px",
                        border: "1px solid #e1e5e9",
                        fontSize: "0.8rem",
                        marginTop: "2px"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.7rem", color: "#555", fontWeight: "500" }}>Contact:</label>
                    <input
                      value={editCommunication}
                      onChange={e => setEditCommunication(e.target.value)}
                      placeholder="Discord: username#1234, Reddit: u/username..."
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        borderRadius: "4px",
                        border: "1px solid #e1e5e9",
                        fontSize: "0.8rem",
                        marginTop: "2px"
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "4px" }}>
                    <button
                      onClick={() => handleSaveEdit(dev.id)}
                      style={{
                        background: "#27ae60",
                        color: "white",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        cursor: "pointer"
                      }}
                    >
                      💾 Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        background: "#95a5a6",
                        color: "white",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        cursor: "pointer"
                      }}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                    {dev.name} {dev.is_online ? "🟢" : "🔴"}
                  </div>
                  {dev.skills && dev.skills.length > 0 && (
                    <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "4px" }}>
                      {dev.skills.join(", ")}
                    </div>
                  )}
                  {dev.communication && (
                    <div style={{ fontSize: "0.75rem", color: "#00ccff", marginBottom: "4px" }}>
                      📞 {dev.communication}
                    </div>
                  )}
                  <div style={{ fontSize: "0.7rem", color: "#999", marginBottom: "8px" }}>
                    {dev.latitude.toFixed(4)}, {dev.longitude.toFixed(4)}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleUpdateLocation(dev.id)}
                      style={{
                        background: "#27ae60",
                        color: "white",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        cursor: "pointer"
                      }}
                    >
                      📍 Update Location
                    </button>
                    <button
                      onClick={() => handleToggleStatus(dev.id, dev.is_online)}
                      style={{
                        background: dev.is_online ? "#e74c3c" : "#27ae60",
                        color: "white",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        cursor: "pointer"
                      }}
                    >
                      {dev.is_online ? "🔴 Go Offline" : "🟢 Go Online"}
                    </button>
                    <button
                      onClick={() => handleStartEdit(dev)}
                      style={{
                        background: "#3498db",
                        color: "white",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        cursor: "pointer"
                      }}
                    >
                      ✏️ Edit Profile
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      
      {status && (
        <div style={{ 
          fontSize: "0.8rem", 
          color: status.includes("Error") ? "#e74c3c" : "#27ae60",
          marginTop: "0.5rem",
          padding: "8px 12px",
          borderRadius: "6px",
          background: status.includes("Error") 
            ? "rgba(231, 76, 60, 0.1)" 
            : "rgba(39, 174, 96, 0.1)",
          border: `1px solid ${status.includes("Error") ? "#e74c3c" : "#27ae60"}`,
          textAlign: "center"
        }}>
          {status}
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 
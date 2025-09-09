import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function MainButtons({ isLoggedIn }) {
  const navigate = useNavigate();
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");

  const buttonStyle = {
    margin: "10px",
    padding: "15px 25px",
    fontSize: "16px",
    fontWeight: "bold",
    color: "white",
    backgroundColor: "#e57f11ff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  };

  const handleAdminClick = () => {
    setShowAdminPrompt(true);
  };

  const handleAdminLogin = () => {
    // Replace these with your secure credentials or logic
    const correctUsername = "admin";
    const correctPassword = "1234";

    if (adminUsername === correctUsername && adminPassword === correctPassword) {
      setError("");
      setShowAdminPrompt(false);
      navigate("/admin");
    } else {
      setError("Invalid credentials. Try again.");
    }
  };

  return (
    <div>
      {/* Report Issue button */}
      <button style={buttonStyle} onClick={() => navigate("/complaint")}>
        Report Issue
      </button>

      {/* User Login button - disabled */}
      <button
        style={{
          ...buttonStyle,
          opacity: 0.5,
          cursor: "not-allowed",
        }}
        disabled
      >
        User Login
      </button>

      {/* Admin Panel button */}
      <button style={buttonStyle} onClick={handleAdminClick}>
        Admin Panel
      </button>

      {/* Admin Login Prompt */}
      {showAdminPrompt && (
        <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "15px", width: "300px" }}>
          <h3>Admin Login</h3>
          <input
            type="text"
            placeholder="Username"
            value={adminUsername}
            onChange={(e) => setAdminUsername(e.target.value)}
            style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
          />
          <input
            type="password"
            placeholder="Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
          />
          {error && <p style={{ color: "red" }}>{error}</p>}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button style={buttonStyle} onClick={handleAdminLogin}>
              Login
            </button>
            <button
              style={{ ...buttonStyle, backgroundColor: "#999" }}
              onClick={() => {
                setShowAdminPrompt(false);
                setError("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainButtons;

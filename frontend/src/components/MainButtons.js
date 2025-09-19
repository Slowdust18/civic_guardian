import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../components/MainButton.css"; // external css

function MainButtons() {
  const navigate = useNavigate();
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");

  const handleAdminLogin = () => {
    if (adminUsername === "admin" && adminPassword === "1234") {
      setError("");
      setShowAdminPrompt(false);
      navigate("/admin");
    } else {
      setError("Invalid credentials. Try again.");
    }
  };

  return (
    <div className="container-box">
      <h1 className="title">Civic Guardian</h1>

      <div>
        <button
          className="btn btn-warning btn-custom"
          onClick={() => navigate("/complaint")}
        >
          Report Issue
        </button>

        <button className="btn btn-primary btn-custom"
        onClick={() => navigate("/login")}>
          User Login
          
        </button>

        <button
          className="btn btn-danger btn-custom"
          onClick={() => setShowAdminPrompt(true)}
        >
          Admin Panel
        </button>
      </div>

      {showAdminPrompt && (
        <div className="admin-prompt">
          <h3>Admin Login</h3>
          <input
            type="text"
            placeholder="Username"
            value={adminUsername}
            onChange={(e) => setAdminUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
          />
          {error && <p className="error-text">{error}</p>}
          <div className="admin-actions">
            <button className="btn btn-success btn-custom" onClick={handleAdminLogin}>
              Login
            </button>
            <button
              className="btn btn-secondary btn-custom"
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

      <div className="footer">© 2025 Civic Guardian</div>
    </div>
  );
}

export default MainButtons;

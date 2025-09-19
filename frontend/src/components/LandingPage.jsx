import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./LandingPage.css"; // your CSS file


function LandingPage({ isLoggedIn }) {

  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (username === "admin" && password === "1234") {
      setShowLogin(false);
      setUsername("");
      setPassword("");
      setError("");
      navigate("/admin")
    } else {
      setError("❌ Invalid username or password");
    }
  };
  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top custom-navbar">
        <div className="container">
          <a className="navbar-brand fw-bold text-warning" href="#">
            Civic Guardian
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link text-light" href="#about">
                  About
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-light" href="#how">
                  How It Works
                </a>
              </li>
             <li className="nav-item">
            <button
    className="btn btn-warning text-dark ms-2 fw-semibold"
    onClick={() => setShowLogin(true)}
  >
    Admin Login
  </button>
  </li>

            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero text-center">
        <div className="container">
          <h1 className="display-4 text-light">
            <span className="text-warning">Civic</span> Guardian
          </h1>
          <p className="lead mb-4 text-light">
            Civic Guardian helps citizens report with{" "}
            <span style={{ color: "yellow" }}>AI assistance</span> and track
            civic issues with ease.
          </p>
          <a href="/complaint" className="btn btn-warning btn-lg me-2">
            <i className="fa-solid fa-pen-to-square"></i> Report Issue
          </a>
         {!isLoggedIn && (
  <a href="/login" className="btn btn-primary btn-lg" style={{ color: "#facc15" }}>
    <i className="fa-solid fa-user"></i> User Sign Up
  </a>)}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-5 text-center">
        <div className="container">
          <h2 className="fw-bold mb-4">About Civic Guardian</h2>
          <p className="text-muted">
           <span style={{color: "white"}}> We empower citizens to report civic issues like potholes, garbage,
            street lights with{" "}
            <span style={{ color: "yellow" }}>AI assistance</span> and track them
            until resolved. Together we build better communities.</span>
          </p>
        </div>
      </section>

      {/* How it Works */}
      <section id="how" className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center fw-bold mb-5">How It Works</h2>
          <div className="row g-4">
            <div className="col-md-3">
              <div className="card step-card p-4 text-center">
                <i className="fa-solid fa-file-circle-plus fa-3x text-warning mb-3"></i>
                <h5>1. Report</h5>
                <p>Citizens submit issues with details and photos.</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card step-card p-4 text-center">
                <i className="fa-solid fa-robot fa-3x text-info mb-3"></i>
                <h5>2. AI Assistance</h5>
                <p>AI classifies issues for faster redirection.</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card step-card p-4 text-center">
                <i className="fa-solid fa-hourglass-half fa-3x text-primary mb-3"></i>
                <h5>3. Track</h5>
                <p>Citizens can monitor progress and updates in real-time.</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card step-card p-4 text-center">
                <i className="fa-solid fa-circle-check fa-3x text-success mb-3"></i>
                <h5>4. Resolve</h5>
                <p>Authorities take action, and citizens are notified once resolved.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center footer-custom">
        <div className="container">
          <p>
            © 2025 Civic Guardian | <a href="#">Privacy</a> |{" "}
            <a href="#">Terms</a>
          </p>
        </div>
      </footer>
 {/* Admin Login Modal */}
      {showLogin && (
        <div className="overlay">
          <div className="login-box fade-in">
            <h2>Admin Login</h2>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p style={{ color: "red" }}>{error}</p>}

            <div className="login-actions">
              <button className="btn btn-success" onClick={handleLogin}>
                Login
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setShowLogin(false);
                  setError("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LandingPage;

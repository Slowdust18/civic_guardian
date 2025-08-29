import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainButtons from "./components/MainButtons";
import LoginPage from "./components/LoginPage";
import MapPage from "./components/MapPage";
import ComplaintPage from "./components/ComplaintPage"
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <div className="app">
        <h1 className="title">Civic Guardian</h1>

        <Routes>
          <Route path="/" element={<MainButtons isLoggedIn={isLoggedIn} />} />
          <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/complaint" element={<ComplaintPage />} />
        </Routes>

        <footer className="footer">© 2025 Civic Guardian</footer>
      </div>
    </Router>
  );
}

export default App;

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import MapPage from "./components/MapPage";
import ComplaintPage from "./components/ComplaintPage";
import AdminPage from "./components/AdminPage";
import "./App.css";
import LandingPage from "./components/LandingPage";
import "bootstrap/dist/css/bootstrap.min.css";
import ViewComplaint from "./components/ViewComplaint";
import VotingTemp from "./components/VotingTemp";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  useEffect(() => {
    localStorage.setItem("isLoggedIn", isLoggedIn);
  }, [isLoggedIn]);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <LandingPage
              isLoggedIn={isLoggedIn}
              setIsLoggedIn={setIsLoggedIn}
            />
          }
        />
        <Route
          path="/login"
          element={<LoginPage setIsLoggedIn={setIsLoggedIn} />}
        />
        <Route path="/map" element={<MapPage />} />
        <Route path="/complaint" element={<ComplaintPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/view-complaint/:id" element={<ViewComplaint />} />
        <Route path="/vote" element={<VotingTemp />} />
      </Routes>
    </Router>
  );
}

export default App;

import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainButtons from "./components/MainButtons";
import LoginPage from "./components/LoginPage";
import MapPage from "./components/MapPage";
import ComplaintPage from "./components/ComplaintPage"
import AdminPage from './components/AdminPage';
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>

        <Routes>
          <Route path="/" element={<MainButtons isLoggedIn={isLoggedIn} />} />
          <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/complaint" element={<ComplaintPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
    </Router>
  );
}

export default App;

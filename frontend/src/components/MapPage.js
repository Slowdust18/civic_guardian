// src/components/MapPage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import L from "leaflet";

// Default marker fix for Leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function MapPage() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/complaints/all")
      .then((res) => setComplaints(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          margin: "10px",
          padding: "10px 15px",
          backgroundColor: "#f97316",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        ⬅ Back
      </button>

      <MapContainer
        center={[13.08, 80.22]} // center on Chennai-ish area
        zoom={13}
        style={{ height: "90%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Render complaint markers */}
        {complaints.map((c) => {
          if (!c.location || !c.location.coordinates) return null;

          const [lng, lat] = c.location.coordinates; // GeoJSON = [lon, lat]

          return (
            <Marker key={c.id} position={[lat, lng]}>
              <Popup>
                <b>{c.title}</b>
                <br />
                {c.description}
                <br />
                Dept: {c.department}
                <br />
                Status: {c.status}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default MapPage;

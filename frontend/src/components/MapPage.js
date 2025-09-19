import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function RecenterMap({ coords }) {
  const map = useMap();

  useEffect(() => {
    if (coords?.length === 2) {
      map.setView(coords, 15);
    }
  }, [coords, map]);

  return null;
}

function MapPage({ value, onChange }) {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/complaints/all")
      .then((res) => setComplaints(res.data))
      .catch((err) => console.error(err));
  }, []);

  function LocationSelector() {
    useMapEvents({
      click(e) {
        onChange({
          coords: [e.latlng.lat, e.latlng.lng],
          locationName: "Selected Location",
        });
      },
    });
    return null;
  }

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          margin: "10px",
          padding: "10px 15px",
          backgroundColor: "#edc10fff",
          color: "green",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
       Back
      </button>

      <MapContainer
        center={value?.coords || [13.08, 80.22]}
        zoom={13}
        style={{ height: "90%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

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

        {value?.coords && <Marker position={value.coords} />}

        <LocationSelector />
        
        <RecenterMap coords={value?.coords} />
      </MapContainer>
    </div>
  );
}

export default MapPage;

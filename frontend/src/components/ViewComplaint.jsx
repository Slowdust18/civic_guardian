// src/components/ViewComplaint.jsx
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api, adminHeaders } from "../api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function ViewComplaint() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const [department, setDepartment] = useState("");
  const [urgency, setUrgency] = useState("");
  const [process, setProcess] = useState("");
  const [status, setStatus] = useState("");


  const DEPARTMENTS = ["Road Safety", "Water", "Sanitation", "Electricity", "Waste Management"];
  const URGENCY_LEVELS = ["LOW", "MEDIUM", "HIGH"];
  const PROCESS_OPTIONS = ["Unassigned","Assigned", "Work has started","Pending Verification","Complaint Sent"]

  
const fetchReport = useCallback(async () => {
  setLoading(true);
  try {
    const { data } = await api.get(`/admin/get_complaint/${id}`, {
      headers: adminHeaders(),
    });

    setReport(data);
    setDepartment(data.department || "");
    setUrgency(data.priority || "");
    setProcess(data.process || "Unassigned"); 
  } catch (err) {
    console.error("Failed to fetch complaint", err);
  } finally {
    setLoading(false);
  }
}, [id]);


  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // check if anything changed
  const isModified =
    report &&
    (department !== report.department ||
      urgency !== report.priority ||
      process !== report.process);

  const handleSave = async () => {
    try {
      const updates = [];

      if (department && department !== report.department) {
        updates.push(
          api.put(
            `/admin/complaints/${id}/department`,
            { department },
            { headers: adminHeaders() }
          )
        );
      }

if (process && process !== report.process) {
  updates.push(
    api.put(
      `/admin/complaints/${id}/process`,
      { process },
      { headers: adminHeaders() }
    )
  );
}

      if (urgency && urgency !== report.priority) {
        updates.push(
          api.put(
            `/admin/complaints/${id}/urgency`,
            { urgency },
            { headers: adminHeaders() }
          )
        );
      }

      await Promise.all(updates);

      alert("Complaint updated successfully!");
      await fetchReport(); 
    } catch (err) {
  if (err.response) {
    console.error("Error response:", err.response.data);
    alert(`Failed: ${JSON.stringify(err.response.data)}`);
  } else {
    console.error("Error message:", err.message);
    alert("Failed to update complaint.");
  }
}

  };

  if (loading) return <p>Loading complaint...</p>;
  if (!report) return <p>Complaint not found.</p>;

 return (
  <div
    style={{
      maxWidth: "800px",
      margin: "20px auto",
      padding: "20px",
      backgroundColor: "#064e3b",
      color: "#f9fafb",
      borderRadius: "10px",
    }}
  >
    <h1 style={{ color: "#facc15" }}>Complaint #{report.id}</h1>
    <p>
      <strong>Title:</strong> {report.title}
    </p>
    <p>
      <strong>Description:</strong> {report.description}
    </p>

    {/* Dropdowns */}
    <div
      style={{
        marginBottom: "20px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
      }}
    >
      {/* Department */}
      <label style={{ display: "flex", flexDirection: "column" }}>
        <strong>Department</strong>
        <select value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">Select</option>
          {DEPARTMENTS.map((dep) => (
            <option key={dep} value={dep}>
              {dep}
            </option>
          ))}
        </select>
      </label>

      {/* Urgency */}
      <label style={{ display: "flex", flexDirection: "column" }}>
        <strong>Urgency</strong>
        <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
          <option value="">Select</option>
          {URGENCY_LEVELS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </label>

      {/* Process */}
      <label style={{ display: "flex", flexDirection: "column" }}>
        <strong>Process</strong>
        <select value={process} onChange={(e) => setProcess(e.target.value)}>
          <option value="">Select</option>
          {PROCESS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {/* Status (new) */}
      <label style={{ display: "flex", flexDirection: "column" }}>
        <strong>Status</strong>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Unresolved">Unresolved</option>
          <option value="Resolved">Resolved</option>
        </select>
      </label>
    </div>

    <button
      onClick={handleSave}
      disabled={!isModified}
      style={{
        marginTop: "10px",
        padding: "8px 16px",
        background: isModified ? "#facc15" : "#aaa",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: isModified ? "pointer" : "not-allowed",
      }}
    >
      Save
    </button>

    {/* Image */}
    {report.image_url && (
      <div style={{ margin: "20px 0" }}>
        <img
          src={`http://localhost:8000${report.image_url}`}
          alt="Complaint"
          style={{
            maxWidth: "100%",
            maxHeight: "400px",
            borderRadius: "8px",
            objectFit: "cover",
          }}
          onError={(e) => {
            e.target.src =
              "https://via.placeholder.com/600x400?text=Image+Not+Found";
          }}
        />
      </div>
    )}

    {/* Map */}
    {report.location?.coordinates && (
      <MapContainer
        center={[
          report.location.coordinates[1],
          report.location.coordinates[0],
        ]}
        zoom={13}
        style={{ height: "300px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Marker
          position={[
            report.location.coordinates[1],
            report.location.coordinates[0],
          ]}
        >
          <Popup>{report.title}</Popup>
        </Marker>
      </MapContainer>
    )}
  </div>
);
}
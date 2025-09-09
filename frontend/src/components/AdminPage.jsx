import { useState, useEffect } from "react";
import { api, adminHeaders, adminListReports } from "../api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function AdminPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editedUrgency, setEditedUrgency] = useState({});
  const [selectedReport, setSelectedReport] = useState(null); // ✅ track selected complaint

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminListReports();
      setReports(data);
    } catch (e) {
      console.error("Failed to load reports", e);
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleUrgencyChange = (id, value) => {
    setEditedUrgency((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const updateUrgency = async (id) => {
    const urgency = editedUrgency[id];
    if (!urgency) {
      alert("Please select urgency before saving.");
      return;
    }
    try {
      await api.put(
        `/admin/reports/${id}/urgency`,
        { urgency },
        { headers: adminHeaders() }
      );
      setReports((prev) =>
        prev.map((report) =>
          report.id === id ? { ...report, urgency } : report
        )
      );
      alert("Urgency updated successfully.");
    } catch (e) {
      console.error("Failed to update urgency", e);
      alert("Failed to update urgency");
    }
  };

  if (loading) return <div>Loading reports...</div>;

  return (
    <div style={{ display: "flex", maxWidth: "1200px", margin: "auto", padding: "20px" }}>
      
      {/* ✅ Left: Complaints Table */}
      <div style={{ flex: 1, marginRight: "20px" }}>
        <h1>Admin Panel – Manage Complaints</h1>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {reports.length === 0 ? (
          <p>No complaints registered.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>ID</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Title</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Department</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Urgency</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} onClick={() => setSelectedReport(report)} style={{ cursor: "pointer" }}>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{report.id}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{report.title}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{report.department}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    <select
                      value={editedUrgency[report.id] ?? report.priority ?? ""}
                      onChange={(e) => handleUrgencyChange(report.id, e.target.value)}
                    >
                      <option value="">Select urgency</option>
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    <button onClick={(e) => { e.stopPropagation(); updateUrgency(report.id); }}>
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ✅ Right: Selected Complaint Details */}
      <div style={{ flex: 1 }}>
        {selectedReport ? (
          <>
            <h2>Complaint Details</h2>
            <p><strong>Title:</strong> {selectedReport.title}</p>
            <p><strong>Description:</strong> {selectedReport.description}</p>
            <p><strong>Department:</strong> {selectedReport.department}</p>

            {/* Image */}
            {selectedReport.image_url && (
              <img
                src={encodeURI(selectedReport.image_url)}
                alt="Complaint"
                style={{ maxWidth: "100%", marginBottom: "20px" }}
              />
            )}

            {/* Map */}
            {selectedReport.location && selectedReport.location.coordinates && (
              <MapContainer
                center={[
                  selectedReport.location.coordinates[1],
                  selectedReport.location.coordinates[0],
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
                    selectedReport.location.coordinates[1],
                    selectedReport.location.coordinates[0],
                  ]}
                >
                  <Popup>{selectedReport.title}</Popup>
                </Marker>
              </MapContainer>
            )}
          </>
        ) : (
          <p>Select a complaint to view details.</p>
        )}
      </div>

    </div>
  );
}

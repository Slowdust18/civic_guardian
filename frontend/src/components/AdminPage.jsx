import { useState, useEffect } from "react";
import { api, adminHeaders, adminListReports } from "../api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function AdminPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editedUrgency, setEditedUrgency] = useState({});
  const [editedProcess, setEditedProcess] = useState({});
  const [editedDepartment, setEditedDepartment] = useState({});
  const [selectedReport, setSelectedReport] = useState(null); // ✅ track selected complaint

  const DEPARTMENTS = ["Roads", "Electricity", "Sanitation", "Water","Waste"];

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
          report.id === id ? { ...report, priority: urgency } : report
        )
      );
      alert("Urgency updated successfully.");
    } catch (e) {
      console.error("Failed to update urgency", e);
      alert("Failed to update urgency");
    }
  };

  const updateProcess = async (id) => {
    const process = editedProcess[id];
    if (!process) {
      alert("Please select a status before saving.");
      return;
    }
    try {
      await api.put(
        `/admin/complaints/${id}/process`,
        { process },
        { headers: adminHeaders() }
      );
      setReports((prev) =>
        prev.map((report) =>
          report.id === id ? { ...report, process } : report
        )
      );
      alert("Process updated successfully.");
    } catch (e) {
      console.error("Failed to update status", e);
      alert("Failed to update status.");
    }
  };

  const updateDepartment = async (id) => {
    const department = editedDepartment[id];
    if (!department) {
      alert("Select a department before saving.");
      return;
    }
    try {
      await api.put(
        `/admin/complaints/${id}/department`,
        { department },
        { headers: adminHeaders() }
      );
      setReports((prev) =>
        prev.map((report) =>
          report.id === id ? { ...report, department } : report
        )
      );
      alert("Department updated successfully.");
    } catch (e) {
      console.error("Failed to update department", e);
      alert("Failed to update department.");
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
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    <select
                      value={editedDepartment[report.id] ?? report.department}
                      onChange={(e) =>
                        setEditedDepartment((prev) => ({
                          ...prev,
                          [report.id]: e.target.value,
                        }))
                      }
                    >
                      {DEPARTMENTS.map((dep) => (
                        <option key={dep} value={dep}>{dep}</option>
                      ))}
                    </select>
                    <button
                      style={{ marginLeft: "8px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDepartment(report.id);
                      }}
                    >
                      Save
                    </button>
                  </td>
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
      <div style={{ flex: 1, maxHeight: "90vh", overflowY: "auto" }}>
        {selectedReport ? (
          <>
            <h2>Complaint Details</h2>
            <p><strong>Title:</strong> {selectedReport.title}</p>
            <p><strong>Description:</strong> {selectedReport.description}</p>
            <p><strong>Department:</strong> {selectedReport.department}</p>

            <p><strong>Process:</strong>
              <select
                value={editedProcess[selectedReport.id] ?? selectedReport.process ?? "unresolved"}
                onChange={(e) => setEditedProcess({
                  ...editedProcess,
                  [selectedReport.id]: e.target.value
                })}
                style={{ marginLeft: "10px" }}
              >
                <option value="assigned">Assigned</option>
                <option value="pending verification">Pending Verification</option>
                <option value="complaint sent">Complaint Sent</option>
                <option value="Work has started">Work has started</option>
              </select>
            </p>

            <button
              onClick={() => updateProcess(selectedReport.id)}
              style={{ marginBottom: "20px" }}
            >
              Save Status
            </button>

            {selectedReport.image_url && (
              <img src={encodeURI(selectedReport.image_url)} alt="Complaint" style={{ maxWidth: "100%", marginBottom: "20px" }} />
            )}

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

import { useState, useEffect } from "react";
import { api, adminHeaders, adminListReports } from "../api";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

export default function AdminPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editedReports, setEditedReports] = useState({});
  const navigate = useNavigate();

  const DEPARTMENTS = ["Road Safety", "Electricity", "Sanitation", "Water", "Waste Management"];
  const URGENCY_LEVELS = ["LOW", "MEDIUM", "HIGH"];
  const PROCESS_OPTIONS = [
    "Unassigned",
    "Assigned",
    "Work has started",
    "Pending Verification",
    "Complaint Sent",
  ];

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

  // Track edits in a single object
  const handleChange = (id, field, value) => {
    setEditedReports((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSave = async (report) => {
    const edits = editedReports[report.id] || {};
    const updates = [];

    try {
      if (edits.department && edits.department !== report.department) {
        updates.push(
          api.put(
            `/admin/complaints/${report.id}/department`,
            { department: edits.department },
            { headers: adminHeaders() }
          )
        );
      }

      if (edits.urgency && edits.urgency !== report.priority) {
        updates.push(
          api.put(
            `/admin/complaints/${report.id}/urgency`,
            { urgency: edits.urgency },
            { headers: adminHeaders() }
          )
        );
      }

      if (edits.process && edits.process !== report.process) {
        updates.push(
          api.put(
            `/admin/complaints/${report.id}/process`,
            { process: edits.process },
            { headers: adminHeaders() }
          )
        );
      }

      if (updates.length === 0) {
        alert("No changes to save.");
        return;
      }

      await Promise.all(updates);

      // Update local state
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id ? { ...r, ...edits } : r
        )
      );

      // Clear edits for that row
      setEditedReports((prev) => {
        const newState = { ...prev };
        delete newState[report.id];
        return newState;
      });

      alert("Complaint updated successfully!");
    } catch (e) {
      console.error("Failed to update complaint", e);
      alert("Failed to update complaint.");
    }
  };

  if (loading) return <div>Loading reports...</div>;

 return (
  <div style={{ display: "flex", maxWidth: "1200px", margin: "auto", padding: "20px" }}>
    <div style={{ flex: 1, marginRight: "20px" }}>
      <h1 style={{ color: "#facc15", marginBottom: "20px" }}>Admin Panel – Manage Complaints</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {reports.length === 0 ? (
        <p style={{ color: "#f9fafb" }}>No complaints registered.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "#064e3b", // dark green base
            color: "#f9fafb",           // light text
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#047857" }}>
              {["ID", "Title", "Department", "Urgency", "Process", "Action"].map((head) => (
                <th
                  key={head}
                  style={{
                    padding: "12px",
                    border: "1px solid #065f46",
                    textAlign: "left",
                  }}
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.map((report, idx) => {
              const edits = editedReports[report.id] || {};
              return (
                <tr
                  key={report.id}
                  onClick={() => navigate(`/view-complaint/${report.id}`)}
                  style={{
                    cursor: "pointer",
                    backgroundColor: idx % 2 === 0 ? "#065f46" : "#064e3b", // zebra stripes
                  }}
                >
                  <td style={{ padding: "10px", border: "1px solid #065f46" }}>{report.id}</td>
                  <td style={{ padding: "10px", border: "1px solid #065f46" }}>{report.title}</td>

                  {/* Department */}
                  <td style={{ padding: "10px", border: "1px solid #065f46" }}>
                    <select
                      value={edits.department ?? report.department ?? ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleChange(report.id, "department", e.target.value)}
                      style={{
                        background: "#047857",
                        color: "#f9fafb",
                        border: "1px solid #065f46",
                        borderRadius: "5px",
                        padding: "4px 8px",
                      }}
                    >
                      <option value="">Select</option>
                      {DEPARTMENTS.map((dep) => (
                        <option key={dep} value={dep}>{dep}</option>
                      ))}
                    </select>
                  </td>

                  {/* Urgency */}
                  <td style={{ padding: "10px", border: "1px solid #065f46" }}>
                    <select
                      value={edits.urgency ?? report.priority ?? ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleChange(report.id, "urgency", e.target.value)}
                      style={{
                        background: "#047857",
                        color: "#f9fafb",
                        border: "1px solid #065f46",
                        borderRadius: "5px",
                        padding: "4px 8px",
                      }}
                    >
                      <option value="">Select</option>
                      {URGENCY_LEVELS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </td>

                  {/* Process */}
                  <td style={{ padding: "10px", border: "1px solid #065f46" }}>
                    <select
                      value={edits.process ?? report.process ?? "Unassigned"}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleChange(report.id, "process", e.target.value)}
                      style={{
                        background: "#047857",
                        color: "#f9fafb",
                        border: "1px solid #065f46",
                        borderRadius: "5px",
                        padding: "4px 8px",
                      }}
                    >
                      {PROCESS_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </td>

                  {/* Save button */}
                  <td style={{ padding: "10px", border: "1px solid #065f46" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSave(report);
                      }}
                      style={{
                        background: "#facc15", // yellow button
                        color: "#1f2937",
                        border: "none",
                        borderRadius: "5px",
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  </div>
);
}
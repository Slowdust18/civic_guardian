import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function VotingTemp() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // ✅ Always parse as integer
  const userId = parseInt(localStorage.getItem("user_id"), 10);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/votes/pending");
        setComplaints(res.data);
      } catch (err) {
        console.error("Error fetching pending complaints", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  const handleVote = async (complaintId, voteType) => {
    try {
      if (!userId || isNaN(userId)) {
        setMessage("❌ Invalid session. Please log in again.");
        return;
      }

      console.log("Sending vote:", { userId, voteType });

      await axios.post(`http://127.0.0.1:8000/votes/${complaintId}`, {
        user_id: userId, // ✅ guaranteed integer
        vote_type: voteType,
      });

      setMessage("✅ Vote recorded successfully!");
      setComplaints((prev) => prev.filter((c) => c.id !== complaintId));
    } catch (err) {
      console.error("Error submitting vote", err.response?.data || err);

      let errorDetail = err.response?.data?.detail;
      if (Array.isArray(errorDetail)) {
        errorDetail = errorDetail.map((e) => e.msg).join(", ");
      } else if (typeof errorDetail === "object") {
        errorDetail = JSON.stringify(errorDetail);
      }

      setMessage(errorDetail || "❌ Failed to submit vote");
    }
  };

  if (loading) return <p className="text-center mt-5">Loading complaints...</p>;

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">🗳️ Pending Complaints for Voting</h2>
      {message && <div className="alert alert-info">{message}</div>}
      {complaints.length === 0 ? (
        <p className="text-center">🎉 No complaints pending verification!</p>
      ) : (
        <div className="row">
          {complaints.map((complaint) => (
            <div key={complaint.id} className="col-md-6 mb-4">
              <div className="card shadow-sm p-3">
                <h5 className="fw-bold">{complaint.title}</h5>
                <p>{complaint.description}</p>
                <p>
                  <span className="badge bg-primary">{complaint.department}</span>{" "}
                  <span className="badge bg-secondary">{complaint.priority}</span>
                </p>
                <div className="d-flex justify-content-between">
                  <button
                    className="btn btn-success"
                    onClick={() => handleVote(complaint.id, "Resolved")}
                  >
                    ✅ Resolved
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleVote(complaint.id, "Unresolved")}
                  >
                    ❌ Not Resolved
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VotingTemp;

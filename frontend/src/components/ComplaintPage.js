import React, { useState } from "react";

function ComplaintPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    department: "Roads",
    image: null,
    locationName: "",
    latitude: "",
    longitude: "",
  });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "file" ? files[0] : value,
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  const data = new FormData();
  data.append("title", formData.title);
  data.append("description", formData.description);
  data.append("department", formData.department);
  data.append("locationName", formData.locationName); // Omit if not needed by backend
  data.append("latitude", formData.latitude);
  data.append("longitude", formData.longitude);
  if (formData.image) {
    data.append("image", formData.image);
  }
  try {
    const res = await fetch("http://127.0.0.1:8000/complaints/register", {
      method: "POST",
      body: data,
    });
    if (res.ok) {
      alert("Complaint submitted successfully!");
      // Optionally reset the form here
    } else {
      const error = await res.json();
      alert("Submission failed: " + JSON.stringify(error));
    }
  } catch (error) {
    alert("Error: " + error.message);
  }
};


  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "20px" }}>
      <h2>Report an Issue</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label><br />
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>

        <div>
          <label>Description:</label><br />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            style={{ width: "100%", height: "80px", marginBottom: "10px" }}
          />
        </div>

        <div>
          <label>Department:</label><br />
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
            style={{ width: "100%", marginBottom: "10px" }}
          >
            <option value="Roads">Roads</option>
            <option value="Sanitation">Sanitation</option>
            <option value="Water">Water</option>
            <option value="Electricity">Electricity</option>
          </select>
        </div>

        <div>
          <label>Upload Image:</label><br />
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
            style={{ marginBottom: "10px" }}
          />
        </div>

        <div>
          <label>Location Name:</label><br />
          <input
            type="text"
            name="locationName"
            value={formData.locationName}
            onChange={handleChange}
            required
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>

        <div>
          <label>Latitude:</label><br />
          <input
            type="number"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            step="any"
            required
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>

        <div>
          <label>Longitude:</label><br />
          <input
            type="number"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            step="any"
            required
            style={{ width: "100%", marginBottom: "20px" }}
          />
        </div>

        <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#e57f11ff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }} onClick={handleSubmit}>
          Submit Complaint
        </button>
      </form>
    </div>
  );
}

export default ComplaintPage;

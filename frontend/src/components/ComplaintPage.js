import { useState, useEffect } from "react";
import MapPage from "./MapPage";
import { submitComplaint, aiAssist } from "../api";
import "../components/ComplaintPage.css";

const CATEGORIES = [
  "potholes",
  "electricity",
  "water",
  "waste",
  "parks",
  "govt buildings",
  "bridges",
];

export default function ComplaintPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [coords, setCoords] = useState(null);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [image, setImage] = useState(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [descriptionIndex, setDescriptionIndex] = useState(0);
  useEffect(() => {
    if (coords?.coords?.length === 2) {
      setLatInput(coords.coords[0].toString());
      setLngInput(coords.coords[1].toString());
    }
  }, [coords]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        let locationName = "Unknown location";
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          locationName = data.display_name || "Unknown location";
        } catch {
          console.warn("Reverse geocoding failed");
        }

        setCoords({ coords: [lat, lng], locationName });
      },
      (err) => alert("Location error: " + err.message)
    );
  };

  const handleManualCoords = async () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (isNaN(lat) || isNaN(lng))
      return alert("Enter valid latitude and longitude");

    let locationName = "Unknown location";
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      locationName = data.display_name || "Unknown location";
    } catch {
      console.warn("Reverse geocoding failed");
    }

    setCoords({ coords: [lat, lng], locationName });
  };


  const onAiAssist = async () => {
    if (!title && !description && !category && !department && !image) {
      return alert("Provide at least one input for AI to assist");
    }

    setAiLoading(true);
    setAiError("");

    try {
      const data = await aiAssist({
        title,
        description,
        category,
        department,
        image,
        address: coords?.locationName || "", 
      });

      setAiSuggestions(data);
      setDescriptionIndex(0);

      if (data.inferred_title) setTitle(data.inferred_title);
      if (data.description) setDescription(data.description);
      if (data.suggested_category) setCategory(data.suggested_category);
      if (data.suggested_department) setDepartment(data.suggested_department);
    } catch (e) {
      console.error("AI Assist error:", e);
      setAiError("AI Assist failed. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const onRefreshDescription = () => {
    if (!aiSuggestions?.descriptions || aiSuggestions.descriptions.length <= 1) {
      return alert("No alternative descriptions available");
    }
    const nextIndex = (descriptionIndex + 1) % aiSuggestions.descriptions.length;
    setDescription(aiSuggestions.descriptions[nextIndex]);
    setDescriptionIndex(nextIndex);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const latitude = coords?.coords?.[0] ?? parseFloat(latInput);
    const longitude = coords?.coords?.[1] ?? parseFloat(lngInput);

    if (!latitude || !longitude) {
      return alert("Please set your location");
    }

    try {
      const data = await submitComplaint({
        title,
        description,
        category,
        department,
        latitude,
        longitude,
        locationName: coords?.locationName || "Unknown",
        image,
      });

      alert("Report submitted! ID: " + data.id);

      setTitle("");
      setDescription("");
      setCategory("");
      setDepartment("");
      setCoords(null);
      setLatInput("");
      setLngInput("");
      setImage(null);
      setAiSuggestions(null);
      setDescriptionIndex(0);
    } catch (e) {
      console.error(e);
      alert("Submit failed");
    }
  };

  return (
  <div className="complaint-container">
    <h1 className="text-center mb-4">Report an Issue</h1>

    <MapPage value={coords} onChange={setCoords} />

    <div className="d-flex my-3 gap-2">
      <button type="button" onClick={useMyLocation} className="btn btn-primary" style={{backgroundColor: "#facc15", color: "#064e3b", border: "none",
}}>
        Use My Location
      </button>
      <input
        type="text"
        placeholder="Latitude"
        value={latInput}
        onChange={(e) => setLatInput(e.target.value)}
        className="form-control w-25"
      />
      <input
        type="text"
        placeholder="Longitude"
        value={lngInput}
        onChange={(e) => setLngInput(e.target.value)}
        className="form-control w-25"
      />
      <button type="button" onClick={handleManualCoords} className="btn btn-secondary">
        Set Location
      </button>
    </div>

    <form onSubmit={onSubmit} className="complaint-form">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="form-control"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the issue clearly"
        rows={5}
        className="form-control"
      />
      <div className="row">
        <div className="col-md-6">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-select"
          >
            <option value="">Category (optional)</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Department (AI can fill)"
            className="form-control"
          />
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files?.[0] || null)}
        className="form-control"
      />

      {aiError && <p className="ai-error">{aiError}</p>}

      <div className="d-flex gap-2 mt-2">
        <button
          type="button"
          onClick={onAiAssist}
          disabled={aiLoading || !coords}
          className="btn btn-warning"
        >
          {aiLoading ? "AI working…" : "AI Assist"}
        </button>
        <button
          type="button"
          onClick={onRefreshDescription}
          disabled={aiLoading || !aiSuggestions?.descriptions}
          className="btn btn-info"
        >
          Refresh Description
        </button>
        <button type="submit" className="btn btn-success">
          Submit
        </button>
      </div>
    </form>
    

    {coords?.coords && (
      <div className="mt-3">
        <p>
          <b>Selected Location:</b> {coords.coords[0]}, {coords.coords[1]} <br />
          <b>Address:</b> {coords.locationName}
        </p>
      </div>
    )}

    {aiSuggestions && (
      <div className="mt-3">
        {aiSuggestions.inferred_title && (
          <p><b>AI Title:</b> {aiSuggestions.inferred_title}</p>
        )}
        {aiSuggestions.suggested_department && (
          <p><b>AI Department:</b> {aiSuggestions.suggested_department}</p>
        )}
        {aiSuggestions.tags?.length > 0 && (
          <p><b>AI Tags:</b> {aiSuggestions.tags.join(", ")}</p>
        )}
      </div>
    )}
  </div>
);}


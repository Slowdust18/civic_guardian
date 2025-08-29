// src/components/LoginPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function LoginPage({ setIsLoggedIn }) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      await axios.post("http://127.0.0.1:8000/users", formData);
      setIsLoggedIn(true);   // unlock Report Issue button
      navigate("/");          // redirect to main page
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to register. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px" }}>
      <h2>User Login</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        <input
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          name="age"
          type="number"
          placeholder="Age"
          value={formData.age}
          onChange={handleChange}
          required
        />
        <input
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        <input
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          required
        />

        <button
          type="submit"
          style={{
            padding: "10px",
            backgroundColor: "#eb8825de",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>

      {errorMsg && (
        <p style={{ color: "red", marginTop: "10px" }}>{errorMsg}</p>
      )}
    </div>
  );
}

export default LoginPage;

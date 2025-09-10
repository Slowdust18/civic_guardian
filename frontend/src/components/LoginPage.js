// src/components/LoginPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../components/LoginPage.css"; // import the new CSS file

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
      setIsLoggedIn(true);
      navigate("/");
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to register. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="text-center mb-4">User Login</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          className="form-control"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          className="form-control"
          name="age"
          type="number"
          placeholder="Age"
          value={formData.age}
          onChange={handleChange}
          required
        />
        <input
          className="form-control"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        <input
          className="form-control"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          required
        />

        <button
          type="submit"
          className="btn btn-warning w-100 mt-3"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>

      {errorMsg && <p className="error-message">{errorMsg}</p>}
    </div>
  );
}

export default LoginPage;


import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../components/LoginPage.css";

function LoginPage({ setIsLoggedIn }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",   
    age:"",
    aadhar_number: "",
    email: "",
    phnumber: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

 const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
};


 const handleSubmit = async (e) => {
  e.preventDefault();
  setErrorMsg("");
  setLoading(true);

  try {
    const payload = {
      ...formData,
      age: parseInt(formData.age, 10), // convert to number
    };

    await axios.post("http://127.0.0.1:8000/users/register", payload, {
      headers: { "Content-Type": "application/json" },
    });

    setIsLoggedIn(true);
    navigate("/");
  } catch (err) {
    console.error(err.response?.data || err);
    setErrorMsg(err.response?.data?.detail || "Failed to register. Is the backend running?");
  } finally {
    setLoading(false);
  }
};


  // Quotes for right panel
  const quotes = [
    { text: "In local government, it's very clear to your customers - your citizens - whether or not you're delivering. Either that pothole gets filled in, or it doesn't. The results are very much on display, and that creates a very healthy pressure to innovate.", author: "Pete Buttigieg" },
    { text: "When you are in local government, you are on the ground, and you are looking into the eyes and hearts of the people you are there to serve. It teaches you to listen; it teaches you to be expansive in the people with whom you talk to, and I think that that engagement gives you political judgment.", author: "Valerie Jarrett" },
    { text: "Local government is the foundation of democracy, if it fails, democracy will fail.", author: "Robert W. Flack" },
    { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  ];

  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  return (
    <div className="login-page">
      {/* LEFT: User Signup Form */}
      <div className="login-left">
        <h2 className="login-title">User Signup</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <input className="form-control spaced-input" name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleChange} required />
          <input className="form-control spaced-input" name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleChange} required />
          <input className="form-control spaced-input" name="age"  placeholder="Age"  value={formData.age}  onChange={handleChange}  required/>
          <input className="form-control spaced-input" name="aadhar_number" placeholder="Aadhar Number" value={formData.aadhar_number} onChange={handleChange} required />
          <input className="form-control spaced-input" name="phnumber" placeholder="Phone Number" value={formData.phnumber} onChange={handleChange} required />
          <input className="form-control spaced-input" name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input className="form-control spaced-input" name="password" type="password" placeholder="Set Password" value={formData.password} onChange={handleChange} required />

          <button type="submit" className="btn btn-warning w-100 mt-3" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
        {errorMsg && <p className="error-message">{errorMsg}</p>}
      </div>

      {/* RIGHT: Sliding Quotes */}
      <div className="login-right">
        <div className="quote-slider" style={{ transform: `translateX(-${currentQuote * 100}%)` }}>
          {quotes.map((q, index) => (
            <blockquote className="quote" key={index}>
              “{q.text}”
              <span>- {q.author}</span>
            </blockquote>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;


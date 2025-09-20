import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../components/LoginPage.css";

function LoginPage({ setIsLoggedIn }) {
  const [isSignup, setIsSignup] = useState(true);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    age: "",
    aadhar_number: "",
    email: "",
    phnumber: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // ✅ Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (isSignup) {
        // SIGNUP
        const payload = { ...formData, age: parseInt(formData.age, 10) };
        await axios.post("http://127.0.0.1:8000/users/register", payload, {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        // LOGIN
        const payload = { email: formData.email, password: formData.password };
        const res = await axios.post("http://127.0.0.1:8000/users/login", payload, {
          headers: { "Content-Type": "application/json" },
        });

        // ✅ Store session details safely
        if (res.data?.user_id) {
          localStorage.setItem("user_id", String(res.data.user_id)); // always store as string
          localStorage.setItem("isLoggedIn", "true");
          setIsLoggedIn(true);
        } else {
          throw new Error("Login response missing user_id");
        }
      }

      // ✅ Navigate after success
      navigate("/");
    } catch (err) {
      console.error("Login/Signup error:", err.response?.data || err.message);
      let detail = err.response?.data?.detail;

      // If backend returns validation error array
      if (Array.isArray(detail)) {
        detail = detail.map((e) => e.msg).join(", ");
      }
      setErrorMsg(detail || (isSignup ? "Failed to register." : "Failed to login."));
    } finally {
      setLoading(false);
    }
  };

  // ✅ Quotes for right panel
  const quotes = [
    {
      text: "In local government, it's very clear to your customers - your citizens - whether or not you're delivering.",
      author: "Pete Buttigieg",
    },
    {
      text: "When you are in local government, you are on the ground, and you are looking into the eyes and hearts of the people you are there to serve.",
      author: "Valerie Jarrett",
    },
    {
      text: "Local government is the foundation of democracy, if it fails, democracy will fail.",
      author: "Robert W. Flack",
    },
    {
      text: "Act as if what you do makes a difference. It does.",
      author: "William James",
    },
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
      {/* LEFT: Signup/Login Form */}
      <div className="login-left">
        <h2 className="login-title">{isSignup ? "User Signup" : "User Login"}</h2>

        <form onSubmit={handleSubmit} className="login-form">
          {isSignup && (
            <>
              <input
                className="form-control spaced-input"
                name="first_name"
                placeholder="First Name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
              <input
                className="form-control spaced-input"
                name="last_name"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
              <input
                className="form-control spaced-input"
                name="age"
                type="number"
                placeholder="Age"
                value={formData.age}
                onChange={handleChange}
                required
              />
              <input
                className="form-control spaced-input"
                name="aadhar_number"
                placeholder="Aadhar Number"
                value={formData.aadhar_number}
                onChange={handleChange}
                required
              />
              <input
                className="form-control spaced-input"
                name="phnumber"
                placeholder="Phone Number"
                value={formData.phnumber}
                onChange={handleChange}
                required
              />
            </>
          )}

          <input
            className="form-control spaced-input"
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            className="form-control spaced-input"
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="btn btn-warning w-100 mt-3"
            disabled={loading}
          >
            {loading ? "Submitting..." : isSignup ? "Sign Up" : "Login"}
          </button>
        </form>

        {errorMsg && <p className="error-message">{errorMsg}</p>}

        <p className="mt-3 text-center">
          {isSignup ? "Already have an account?" : "Don’t have an account?"}{" "}
          <button
            type="button"
            className="btn btn-link"
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? "Login here" : "Sign up here"}
          </button>
        </p>
      </div>

      {/* RIGHT: Sliding Quotes */}
      <div className="login-right">
        <div
          className="quote-slider"
          style={{ transform: `translateX(-${currentQuote * 100}%)` }}
        >
          {quotes.map((q, index) => (
            <blockquote className="quote" key={index}>
              “{q.text}”<span>- {q.author}</span>
            </blockquote>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

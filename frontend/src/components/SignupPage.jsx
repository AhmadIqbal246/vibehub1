import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import ENV from "../config";
import LoginButton from "./LoginButton";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

 const handleSignup = (e) => {
  e.preventDefault();

  axios.post(`${ENV.BASE_API_URL}/auth/api/manual-signup/`, formData, {
    withCredentials: true,
  })
    .then(() => {
      // ✅ After successful signup, fetch current user
      return axios.get(`${ENV.BASE_API_URL}/auth/api/user/`, {
        withCredentials: true,
      });
    })
    .then((res) => {
      // ✅ Save username in localStorage
      localStorage.setItem("username", res.data.username);
      navigate("/profile");
    })
    .catch(err => {
      const msg = err?.response?.data?.detail || "Signup failed";
      setError(msg);
    });
};


  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "40px" }}>
      <h2 style={{ textAlign: "center" }}>Signup</h2>

      <form onSubmit={handleSignup}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
          style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
          required
          style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }}
        />

   

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" style={{ width: "100%", padding: "10px", marginBottom: "20px" }}>
          Create Account
        </button>
      </form>

      <p style={{ textAlign: "center" }}>OR</p>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <LoginButton />
      </div>

      <p style={{ textAlign: "center" }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default SignupPage;

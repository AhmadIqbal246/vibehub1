import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import ENV from "../config";
import LoginButton from "./LoginButton";
import Cookies from "js-cookie";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

const handleLogin = (e) => {
  e.preventDefault();

  axios.post(`${ENV.BASE_API_URL}/auth/api/manual-login/`, formData, {
    withCredentials: true,
    headers: {
      "X-CSRFToken": Cookies.get("csrftoken"),
    },
  })
    .then(() => {
      // ✅ Fetch the current user from Django after login
      return axios.get(`${ENV.BASE_API_URL}/auth/api/user/`, {
        withCredentials: true,
      });
    })
    .then((res) => {
      const username = res.data.username;
      localStorage.setItem("username", username); // ✅ Save in localStorage
      navigate("/profile");
    })
    .catch((err) => {
      const msg = err?.response?.data?.detail || "Login failed";
      setError(msg);
    });
};


  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "40px" }}>
      <h2 style={{ textAlign: "center" }}>Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          style={{
            display: "block",
            width: "100%",
            marginBottom: "10px",
            padding: "8px",
          }}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoComplete="current-password"
          value={formData.password}
          onChange={handleChange}
          required
          style={{
            display: "block",
            width: "100%",
            marginBottom: "10px",
            padding: "8px",
          }}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button
          type="submit"
          style={{ width: "100%", padding: "10px", marginBottom: "20px" }}
        >
          Login
        </button>
      </form>

      <p style={{ textAlign: "center" }}>OR</p>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <LoginButton />
      </div>

      <p style={{ textAlign: "center" }}>
        Don’t have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
};

export default LoginPage;

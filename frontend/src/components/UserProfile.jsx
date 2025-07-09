import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import ENV from "../config";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    phone_number: "",
    first_name: "",
    last_name: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  // Fetch user info
const fetchUser = () => {
  return axios
    .get(`${ENV.BASE_API_URL}/auth/api/user/`, {
      withCredentials: true,
    })
    .then((res) => {
      setUser(res.data);
      setFormData({
        username: res.data.username || "",
        phone_number: res.data.phone_number || "",
        first_name: res.data.first_name || "",
        last_name: res.data.last_name || "",
      });
      setLoading(false);
      return res.data; // ✅ return user data
    })
    .catch(() => {
      setUser(null);
      setLoading(false);
      return null;
    });
};


useEffect(() => {
  fetchUser().then((userData) => {
    // ✅ Save username if redirected from Google login
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get("logged_in") === "google") {
      localStorage.setItem("username", userData.username);
    }
  });

  axios.get(`${ENV.BASE_API_URL}/auth/api/csrf/`, {
    withCredentials: true,
  });
}, []);


  // Handle form field change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle profile update
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await axios.put(`${ENV.BASE_API_URL}/auth/api/update-profile/`, formData, {
        withCredentials: true,
        headers: {
          "X-CSRFToken": Cookies.get("csrftoken"),
        },
      });
      setSuccess("Profile updated successfully.");
      fetchUser();
    } catch (err) {
      setError("Update failed. " + (err?.response?.data?.detail || ""));
    }
  };

  // Handle logout
const handleLogout = async () => {
  try {
    await axios.get(`${ENV.BASE_API_URL}/auth/api/logout/`, {
      withCredentials: true,
    });

    localStorage.removeItem("username"); // ✅ Clear username from storage
    localStorage.clear(); // Optional: clear everything if you store other data
    setUser(null);
    navigate("/login");
  } catch (err) {
    console.error("Logout failed", err);
  }
};


  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Not logged in</p>;

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>User Profile</h2>
      <p><strong>Email:</strong> {user.email}</p>

      <form onSubmit={handleUpdate} style={{ marginTop: "30px" }}>
        <label><strong>First Name:</strong></label><br />
        <input
          type="text"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          required
          style={{ padding: "8px", margin: "10px 0", width: "200px" }}
        /><br />

        <label><strong>Last Name:</strong></label><br />
        <input
          type="text"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          required
          style={{ padding: "8px", margin: "10px 0", width: "200px" }}
        /><br />

        <label><strong>Username:</strong></label><br />
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          style={{ padding: "8px", margin: "10px 0", width: "200px" }}
        /><br />

        <label><strong>Phone Number:</strong></label><br />
        <input
          type="text"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          required
          style={{ padding: "8px", margin: "10px 0", width: "200px" }}
        /><br />

        <button type="submit" style={{ padding: "8px 20px" }}>Update Profile</button>

        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
        {success && <p style={{ color: "green", marginTop: "10px" }}>{success}</p>}
      </form>

      <button onClick={handleLogout} style={{ marginTop: "30px", padding: "8px 20px" }}>
        Logout
      </button>
    </div>
  );
};

export default UserProfile;

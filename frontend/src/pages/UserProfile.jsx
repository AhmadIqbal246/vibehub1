import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, logoutUser, fetchCurrentUser } from '../store/auth/authActions';
import { Camera, User, Phone, Mail, Edit3, LogOut, Check, X, Calendar, Book } from "lucide-react";
import InputField from "../components/common/InputField";
import Avatar from "../components/common/Avatar";
import { Navbar } from "../components/mutualcomponents/Navbar/Navbar";
import ENV from "../config";
import Popup from "../components/common/Popup";

const UserProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading, error: reduxError, isAuthenticated, isInitialized } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    username: "",
    phone_number: "",
    first_name: "",
    last_name: "",
    bio: "",
    date_of_birth: "",
    gender: "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate("/login");
    }
  }, [isInitialized, isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        phone_number: user.phone_number || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        bio: user.bio || "",
        date_of_birth: user.date_of_birth || "",
        gender: user.gender || "",
      });
      setPreviewUrl(
        user.profile_picture_url
          ? `${ENV.BASE_API_URL}${user.profile_picture_url}`
          : ""
      );
    }
  }, [user]);

  // Update error state when Redux error changes
  useEffect(() => {
    if (reduxError) {
      setError(reduxError);
    }
  }, [reduxError]);

  const getUserInitials = (user) => {
    if (!user) return '';
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    }
    return user.username.charAt(0).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setSuccess("");
    setError("");

    const updateData = new FormData();
    updateData.append("username", formData.username);
    updateData.append("phone_number", formData.phone_number);
    updateData.append("first_name", formData.first_name);
    updateData.append("last_name", formData.last_name);
    updateData.append("bio", formData.bio);
    updateData.append("date_of_birth", formData.date_of_birth);
    updateData.append("gender", formData.gender);
    if (profilePicture) {
      updateData.append("profile_picture", profilePicture);
    }

    try {
      const result = await dispatch(updateProfile(updateData)).unwrap();
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
        // Fetch fresh user data
        await dispatch(fetchCurrentUser());
      }
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setUpdating(false);
      // Clear success message after 3 seconds
      if (!error) {
        setTimeout(() => setSuccess(""), 3000);
      }
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navbar Container */}
      <div className="fixed top-0 left-0 h-full w-16 md:w-64">
        <Navbar />
      </div>

      {/* Main Content - Profile Section */}
      <div className="flex-1 pl-16 md:pl-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile Settings</h1>
                <button
                  onClick={() => setShowLogoutPopup(true)}
                  className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  <span className="inline">Logout</span>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
                  <p>{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar
                      src={previewUrl}
                      alt={user?.username}
                      initials={getUserInitials(user)}
                      size="xl"
                    />
                    <label
                      htmlFor="profile-picture"
                      className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <Camera className="w-5 h-5 text-gray-600" />
                      <input
                        type="file"
                        id="profile-picture"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setProfilePicture(file);
                            setPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {user?.first_name
                        ? `${user.first_name} ${user.last_name}`
                        : user?.username}
                    </h2>
                    <p className="text-gray-500">{user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 mt-8">
                  {/* Form fields with responsive grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      id="username"
                      name="username"
                      type="text"
                      label="Username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      icon={User}
                      disabled={!isEditing}
                    />

                    <InputField
                      id="phone"
                      name="phone"
                      type="tel"
                      label="Phone Number"
                      value={formData.phone_number}
                      onChange={(e) =>
                        setFormData({ ...formData, phone_number: e.target.value })
                      }
                      icon={Phone}
                      disabled={!isEditing}
                    />
                  </div>

                  <InputField
                    id="email"
                    name="email"
                    type="email"
                    label="Email"
                    value={user?.email || ""}
                    icon={Mail}
                    disabled
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      id="firstName"
                      name="firstName"
                      type="text"
                      label="First Name"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      disabled={!isEditing}
                    />

                    <InputField
                      id="lastName"
                      name="lastName"
                      type="text"
                      label="Last Name"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>

                  {/* Bio field */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <div className="relative rounded-lg shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Book className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                          id="bio"
                          name="bio"
                          rows="3"
                          className="block w-full pl-10 sm:text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                          value={formData.bio}
                          onChange={(e) =>
                            setFormData({ ...formData, bio: e.target.value })
                          }
                          disabled={!isEditing}
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        label="Date of Birth"
                        value={formData.date_of_birth}
                        onChange={(e) =>
                          setFormData({ ...formData, date_of_birth: e.target.value })
                        }
                        icon={Calendar}
                        disabled={!isEditing}
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gender
                        </label>
                        <select
                          id="gender"
                          name="gender"
                          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
                          value={formData.gender}
                          onChange={(e) =>
                            setFormData({ ...formData, gender: e.target.value })
                          }
                          disabled={!isEditing}
                        >
                          <option value="">Select gender</option>
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                          <option value="O">Other</option>
                          <option value="P">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <X className="w-5 h-5 mr-2" />
                        <span className="hidden sm:inline">Cancel</span>
                      </button>
                      <button
                        type="submit"
                        disabled={updating}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Check className="w-5 h-5 mr-2" />
                        <span className="hidden sm:inline">
                          {updating ? "Saving..." : "Save Changes"}
                        </span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Edit3 className="w-5 h-5 mr-2" />
                      <span className="hidden sm:inline">Edit Profile</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Popup
        open={showLogoutPopup}
        onClose={() => setShowLogoutPopup(false)}
        title="Logout Confirmation"
        description="Are you sure you want to logout?"
        showClose={false}
      >
        <div className="flex justify-end space-x-2 mt-4">
          <button
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold shadow-sm transition"
            onClick={() => setShowLogoutPopup(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-bold shadow-lg transition"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </Popup>
    </div>
  );
};

export default UserProfile;
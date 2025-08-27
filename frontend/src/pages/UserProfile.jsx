import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, fetchCurrentUser } from '../store/auth/authActions';
import { Camera, User, Phone, Mail, Edit3, Check, X, Calendar, Book, Heart, MapPin } from "lucide-react";
import InputField from "../components/common/InputField";
import Avatar from "../components/common/Avatar";
import { Navbar } from "../components/mutualcomponents/Navbar/Navbar";
import ENV from "../config";

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
  const [showEditModal, setShowEditModal] = useState(false);

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
        setShowEditModal(false);
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

  const formatGender = (gender) => {
    const genderMap = {
      'M': 'Male',
      'F': 'Female', 
      'O': 'Other',
      'P': 'Prefer not to say'
    };
    return genderMap[gender] || 'Not specified';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Navbar Container */}
      <div className="fixed top-0 left-0 h-full w-16 md:w-64">
        <Navbar />
      </div>

      {/* Main Content - Profile Section */}
      <div className="flex-1 pl-16 md:pl-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">

          {/* Success and Error Messages */}
          {updating && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent mr-3"></div>
                <p className="text-blue-700 font-medium">Updating profile...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          )}

          {/* Main Profile Container */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            {/* Top Section - 30% - Profile Picture, Username, Phone, Email */}
            <div className="relative h-[40vh] bg-gradient-to-br from-gray-900 via-black to-slate-800 p-8 flex items-center">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
              </div>
              
              {/* Edit Profile Button - Top Right */}
              <div className="absolute top-6 right-8 z-20">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="group relative overflow-hidden bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-2xl font-semibold shadow-xl hover:shadow-2xl hover:bg-white/30 transition-all duration-300 transform hover:scale-105 border border-white/30"
                >
                  <div className="relative flex items-center space-x-2">
                    <Edit3 className="w-5 h-5" />
                    <span className="hidden sm:inline">Edit Profile</span>
                  </div>
                </button>
              </div>
              
              <div className="relative z-10 w-full flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-12">
                {/* Profile Picture - Left Side (Larger) */}
                <div className="flex-shrink-0 lg:ml-8">
                  <div className="relative">
                    <div className="w-48 h-48 lg:w-56 lg:h-56 rounded-full overflow-hidden relative border-4 border-white/30">
                      {previewUrl ? (
                        <img 
                          src={previewUrl} 
                          alt={user?.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                          <span className="text-6xl lg:text-7xl font-bold text-white">
                            {getUserInitials(user)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Details - Right Side */}
                <div className="flex-1 text-center lg:text-left space-y-6">
                  <div>
                    <h1 className="text-4xl lg:text-6xl font-bold text-white mb-3 tracking-tight">
                      {user?.first_name && user?.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : user?.username || 'User'}
                    </h1>
                    <p className="text-white/80 text-2xl font-medium mb-6">@{user?.username}</p>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    {user?.phone_number && (
                      <div className="flex items-center justify-center lg:justify-start space-x-4 text-white/90">
                        <div className="bg-white/20 rounded-xl p-3">
                          <Phone className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-medium">{user.phone_number}</span>
                      </div>
                    )}
                    
                    {user?.email && (
                      <div className="flex items-center justify-center lg:justify-start space-x-4 text-white/90">
                        <div className="bg-white/20 rounded-xl p-3">
                          <Mail className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-medium">{user.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section - 70% - Divided Vertically 50-50 */}
            <div className="min-h-[60vh] flex flex-col lg:flex-row">
              {/* Left Half - First Name, Last Name, Bio */}
              <div className="flex-1 p-8 lg:p-12 bg-gradient-to-br from-white to-purple-50/50">
                <div className="h-full flex flex-col justify-start pt-8 space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center">
                      <User className="w-7 h-7 mr-3 text-purple-600" />
                      Personal Information
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="bg-white/70 rounded-2xl p-6 shadow-lg backdrop-blur-sm border border-purple-100">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Full Name</h3>
                        <p className="text-2xl font-bold text-gray-900">
                          {user?.first_name || user?.last_name 
                            ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
                            : 'Not specified'}
                        </p>
                      </div>
                      
                      <div className="bg-white/70 rounded-2xl p-6 shadow-lg backdrop-blur-sm border border-purple-100">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                          <Book className="w-5 h-5 mr-2 text-purple-600" />
                          About Me
                        </h3>
                        <p className="text-gray-800 text-lg leading-relaxed">
                          {user?.bio || 'No bio available yet. Click Edit Profile to add one!'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Half - Date of Birth, Gender */}
              <div className="flex-1 p-8 lg:p-12 bg-gradient-to-br from-pink-50/50 to-white">
                <div className="h-full flex flex-col justify-start pt-8 space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center">
                      <MapPin className="w-7 h-7 mr-3 text-pink-600" />
                      Additional Details
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="bg-white/70 rounded-2xl p-6 shadow-lg backdrop-blur-sm border border-pink-100">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                          <Calendar className="w-5 h-5 mr-2 text-pink-600" />
                          Date of Birth
                        </h3>
                        <p className="text-xl font-bold text-gray-900">
                          {formatDate(user?.date_of_birth)}
                        </p>
                      </div>
                      
                      <div className="bg-white/70 rounded-2xl p-6 shadow-lg backdrop-blur-sm border border-pink-100">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Gender</h3>
                        <p className="text-xl font-bold text-gray-900">
                          {formatGender(user?.gender)}
                        </p>
                      </div>
                               </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ultra Modern Luxury Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Edit3 className="w-6 h-6 mr-3" />
                Edit Profile
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-80px)]">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Profile Picture Section */}
                <div className="flex justify-center mb-8">
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full opacity-75 group-hover:opacity-100 transition-opacity"></div>
                    <Avatar
                      src={previewUrl}
                      alt={user?.username}
                      initials={getUserInitials(user)}
                      size="xl"
                      className="relative border-4 border-white shadow-xl"
                    />
                    <label
                      htmlFor="profile-picture-edit"
                      className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 group"
                    >
                      <Camera className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                      <input
                        type="file"
                        id="profile-picture-edit"
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
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-white/70 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-0 transition-colors text-gray-900 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                      <input
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-white/70 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-0 transition-colors text-gray-900 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/70 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-0 transition-colors text-gray-900 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/70 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-0 transition-colors text-gray-900 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                      <input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-white/70 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-0 transition-colors text-gray-900 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-3 bg-white/70 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-0 transition-colors text-gray-900 font-medium"
                    >
                      <option value="">Select gender</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                      <option value="P">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                {/* Bio Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                  <div className="relative">
                    <Book className="absolute left-4 top-4 w-5 h-5 text-purple-400" />
                    <textarea
                      rows="4"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      className="w-full pl-12 pr-4 py-3 bg-white/70 border-2 border-purple-100 rounded-xl focus:border-purple-400 focus:ring-0 transition-colors text-gray-900 font-medium resize-none"
                    />
                  </div>
                </div>

                {/* Email Field (Disabled) */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full pl-12 pr-4 py-3 bg-gray-100/70 border-2 border-gray-200 rounded-xl text-gray-500 font-medium cursor-not-allowed"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center space-x-2">
                      {updating ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
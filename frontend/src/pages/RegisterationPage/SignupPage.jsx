import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { signupUser } from '../../store/auth/authActions';
import axios from "axios";
import ENV from "../../config";
import GoogleButton from "react-google-button";
import { 
  FaEnvelope, 
  FaLock, 
  FaUser, 
  FaUserPlus, 
  FaGoogle, 
  FaSignInAlt, 
  FaSpinner,
  FaStar,
  FaHeart,
  FaShieldAlt,
  FaBolt,
  FaGem,
  FaUserShield
} from 'react-icons/fa';
import InputField from "../../components/common/InputField";

const SignupPage = () => {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/profile");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const result = await dispatch(signupUser(formData));
    if (!result.error) {
      navigate("/profile");
    }
  };

  const handleGoogleLogin = () => {
    const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    const REDIRECT_URI = "auth/api/login/google/";
    const scope = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ].join(" ");

    const params = {
      response_type: "code",
      client_id: ENV.GOOGLE_OAUTH2_CLIENT_ID,
      redirect_uri: `${ENV.BASE_API_URL}/${REDIRECT_URI}`,
      prompt: "select_account",
      access_type: "offline",
      scope,
    };

    window.location = `${GOOGLE_AUTH_URL}?${new URLSearchParams(params).toString()}`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        
        {/* Floating sparkles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            >
              <FaGem className="text-white/20 text-sm" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Glass morphism card */}
          <div className="backdrop-blur-xl bg-white/8 border border-white/15 rounded-3xl p-6 sm:p-7 lg:p-8 shadow-2xl relative overflow-hidden group hover:bg-white/12 transition-all duration-500">
            {/* Inner glow effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 rounded-3xl"></div>
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header with icons */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl mb-3 shadow-lg group-hover:scale-110 transition-all duration-300">
                  <FaUserShield className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-100 bg-clip-text text-transparent">
                  Sign Up
                </h1>
              </div>
              
              {/* Signup Form */}
              <form onSubmit={handleSignup} className="space-y-4">
                <InputField
                  id="username"
                  name="username"
                  type="text"
                  label="Username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  icon={FaUser}
                  required
                />

                <InputField
                  id="email"
                  name="email"
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  icon={FaEnvelope}
                  required
                />

                <InputField
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  icon={FaLock}
                  required
                />

                {/* Error message with enhanced design */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 backdrop-blur-sm">
                    <p className="text-red-400 text-sm font-medium flex items-center justify-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      {error}
                    </p>
                  </div>
                )}

                {/* Enhanced Signup Button */}
                <button
                  type="submit"
                  className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-0.5 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={loading}
                >
                  <div className="relative rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-3.5 text-white transition-all duration-300 group-hover:from-emerald-700 group-hover:via-teal-700 group-hover:to-cyan-700">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <div className="relative flex items-center justify-center gap-3 font-semibold text-base">
                      {loading ? (
                        <>
                          <FaSpinner className="animate-spin w-5 h-5" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <FaUserPlus className="w-5 h-5" />
                          <span>Create Account</span>
                          <FaStar className="w-4 h-4" />
                        </>
                      )}
                    </div>
                  </div>
                </button>
              </form>

              {/* Divider with enhanced design */}
              <div className="my-6 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-6 py-2 bg-white/10 backdrop-blur-sm text-white/70 font-medium rounded-full border border-white/20">
                    or continue with
                  </span>
                </div>
              </div>

              {/* Enhanced Google Button */}
              <button
                onClick={handleGoogleLogin}
                className="group relative w-full overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-3.5 transition-all duration-300 hover:scale-105 hover:bg-white/15 hover:border-white/30 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="relative flex items-center justify-center gap-3">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <FaGoogle className="w-4 h-4 text-gray-700" />
                  </div>
                  <span className="font-medium text-white">Continue with Google</span>
                </div>
              </button>
              
              {/* Footer links */}
              <div className="mt-6 text-center">
                <p className="text-white/60 text-sm">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="text-emerald-300 hover:text-emerald-200 font-medium transition-colors duration-200 underline underline-offset-2 decoration-emerald-300/50 hover:decoration-emerald-200"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>
          
          {/* Trust indicators - responsive layout */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-white/40">
            <div className="flex items-center gap-2 text-xs">
              <FaShieldAlt className="w-4 h-4" />
              <span className="hidden sm:inline">Secure Signup</span>
              <span className="sm:hidden">Secure</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <FaBolt className="w-4 h-4" />
              <span className="hidden sm:inline">Quick & Easy</span>
              <span className="sm:hidden">Quick</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <FaHeart className="w-4 h-4" />
              <span className="hidden sm:inline">Privacy First</span>
              <span className="sm:hidden">Private</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
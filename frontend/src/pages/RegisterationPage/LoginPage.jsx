import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, handleGoogleLoginSuccess } from '../../store/auth/authActions';
import axios from "axios";
import ENV from "../../config";
// Cookies import removed - CSRF disabled
import GoogleButton from "react-google-button";
import { 
  FaEnvelope, 
  FaLock, 
  FaSignInAlt, 
  FaGoogle, 
  FaUserPlus, 
  FaSpinner,
  FaEye,
  FaEyeSlash,
  FaStar,
  FaHeart,
  FaShieldAlt,
  FaBolt,
  FaGem
} from 'react-icons/fa';
import InputField from "../../components/common/InputField";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated, isInitialized } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check for Google login success or error
    const searchParams = new URLSearchParams(location.search);
    const googleSuccess = searchParams.get('google_success');
    const googleError = searchParams.get('error');
    const accessToken = searchParams.get('access');
    const refreshToken = searchParams.get('refresh');
    
    if (googleSuccess === 'true' && accessToken && refreshToken) {
      // Store JWT tokens from Google OAuth redirect
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      
      // Fetch user data and update Redux state
      dispatch(handleGoogleLoginSuccess())
        .then((result) => {
          if (result.success) {
            // Clean URL and navigate
            const from = location.state?.from?.pathname || "/profile";
            navigate(from, { replace: true });
          }
        })
        .catch(() => {
          // If fetching user data fails, clear tokens
          localStorage.clear();
        });
      
      // Clean URL immediately
      navigate('/login', { replace: true });
    } else if (googleError === 'google_login_failed') {
      dispatch({ type: 'auth/setError', payload: 'Google login failed. Please try again.' });
      // Clear the error parameter from URL
      navigate('/login', { replace: true });
    }
  }, [location, dispatch, navigate]);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      const from = location.state?.from?.pathname || "/profile";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isInitialized, navigate, location]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(formData));
    if (result.success) {
      const from = location.state?.from?.pathname || "/profile";
      navigate(from, { replace: true });
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
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl mb-3 shadow-lg group-hover:scale-110 transition-all duration-300">
                  <FaShieldAlt className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">
                  Login
                </h1>
              </div>
              
              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
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
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  icon={FaLock}
                  required
                  autoComplete="current-password"
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

                {/* Enhanced Login Button */}
                <button
                  type="submit"
                  className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-0.5 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={loading}
                >
                  <div className="relative rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-6 py-3.5 text-white transition-all duration-300 group-hover:from-purple-700 group-hover:via-violet-700 group-hover:to-indigo-700">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <div className="relative flex items-center justify-center gap-3 font-semibold text-base">
                      {loading ? (
                        <>
                          <FaSpinner className="animate-spin w-5 h-5" />
                          <span>Signing you in...</span>
                        </>
                      ) : (
                        <>
                          <FaBolt className="w-5 h-5" />
                          <span>Sign In</span>
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
                  Don't have an account?{' '}
                  <Link 
                    to="/signup" 
                    className="text-purple-300 hover:text-purple-200 font-medium transition-colors duration-200 underline underline-offset-2 decoration-purple-300/50 hover:decoration-purple-200"
                  >
                    Sign up here
                  </Link>
                </p>
              </div>
            </div>
          </div>
          
          {/* Trust indicators - responsive layout */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-white/40">
            <div className="flex items-center gap-2 text-xs">
              <FaShieldAlt className="w-4 h-4" />
              <span className="hidden sm:inline">Secure Login</span>
              <span className="sm:hidden">Secure</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <FaBolt className="w-4 h-4" />
              <span className="hidden sm:inline">Fast & Reliable</span>
              <span className="sm:hidden">Fast</span>
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

export default LoginPage;
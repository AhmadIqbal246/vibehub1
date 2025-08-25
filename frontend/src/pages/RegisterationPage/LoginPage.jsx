import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, handleGoogleLoginSuccess } from '../../store/auth/authActions';
import axios from "axios";
import ENV from "../../config";
// Cookies import removed - CSRF disabled
import GoogleButton from "react-google-button";
import { FaEnvelope, FaLock, FaSignInAlt, FaGoogle, FaUserPlus, FaSpinner } from 'react-icons/fa';
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 animate-gradient-shift">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-gray-100 transform transition-all duration-500 ease-in-out hover:scale-102 hover:shadow-3xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-purple-100 rounded-full opacity-60 animate-blob mix-blend-multiply filter blur-xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-100 rounded-full opacity-60 animate-blob animation-delay-2000 mix-blend-multiply filter blur-xl"></div>

        <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8 tracking-tight relative z-10">
          Welcome Back!
        </h2>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <InputField
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="your@email.com"
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
            placeholder="Your password"
            value={formData.password}
            onChange={handleChange}
            icon={FaLock}
            required
            autoComplete="current-password"
          />

          {error && (
            <p className="text-red-600 text-sm text-center flex items-center justify-center gap-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center bg-green text-white py-3 rounded-lg hover:bg-indigo-700 transition duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" /> Logging in...
              </>
            ) : (
              <>
                <FaSignInAlt className="mr-2" /> Login
              </>
            )}
          </button>
        </form>

        <div className="my-6 text-center text-gray-400 font-medium relative z-10 before:content-[''] before:absolute before:left-0 before:top-1/2 before:w-5/12 before:h-px before:bg-gray-300 after:content-[''] after:absolute after:right-0 after:top-1/2 after:w-5/12 after:h-px after:bg-gray-300">
          OR
        </div>

        <div className="flex justify-center relative z-10">
          <GoogleButton
            onClick={handleGoogleLogin}
            label="Continue with Google"
            className="!shadow-md hover:!shadow-lg !transition-all !duration-300"
          >
            <FaGoogle className="inline-block mr-2" />
          </GoogleButton>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
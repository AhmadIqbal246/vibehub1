import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { signupUser } from '../../store/auth/authActions';
import axios from "axios";
import ENV from "../../config";
import GoogleButton from "react-google-button";
import { FaEnvelope, FaLock, FaUser, FaUserPlus, FaGoogle, FaSignInAlt, FaSpinner } from 'react-icons/fa';
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 animate-gradient-shift">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-gray-100 transform transition-all duration-500 ease-in-out hover:scale-102 hover:shadow-3xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-purple-100 rounded-full opacity-60 animate-blob mix-blend-multiply filter blur-xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-100 rounded-full opacity-60 animate-blob animation-delay-2000 mix-blend-multiply filter blur-xl"></div>

        <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8 tracking-tight relative z-10">
          Create Account
        </h2>

        <form onSubmit={handleSignup} className="space-y-6 relative z-10">
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
            placeholder="Choose a strong password"
            value={formData.password}
            onChange={handleChange}
            icon={FaLock}
            required
          />

          {error && (
            <p className="text-red-600 text-sm text-center flex items-center justify-center gap-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" /> Creating Account...
              </>
            ) : (
              <>
                <FaUserPlus className="mr-2" /> Sign Up
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

        <p className="mt-8 text-center text-sm text-gray-600 relative z-10">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-600 font-semibold hover:underline hover:text-indigo-700 transition duration-200 flex items-center justify-center mt-2 sm:inline-flex sm:mt-0"
          >
            Sign in <FaSignInAlt className="ml-1" />
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
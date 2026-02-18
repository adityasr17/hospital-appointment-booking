import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import loginBg from "../login_bg.avif";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        { email, password }
      );

      const token = res.data.token;
      localStorage.setItem("token", token);

      const decoded = jwtDecode(token);

      if (decoded.role === "doctor") {
        navigate("/doctor");
      } else if (decoded.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/booking");
      }

    } catch (error) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Top navbar / branding */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-3">
          {/* Hospital logo icon */}
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <span className="text-white text-xl font-bold tracking-wide">MedBook</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/80">
            Create Account
          </span>
          <Link
            to="/register" className="bg-white text-teal-700 text-sm font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 transition shadow">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 72px)" }}>
        {/* Left-aligned tagline for larger screens */}
        <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-between px-6 gap-12">
          {/* Hero text */}
          <div className="hidden lg:flex flex-col justify-center max-w-md pt-12">
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-4">
              Your Health,<br />Our Priority.
            </h1>
            <p className="text-white/80 text-lg leading-relaxed">
              Book appointments with top specialists in just a few clicks. Trusted by thousands of patients every day.
            </p>
            <div className="flex items-center gap-6 mt-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">500+</p>
                <p className="text-white/70 text-sm">Doctors</p>
              </div>
              <div className="w-px h-10 bg-white/30" />
              <div className="text-center">
                <p className="text-3xl font-bold text-white">50k+</p>
                <p className="text-white/70 text-sm">Patients</p>
              </div>
              <div className="w-px h-10 bg-white/30" />
              <div className="text-center">
                <p className="text-3xl font-bold text-white">4.9</p>
                <p className="text-white/70 text-sm">Rating</p>
              </div>
            </div>
          </div>

          {/* Login card */}
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-50 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                <p className="text-gray-500 text-sm mt-1">Sign in to access your account</p>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r mb-6 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-gray-700 text-sm font-medium">Password</label>
                  </div>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 focus:ring-4 focus:ring-teal-200 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-500 text-sm">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-teal-600 font-semibold hover:text-teal-700 transition">
                    Create one
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-4">
        <p className="text-white/50 text-xs">&copy; 2026 MedBook. All rights reserved.</p>
      </div>
    </div>
  );
}

export default Login;

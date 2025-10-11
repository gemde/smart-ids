import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Global state for OTP

function Login() {
  const navigate = useNavigate();
  const { setOtpEmail } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = "http://localhost:5000/api/auth";

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed. Please check your credentials."
        );
      }

      // ✅ Store email globally and locally for OTP use
      setOtpEmail(formData.email);
      localStorage.setItem("otp_email", formData.email);

      // ✅ Redirect to correct route (must match App.jsx)
      navigate("/otp", { replace: true });
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message || "Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .auth-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f8f9fa;
        }
        .auth-container {
          max-width: 400px;
          width: 100%;
          background: #ffffff;
          padding: 3rem;
          border-radius: 0.75rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .form-control:focus {
          border-color: #ffc107;
          box-shadow: 0 0 0 0.25rem rgba(255, 193, 7, 0.25);
        }
        .btn-primary {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }
        .btn-primary:hover {
          background-color: #0b5ed7;
          border-color: #0a58ca;
        }
        .text-warning {
          color: #ffc107 !important;
        }
      `}</style>

      <div className="auth-page">
        <div className="auth-container shadow-lg p-5 rounded">
          <h2 className="fw-bold mb-4 text-center text-warning">User Login</h2>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <div className="mb-3">
              <label className="form-label fw-semibold">Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Password</label>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <button
              className="btn btn-primary w-100 py-2 fw-semibold mt-2"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center mt-3">
            Don’t have an account?{" "}
            <Link to="/register" className="text-warning fw-semibold">
              Register
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default Login;

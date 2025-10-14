import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { setOtpEmail } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user", // fixed for public registration
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const API_BASE_URL = "http://localhost:5000/api/auth";

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed!");
      }

      // Save email for OTP page if needed
      setOtpEmail(formData.email);
      localStorage.setItem("otpEmail", formData.email);

      setSuccessMessage(
        data.message || "✅ Registration successful! Please check your email for OTP verification."
      );

      // Navigate to OTP page after 1.5s
      setTimeout(() => {
        navigate("/otp", { state: { email: formData.email } });
      }, 1500);
    } catch (error) {
      console.error("Registration Error:", error);
      setErrorMessage(
        error.message || "❌ Server not reachable. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .auth-page { display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f8f9fa; }
        .auth-container { max-width:400px; width:100%; background:#fff; padding:3rem; border-radius:.75rem; box-shadow:0 4px 12px rgba(0,0,0,0.1); }
        .form-control:focus { border-color:#ffc107; box-shadow:0 0 0 .25rem rgba(255,193,7,0.25); }
        .btn-warning { background:#ffc107; border-color:#ffc107; color:#212529; }
        .btn-warning:hover { background:#ffcd39; border-color:#ffc107; }
        .text-warning { color:#ffc107 !important; }
        .text-primary { color:#0d6efd !important; }
      `}</style>

      <div className="auth-page">
        <div className="auth-container shadow-lg p-5 rounded">
          <h2 className="fw-bold mb-4 text-center text-warning">Create Account</h2>

          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Username</label>
              <input
                type="text"
                name="username"
                className="form-control"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

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
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <p className="text-muted text-sm my-3 text-center">
              All new public accounts are automatically assigned the <strong>User</strong> role.
            </p>

            <button
              className="btn btn-warning w-100 py-2 fw-semibold mt-2"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <p className="text-center mt-3">
            Already have an account?{" "}
            <Link to="/login" className="text-primary fw-semibold">
              Login
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default Register;

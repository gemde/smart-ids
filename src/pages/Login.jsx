import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { setOtpEmail } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const API_BASE_URL = "http://localhost:5000/api/auth";

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed. Check credentials.");
      }

      // ✅ Store email for OTP
      setOtpEmail(formData.email);
      localStorage.setItem("otpEmail", formData.email);

      setSuccessMessage(
        "✅ Login successful! Please check your email for the OTP."
      );

      // Redirect to OTP page after short delay
      setTimeout(() => {
        navigate("/otp", { state: { email: formData.email } });
      }, 1500);
    } catch (err) {
      console.error("Login Error:", err);
      setErrorMessage(err.message || "❌ Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <div className="auth-container shadow-lg p-5 rounded" style={{ maxWidth: "400px", width: "100%", background: "#fff" }}>
        <h2 className="fw-bold mb-4 text-center" style={{ color: "#ffc107" }}>User Login</h2>

        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

        <form onSubmit={handleSubmit}>
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
          <Link to="/register" style={{ color: "#ffc107", fontWeight: "600" }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

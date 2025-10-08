import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./auth.css";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData
      );
      alert(res.data.message);

      // Store email in localStorage for OTP page
      localStorage.setItem("otpEmail", formData.email.toLowerCase());

      // Redirect to OTP page and pass email in state
      navigate("/OtpPage", { state: { email: formData.email } });
    } catch (error) {
      setError(error.response?.data?.message || "Login failed!");
      alert(error.response?.data?.message || "Login failed!");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container shadow-lg p-5 rounded">
        <h2 className="fw-bold mb-4 text-center text-warning">User Login</h2>
        {error && <p className="text-danger text-center">{error}</p>}
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
            />
          </div>

          <button className="btn btn-primary w-100 py-2 fw-semibold mt-2">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;

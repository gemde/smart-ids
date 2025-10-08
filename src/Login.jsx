import { useState } from "react";
import { Link } from "react-router-dom";
import "./auth.css";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login Data:", formData);
    // TODO: Connect to Node.js backend via Axios
  };

  return (
    <div className="auth-page">
      <div className="auth-container shadow-lg p-5 rounded">
        <h2 className="fw-bold mb-4 text-center text-warning">User Login</h2>
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

        <p className="text-center mt-3">
          Don’t have an account?{" "}
          <Link to="/register" className="text-warning fw-semibold">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

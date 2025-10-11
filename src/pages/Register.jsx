import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Note: The external import of "./auth.css" has been replaced by an embedded <style> block
// to ensure successful compilation and execution in single-file environments.

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    // Security enforcement: Role is hardcoded to 'user' for public registration.
    role: "user",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const API_BASE_URL = 'http://localhost:5000/api/auth';

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
        // Sending the full formData, where role is fixed as 'user'
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed!");
      }

      setSuccessMessage(data.message || "User registered successfully! Redirecting to login...");

      // Redirect after a slight delay to allow the user to read the success message
      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      console.error("Registration Error:", error);
      // Use error.message for fetch errors, or server message for API errors
      setErrorMessage(error.message || "Server not reachable. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Embedded CSS for styling the auth page, replacing auth.css */}
      <style>{`
        .auth-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f8f9fa; /* Light gray background */
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
          border-color: #ffc107; /* Warning color for focus */
          box-shadow: 0 0 0 0.25rem rgba(255, 193, 7, 0.25);
        }

        .btn-warning {
          background-color: #ffc107;
          border-color: #ffc107;
          color: #212529; /* Dark text on warning button */
        }
        .btn-warning:hover {
          background-color: #ffcd39;
          border-color: #ffc107;
        }

        .text-warning {
          color: #ffc107 !important;
        }
        .text-primary {
          color: #0d6efd !important;
        }
      `}</style>

      <div className="auth-page">
        <div className="auth-container shadow-lg p-5 rounded">
          <h2 className="fw-bold mb-4 text-center text-warning">Create Account</h2>

          {successMessage && (
            <div className="alert alert-success" role="alert">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="alert alert-danger" role="alert">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Username */}
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

            {/* Email */}
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

            {/* Password */}
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
            
            {/* Role selection is omitted to prevent users from setting their own role to 'admin' */}
            <p className="text-muted text-sm my-3 text-center">
                All new public accounts are automatically assigned the **User** role.
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

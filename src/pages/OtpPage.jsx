import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function OtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { otpEmail } = useAuth();

  // ✅ Get email from context, route state, or localStorage
  const storedEmail =
    otpEmail || location.state?.email || localStorage.getItem("otpEmail");
  const email = storedEmail?.trim().toLowerCase();

  // ✅ State
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(60);
  const [resendActive, setResendActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isExpired = timeLeft <= 0;

  // ✅ Redirect if no email
  useEffect(() => {
    if (!email) {
      setErrorMessage("No email found. Please login first.");
      const timer = setTimeout(() => navigate("/login", { replace: true }), 1500);
      return () => clearTimeout(timer);
    } else {
      localStorage.setItem("otpEmail", email);
    }
  }, [email, navigate]);

  // ✅ Countdown timer
  useEffect(() => {
    if (isExpired) {
      setErrorMessage("OTP expired. Please request a new one.");
      setResendActive(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [isExpired, timeLeft]);

  // ✅ Handle OTP input + navigation
  const handleChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setErrorMessage("");

      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      } else if (!value && index > 0) {
        document.getElementById(`otp-${index - 1}`)?.focus();
      }
    }
  };

  // ✅ Submit OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || isExpired) return;

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setErrorMessage("Please enter a 6-digit OTP.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/otp", {
        email,
        otp: otpCode,
      });

      const { token, user, message } = res.data;

      if (!user || !user.role) {
        setErrorMessage("Invalid user data returned. Please try again.");
        setLoading(false);
        return;
      }

      // ✅ Store login data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.removeItem("otpEmail");

      setSuccessMessage(message || "OTP verified successfully!");

      // ✅ Redirect based on role (matching App.js routes)
      const redirectPath =
        user.role === "admin" ? "/admindashboard" : "/userdashboard";

      setTimeout(() => navigate(redirectPath, { replace: true }), 1000);
    } catch (error) {
      console.error("OTP Verification Error:", error);
      setErrorMessage(
        error.response?.data?.message || "OTP verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Resend OTP
  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await axios.post("http://localhost:5000/api/auth/resend-otp", {
        email,
      });
      setSuccessMessage(res.data.message || "OTP resent successfully!");
      setOtp(Array(6).fill(""));
      setTimeLeft(60);
      setResendActive(false);
    } catch (error) {
      console.error("Resend OTP Error:", error);
      setErrorMessage(error.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Auto focus first input on load
  useEffect(() => {
    document.getElementById("otp-0")?.focus();
  }, []);

  return (
    <div className="auth-page d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="auth-container bg-white shadow-lg p-5 rounded-4" style={{ width: "400px" }}>
        <h2 className="fw-bold mb-3 text-center text-primary">🔐 Verify OTP</h2>
        <p className="text-center text-muted mb-4">
          Enter the 6-digit code sent to <strong>{email || "your email"}</strong>
        </p>

        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="text-center">
          <div className="d-flex justify-content-between mb-3">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                maxLength="1"
                className="form-control text-center fs-4 mx-1 border border-primary-subtle"
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                disabled={loading || !email || isExpired}
                style={{ width: "50px", height: "50px" }}
                required
              />
            ))}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold mt-2"
            disabled={loading || otp.join("").length !== 6 || !email || isExpired}
          >
            {loading ? "Verifying..." : "✅ Verify OTP"}
          </button>

          <p className="text-center text-muted mt-3 mb-2">
            {isExpired ? "OTP expired" : `Resend OTP in ${timeLeft}s`}
          </p>

          <button
            type="button"
            className="btn btn-outline-secondary w-100 mt-2"
            onClick={handleResend}
            disabled={!resendActive || loading || !email}
          >
            🔁 Resend OTP
          </button>
        </form>
      </div>
    </div>
  );
}

export default OtpPage;

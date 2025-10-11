import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function OtpPage() {
  const navigate = useNavigate();
<<<<<<< HEAD
  const location = useLocation();

  // Get stored email (from state or localStorage)
  const storedEmail = location.state?.email || localStorage.getItem("otpEmail");
  const email = storedEmail?.trim().toLowerCase();

  const [otp, setOtp] = useState(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(60);
  const [resendActive, setResendActive] = useState(false);

  // Redirect if no email found
  useEffect(() => {
    if (!email) {
      alert("No email found. Please login first.");
      navigate("/login");
    } else {
      localStorage.setItem("otpEmail", email);
    }
  }, [email, navigate]);

  // Countdown for resend
=======
  const { otpEmail, verifyOtp } = useAuth(); // use verifyOtp from context
  const email = otpEmail?.trim().toLowerCase();

  const [otp, setOtp] = useState(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(60);
  const [resendActive, setResendActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Redirect if no email
>>>>>>> 646ec0e (Save current changes before pull)
  useEffect(() => {
    if (!email) {
      setErrorMessage("No email found. Please login first.");
      const timer = setTimeout(() => navigate("/login", { replace: true }), 1500);
      return () => clearTimeout(timer);
    }
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (timeLeft <= 0) {
      setResendActive(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

<<<<<<< HEAD
  // Handle OTP input
=======
>>>>>>> 646ec0e (Save current changes before pull)
  const handleChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
<<<<<<< HEAD
      if (value && index < 5)
        document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  // ✅ Submit OTP
=======
      if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

>>>>>>> 646ec0e (Save current changes before pull)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setErrorMessage("Please enter a 6-digit OTP.");
      setLoading(false);
      return;
    }

    try {
<<<<<<< HEAD
      const res = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email,
        otp: otpCode,
      });

      const { token, user, redirectUrl } = res.data;

      // Store JWT and user info
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.removeItem("otpEmail");

      alert("✅ " + res.data.message);

      // ✅ Navigate dynamically based on backend redirect
      if (redirectUrl) {
        navigate(redirectUrl);
      } else if (user.role === "admin") {
        navigate("/AdminDashboard");
      } else {
        navigate("/UserDashboard");
      }
    } catch (error) {
      alert(error.response?.data?.message || "OTP verification failed!");
    }
  };

  // ✅ Resend OTP
  const handleResend = async () => {
    if (!email) return;
    try {
      await axios.post("http://localhost:5000/api/auth/resend-otp", { email });
      alert("OTP resent successfully!");
=======
      // Use context verifyOtp
      const result = await verifyOtp(email, otpCode);

      if (!result.success) throw new Error(result.message);

      setSuccessMessage("OTP verified! Redirecting...");

    } catch (err) {
      console.error("OTP Error:", err);
      setErrorMessage(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("http://localhost:5000/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend OTP");

      setSuccessMessage(data.message || "OTP resent successfully!");
>>>>>>> 646ec0e (Save current changes before pull)
      setOtp(Array(6).fill(""));
      setTimeLeft(60);
      setResendActive(false);

    } catch (err) {
      console.error("Resend OTP Error:", err);
      setErrorMessage(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="auth-page d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="auth-container bg-white shadow-lg p-5 rounded-4" style={{ width: "400px" }}>
        <h2 className="fw-bold mb-4 text-center text-primary">🔐 Verify OTP</h2>

        <form onSubmit={handleSubmit} className="text-center">
          <div className="d-flex justify-content-between mb-4">
            {otp.map((digit, index) => (
=======
    <div className="auth-page">
      <div className="auth-container shadow-lg p-5 rounded">
        <h2 className="fw-bold mb-4 text-center text-primary">Verify OTP</h2>
        <p className="text-center text-muted mb-4">
          Enter the 6-digit code sent to <strong>{email || "your email"}</strong>
        </p>

        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="text-center">
          <div className="d-flex justify-content-between mb-3">
            {otp.map((digit, idx) => (
>>>>>>> 646ec0e (Save current changes before pull)
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                maxLength="1"
                className="otp-input form-control text-center fs-4 mx-1 border border-primary-subtle"
                value={digit}
<<<<<<< HEAD
                onChange={(e) => handleChange(index, e.target.value)}
                style={{ width: "50px", height: "50px" }}
=======
                onChange={(e) => handleChange(idx, e.target.value)}
                disabled={loading || !email}
                required
>>>>>>> 646ec0e (Save current changes before pull)
              />
            ))}
          </div>

<<<<<<< HEAD
          <p className="mb-3 text-secondary">
            {resendActive ? (
              <span>You can now resend the OTP</span>
            ) : (
              <span>Resend OTP in {timeLeft}s</span>
            )}
          </p>

          <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold mt-2">
            ✅ Verify OTP
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary w-100 mt-3"
=======
          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold mt-2"
            disabled={loading || otp.join("").length !== 6 || !email}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <p className="text-center text-muted mt-3 mb-2">
            {resendActive ? "You can now resend the OTP" : `Resend OTP in ${timeLeft}s`}
          </p>
          <button
            type="button"
            className="btn btn-link mt-0"
>>>>>>> 646ec0e (Save current changes before pull)
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

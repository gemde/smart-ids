import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./auth.css";

function OtpPage() {
  const navigate = useNavigate();
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
  useEffect(() => {
    if (timeLeft === 0) {
      setResendActive(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Handle OTP input
  const handleChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5)
        document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  // ✅ Submit OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      alert("Please enter a 6-digit OTP.");
      return;
    }

    try {
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
      setOtp(Array(6).fill(""));
      setTimeLeft(60);
      setResendActive(false);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="auth-page d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="auth-container bg-white shadow-lg p-5 rounded-4" style={{ width: "400px" }}>
        <h2 className="fw-bold mb-4 text-center text-primary">🔐 Verify OTP</h2>

        <form onSubmit={handleSubmit} className="text-center">
          <div className="d-flex justify-content-between mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                className="otp-input form-control text-center fs-4 mx-1 border border-primary-subtle"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                style={{ width: "50px", height: "50px" }}
              />
            ))}
          </div>

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
            onClick={handleResend}
            disabled={!resendActive}
          >
            🔁 Resend OTP
          </button>
        </form>
      </div>
    </div>
  );
}

export default OtpPage;

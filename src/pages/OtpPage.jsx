import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./auth.css";

function OtpPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch stored email from location.state or localStorage
  const storedEmail = location.state?.email || localStorage.getItem("otpEmail");
  const email = storedEmail?.trim().toLowerCase(); // normalize

  // Redirect if no email found
  useEffect(() => {
    if (!email) {
      alert("No email found. Please login first.");
      navigate("/login");
    } else {
      // Store email in localStorage for persistence
      localStorage.setItem("otpEmail", email);
    }
  }, [email, navigate]);

  const [otp, setOtp] = useState(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(60);
  const [resendActive, setResendActive] = useState(false);

  // Countdown timer for Resend button
  useEffect(() => {
    if (timeLeft === 0) {
      setResendActive(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Handle OTP input change
  const handleChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      // Auto-focus next input
      if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  // Submit OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      alert("Please enter a 6-digit OTP.");
      return;
    }

    try {
      console.log("Sending OTP verification:", { email, otp: otpCode }); // debug
      const res = await axios.post(
        "http://localhost:5000/api/auth/verify-otp",
        { email, otp: otpCode }
      );
      alert(res.data.message);

      // Store JWT token and remove email from localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.removeItem("otpEmail");

      navigate("/AdminDashboard");
    } catch (error) {
      alert(error.response?.data?.message || "OTP verification failed!");
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (!email) return;
    try {
      console.log("Requesting OTP resend for:", email); // debug
      await axios.post("http://localhost:5000/api/auth/resend-otp", { email });
      alert("OTP resent successfully");

      setOtp(Array(6).fill(""));
      setTimeLeft(60);
      setResendActive(false);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container shadow-lg p-5 rounded">
        <h2 className="fw-bold mb-4 text-center text-primary">Verify OTP</h2>
        <form onSubmit={handleSubmit} className="text-center">
          <div className="d-flex justify-content-between mb-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                className="otp-input form-control text-center mx-1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
              />
            ))}
          </div>
          <div className="mb-3">
            <span>
              {resendActive
                ? "You can now resend the OTP"
                : `Resend OTP in ${timeLeft}s`}
            </span>
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold mt-2"
          >
            Verify OTP
          </button>
          <button
            type="button"
            className="btn btn-link mt-2"
            onClick={handleResend}
            disabled={!resendActive}
          >
            Resend OTP
          </button>
        </form>
      </div>
    </div>
  );
}

export default OtpPage;

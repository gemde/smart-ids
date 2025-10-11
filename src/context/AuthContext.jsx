import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const API_BASE_URL = "http://localhost:5000/api/auth";

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [otpEmail, setOtpEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  // Save token & user to state and localStorage
  const saveAuthData = (token, userData) => {
    setToken(token);
    setUser(userData);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // LOGIN → triggers OTP
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setOtpEmail(email); // save email for OTP page
        navigate("/otp", { state: { email } });
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Login failed" };
      }
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, message: "Could not connect to server" };
    }
  };

  // VERIFY OTP → complete login
  const verifyOtp = async (email, otp) => {
    try {
      const res = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (res.ok) {
        // data.user should contain id, username, email, role
        const userData = data.user;
        saveAuthData(data.token, userData);
        setOtpEmail(null);

        // Redirect based on role
        if (userData.role === "admin") navigate("/admindashboard", { replace: true });
        else navigate("/userdashboard", { replace: true });

        return { success: true, message: "Login successful" };
      } else {
        return { success: false, message: data.message || "OTP verification failed" };
      }
    } catch (err) {
      console.error("OTP verify error:", err);
      return { success: false, message: "Could not connect to server" };
    }
  };

  // LOGOUT
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setOtpEmail(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }, [navigate]);

  // REGISTER
  const register = async (username, email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      return res.ok
        ? { success: true, message: data.message }
        : { success: false, message: data.message || "Registration failed" };
    } catch (err) {
      console.error("Register error:", err);
      return { success: false, message: "Could not connect to server" };
    }
  };

  // On mount: restore auth state
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  const contextValue = {
    user,
    token,
    otpEmail,
    setOtpEmail,
    login,
    verifyOtp,
    logout,
    register,
    isAuthenticated: !!token,
    isAdmin: user?.role === "admin",
    loading,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

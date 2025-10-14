import { Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OtpPage from "./pages/OtpPage";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import "./styles/App.css";



function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
          <div className="container">
            <Link className="navbar-brand fw-bold fs-4 text-uppercase" to="/">
              <span className="text-warning">Smart</span>IDS
            </Link>
            <div>
              <Link to="/login" className="btn btn-outline-light me-2 px-4">
                Login
              </Link>
              <Link to="/register" className="btn btn-warning px-4 fw-semibold">
                Register
              </Link>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route
            path="/"
            element={
              <header className="hero-section d-flex align-items-center text-light text-center">
                <div className="container mt-5 pt-5">
                  <h1 className="display-4 fw-bold mb-3 fade-in">
                    Detect. Defend. Secure.
                  </h1>
                  <p className="lead mb-4 fade-in-delay">
                    Advanced Web Threat Monitoring, Intrusion Detection, and
                    Secure File Sharing — powered by SmartIDS.
                  </p>
                  <div className="mt-4">
                    <Link to="/register" className="btn btn-primary btn-lg me-3 px-4">
                      Get Started
                    </Link>
                    <Link to="/login" className="btn btn-outline-light btn-lg px-4">
                      Login
                    </Link>
                  </div>
                </div>
              </header>
            }
          />

          {/* Auth & Dashboards */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/otp" element={<OtpPage />} />
          <Route path="/admindashboard" element={<AdminDashboard />} />
          <Route path="/userdashboard" element={<UserDashboard />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;

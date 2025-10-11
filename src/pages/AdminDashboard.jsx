import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { useAuth } from "/src/context/AuthContext.jsx"; // ✅ useAuth hook
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth(); // ✅ get user & token from hook

  const [users, setUsers] = useState([]);
  const [loginAttempts, setLoginAttempts] = useState([]);
  const [suspicious, setSuspicious] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [loading, setLoading] = useState(true);

  // 🔐 Protect route
  useEffect(() => {
    if (!token || !user || user.role !== "admin") {
      navigate("/login");
    }
  }, [token, user, navigate]);

  // 📡 Fetch dashboard data
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [usersRes, attemptsRes, suspiciousRes] = await Promise.all([
          axios.get("http://localhost:5000/api/admin/users", config),
          axios.get("http://localhost:5000/api/admin/login-attempts", config),
          axios.get("http://localhost:5000/api/admin/suspicious", config),
        ]);

        setUsers(usersRes.data);
        setLoginAttempts(attemptsRes.data);
        setSuspicious(suspiciousRes.data);
      } catch (error) {
        console.error("Error loading admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // 🧠 System health simulation
  useEffect(() => {
    const fetchSystemHealth = () => {
      const health = {
        cpu: (Math.random() * 50 + 20).toFixed(1),
        memory: (Math.random() * 60 + 30).toFixed(1),
        status: "Running",
        timestamp: new Date().toLocaleTimeString(),
      };
      setSystemHealth(health);
    };

    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // 🔔 Socket.IO: Live alerts
  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => console.log("Connected to IDS live alerts:", socket.id));
    socket.on("new_alert", (alert) => setAlerts((prev) => [alert, ...prev]));
    socket.on("disconnect", () => console.log("Socket disconnected"));

    return () => socket.disconnect();
  }, []);

  if (loading) return <div className="loading">Loading Admin Dashboard...</div>;

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <h1>SmartIDS – Admin Panel</h1>
        <div className="admin-controls">
          <span>Welcome, {user?.username}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      {/* Overview */}
      <section className="overview">
        <div className="card"><h3>Users</h3><p>{users.length}</p></div>
        <div className="card"><h3>Login Attempts</h3><p>{loginAttempts.length}</p></div>
        <div className="card"><h3>Suspicious Accounts</h3><p>{suspicious.length}</p></div>
        <div className="card"><h3>Live Alerts</h3><p>{alerts.length}</p></div>
      </section>

      {/* Real-time Intrusion Alerts */}
      <section className="section">
        <h2>Live Intrusion Alerts</h2>
        {alerts.length === 0 ? (
          <p className="muted">No alerts yet</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Severity</th>
                <th>Source IP</th>
                <th>Destination IP</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a, i) => (
                <tr key={i}>
                  <td>{a.type || "Unknown"}</td>
                  <td className={`severity ${a.severity?.toLowerCase() || "medium"}`}>
                    {a.severity || "Medium"}
                  </td>
                  <td>{a.source_ip || "N/A"}</td>
                  <td>{a.destination_ip || "N/A"}</td>
                  <td>{a.timestamp || new Date().toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* System Health */}
      <section className="section">
        <h2>System Health</h2>
        <div className="health-box">
          <p>Status: <strong>{systemHealth.status}</strong></p>
          <p>CPU Usage: <span className="cpu">{systemHealth.cpu}%</span></p>
          <p>Memory Usage: <span className="mem">{systemHealth.memory}%</span></p>
          <p>Last Updated: {systemHealth.timestamp}</p>
        </div>
      </section>

      {/* Registered Users */}
      <section className="section">
        <h2>Registered Users</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Locked Until</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td><td>{u.username}</td><td>{u.email}</td>
                <td>{u.role}</td><td>{u.locked_until || "Active"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Login Attempts */}
      <section className="section">
        <h2>Recent Login Attempts</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Email</th><th>IP Address</th><th>Status</th><th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loginAttempts.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.email}</td>
                <td>{a.ip_address}</td>
                <td className={a.success ? "success" : "failed"}>
                  {a.success ? "✅ Success" : "❌ Failed"}
                </td>
                <td>{a.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Suspicious Logins */}
      <section className="section">
        <h2>Suspicious Login Activity</h2>
        <table>
          <thead>
            <tr><th>Email</th><th>Failed Attempts</th></tr>
          </thead>
          <tbody>
            {suspicious.map((s, i) => (
              <tr key={i}>
                <td>{s.email}</td>
                <td className="danger">{s.failed_attempts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminDashboard;

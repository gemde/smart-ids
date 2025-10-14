import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { useAuth } from "/src/context/AuthContext.jsx";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const [tab, setTab] = useState("overview"); // Tabs: overview, users, loginAttempts, suspicious
  const [users, setUsers] = useState([]);
  const [loginAttempts, setLoginAttempts] = useState([]);
  const [suspicious, setSuspicious] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [loading, setLoading] = useState(true);

  const apiBase = "http://localhost:5000/api";

  // Protect route
  useEffect(() => {
    if (!token || !user?.role || user.role !== "admin") navigate("/login");
  }, [token, user, navigate]);

  // Fetch all admin-related data
  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [usersRes, attemptsRes, suspiciousRes] = await Promise.all([
          axios.get(`${apiBase}/admin/users`, config),
          axios.get(`${apiBase}/admin/login-attempts`, config),
          axios.get(`${apiBase}/admin/suspicious`, config),
        ]);

        setUsers(usersRes.data || []);
        // Normalize login attempts to use 'status'
        setLoginAttempts(
          (attemptsRes.data || []).map(a => ({
            ...a,
            status: a.success ? "Success" : "Failed",
            created_at: a.timestamp,
          }))
        );
        setSuspicious(suspiciousRes.data || []);
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // System Health simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemHealth({
        cpu: (Math.random() * 50 + 20).toFixed(1),
        memory: (Math.random() * 60 + 30).toFixed(1),
        status: "Running",
        timestamp: new Date().toLocaleTimeString(),
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Socket.IO for live alerts
  useEffect(() => {
    const socket = io("http://localhost:5000");
    socket.on("connect", () => console.log("Connected to IDS live alerts:", socket.id));
    socket.on("new_alert", (alert) => setAlerts(prev => [alert, ...prev]));
    return () => socket.disconnect();
  }, []);

  // Admin actions
  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await axios.delete(`${apiBase}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      console.error("Delete user failed:", err);
    }
  };

  const blockUser = async (userId, minutes) => {
    try {
      await axios.put(
        `${apiBase}/admin/users/block/${userId}`,
        { minutes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(users.map(u =>
        u.id === userId
          ? { ...u, locked_until: new Date(Date.now() + minutes * 60000).toISOString() }
          : u
      ));
    } catch (err) {
      console.error("Block user failed:", err);
    }
  };

  if (loading) return <div>Loading Admin Dashboard...</div>;

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>SmartIDS – Admin Panel</h1>
        <div className="tab-buttons">
          <button onClick={() => setTab("overview")}>Overview</button>
          <button onClick={() => setTab("users")}>Users</button>
          <button onClick={() => setTab("loginAttempts")}>Login Attempts</button>
          <button onClick={() => setTab("suspicious")}>Suspicious Accounts</button>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      {/* -------- Overview -------- */}
      {tab === "overview" && (
        <>
          <section className="overview">
            <div className="card"><h3>Users</h3><p>{users.length}</p></div>
            <div className="card"><h3>Login Attempts</h3><p>{loginAttempts.length}</p></div>
            <div className="card"><h3>Suspicious Accounts</h3><p>{suspicious.length}</p></div>
            <div className="card"><h3>Live Alerts</h3><p>{alerts.length}</p></div>
          </section>
          <section>
            <h2>System Health</h2>
            <div>Status: {systemHealth.status}, CPU: {systemHealth.cpu}%, Memory: {systemHealth.memory}%</div>
          </section>
        </>
      )}

      {/* -------- Users Table -------- */}
      {tab === "users" && (
        <section>
          <h2>Registered Users</h2>
          <table>
            <thead>
              <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Locked Until</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.locked_until || "Active"}</td>
                  <td>
                    <button onClick={() => deleteUser(u.id)}>Delete</button>
                    <button onClick={() => blockUser(u.id, 30)}>Block 30min</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* -------- Login Attempts Table -------- */}
      {tab === "loginAttempts" && (
        <section>
          <h2>Recent Login Attempts</h2>
          <table>
            <thead>
              <tr><th>ID</th><th>Email</th><th>IP Address</th><th>Status</th><th>Time</th></tr>
            </thead>
            <tbody>
              {loginAttempts.map(a => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.email}</td>
                  <td>{a.ip_address}</td>
                  <td>{a.status}</td>
                  <td>{new Date(a.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* -------- Suspicious Accounts Table -------- */}
      {tab === "suspicious" && (
        <section>
          <h2>Suspicious Accounts (≥3 Failed Attempts)</h2>
          <table>
            <thead>
              <tr><th>Email</th><th>Failed Attempts</th></tr>
            </thead>
            <tbody>
              {suspicious.map(s => (
                <tr key={s.email}>
                  <td>{s.email}</td>
                  <td>{s.failed_attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
};

export default AdminDashboard;

import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AdminDashboard.css"; // custom styles

const socket = io("http://localhost:5000"); // server URL

function AdminDashboard() {
  const [attempts, setAttempts] = useState([]);
  const [newAttemptCount, setNewAttemptCount] = useState(0);

  useEffect(() => {
    // Fetch initial login attempts
    const fetchAttempts = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/admin/login-attempts"
        );
        setAttempts(res.data);
      } catch (err) {
        console.error("Failed to fetch login attempts:", err);
      }
    };
    fetchAttempts();

    // Listen to new login attempts via socket
    socket.on("login_attempt", (attempt) => {
      setAttempts((prev) => [attempt, ...prev]);
      setNewAttemptCount((count) => count + 1);
    });

    return () => socket.off("login_attempt");
  }, []);

  const handleResetNewCount = () => setNewAttemptCount(0);

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark">Real-time Login Attempts</h2>
        {newAttemptCount > 0 && (
          <button
            className="btn btn-danger rounded-pill animate__animated animate__pulse"
            onClick={handleResetNewCount}
          >
            {newAttemptCount} New
          </button>
        )}
      </div>

      <div className="table-responsive shadow-sm rounded bg-white">
        <table className="table table-hover table-striped align-middle mb-0">
          <thead className="table-dark">
            <tr>
              <th>Email</th>
              <th>IP Address</th>
              <th>Success</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a, i) => (
              <tr key={i} className={a.success ? "" : "table-danger"}>
                <td>{a.email}</td>
                <td>{a.ip_address}</td>
                <td className={a.success ? "text-success fw-bold" : "text-danger fw-bold"}>
                  {a.success ? "Yes" : "No"}
                </td>
                <td>{new Date(a.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;

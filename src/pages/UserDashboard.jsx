import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/UserDashboard.css";
import "bootstrap/dist/css/bootstrap.min.css";

function UserDashboard() {
  const token = localStorage.getItem("token");
  const [user, setUser] = useState({ username: "User", id: null });
  const [files, setFiles] = useState([]);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shareInfo, setShareInfo] = useState(null);

  // Password vault states
  const [service, setService] = useState("");
  const [password, setPassword] = useState("");
  const [encryptedPasswords, setEncryptedPasswords] = useState([]);
  const [decryptInputs, setDecryptInputs] = useState({});
  const [decryptedResults, setDecryptedResults] = useState({});

  const apiBase = "http://localhost:5000/api";

  // Fetch user info and files
  useEffect(() => {
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({ username: payload.username || payload.email, id: payload.id });
    } catch {
      console.warn("Failed to decode JWT");
    }

    const fetchUserFiles = async () => {
      try {
        const res = await axios.get(`${apiBase}/files/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFiles(Array.isArray(res.data) ? res.data : res.data.files || []);
      } catch {
        setFiles([]);
      }
    };

    fetchUserFiles();
    fetchPasswords();
  }, [token]);

  // Fetch encrypted passwords
  const fetchPasswords = async () => {
    if (!user.id) return;
    try {
      const res = await axios.get(`${apiBase}/vault/list/${user.id}`);
      setEncryptedPasswords(res.data);
    } catch (err) {
      console.error("Failed to fetch passwords", err);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // File upload
  const handleFileChange = (e) => setFileToUpload(e.target.files[0]);

  const uploadFile = async (e) => {
    e.preventDefault();
    if (!fileToUpload) return alert("Please choose a file to upload.");

    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", fileToUpload);

      const res = await axios.post(`${apiBase}/files/upload`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert(res.data.message || "File uploaded successfully!");
      const list = await axios.get(`${apiBase}/files/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(Array.isArray(list.data) ? list.data : list.data.files || []);
      setFileToUpload(null);
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed!");
    } finally {
      setLoading(false);
    }
  };

  // Create share link
  const createShare = async (fileId) => {
    const minutes = prompt("Enter share expiry time (in minutes):", "60");
    if (!minutes) return;
    try {
      const res = await axios.post(
        `${apiBase}/files/share`,
        { fileId, expiresInMinutes: parseInt(minutes, 10) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShareInfo(res.data);
    } catch {
      alert("Failed to create share link");
    }
  };

  // Save password
  const savePassword = async () => {
    if (!service.trim() || !password.trim()) {
      return alert("Enter both service and password!");
    }
    try {
      const res = await axios.post(`${apiBase}/vault/save`, {
        user_id: user.id,
        service,
        password,
      });

      alert(`Password saved! Keep this key safe: ${res.data.key}`);
      setService("");
      setPassword("");
      fetchPasswords();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save password");
    }
  };

  // Decrypt password
  const handleDecrypt = async (entry) => {
    const providedKey = decryptInputs[entry.id];
    if (!providedKey?.trim()) return alert("Enter your decryption key!");

    try {
      const res = await axios.post(`${apiBase}/vault/decrypt`, {
        id: entry.id,
        key: providedKey,
      });

      setDecryptedResults((prev) => ({
        ...prev,
        [entry.id]: res.data.decrypted,
      }));
    } catch (err) {
      const msg = err.response?.data?.message || "Decryption failed!";
      setDecryptedResults((prev) => ({ ...prev, [entry.id]: msg }));
    }
  };

  return (
    <div className="user-dashboard container-fluid py-5 fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <h2 className="dashboard-title">
          Welcome, <span className="username">{user.username}</span>
        </h2>
        <div>
          <button
            className="btn btn-gradient me-3"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Upload & Vault */}
      <div className="row g-4">
        {/* File Upload Card */}
        <div className="col-lg-6">
          <section className="card shadow-soft border-0 h-100">
            <div className="card-body">
              <h5 className="card-title text-primary mb-3">
                🔐 Upload & Encrypt Files
              </h5>
              <form
                onSubmit={uploadFile}
                className="d-flex flex-wrap gap-3 align-items-center"
              >
                <input
                  type="file"
                  className="form-control"
                  onChange={handleFileChange}
                />
                <button
                  className="btn btn-gradient"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Encrypting..." : "Upload"}
                </button>
              </form>
              <small className="text-muted mt-2 d-block">
                Files are encrypted with AES + HMAC for extra protection.
              </small>
            </div>
          </section>
        </div>

        {/* Password Vault */}
        <div className="col-lg-6">
          <section className="card shadow-soft border-0 h-100">
            <div className="card-body">
              <h5 className="card-title text-success mb-3">
                🧩 Secure Password Vault
              </h5>
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Service (e.g., Gmail, AWS)"
                value={service}
                onChange={(e) => setService(e.target.value)}
              />
              <input
                type="password"
                className="form-control mb-3"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button className="btn btn-success w-100" onClick={savePassword}>
                Save Password
              </button>

              <hr />
              <h6 className="text-muted mt-3">🔒 Saved Encrypted Passwords</h6>
              <div className="vault-list mt-3">
                {encryptedPasswords.length === 0 && (
                  <p className="text-center text-muted small">
                    No passwords saved yet.
                  </p>
                )}
                {encryptedPasswords.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 mb-3 rounded shadow-sm border bg-light"
                  >
                    <strong>{p.service}</strong>
                    <div className="small text-break">{p.data}</div>
                    <input
                      type="text"
                      placeholder="Enter key to decrypt"
                      className="form-control form-control-sm mt-2 mb-2"
                      value={decryptInputs[p.id] || ""}
                      onChange={(e) =>
                        setDecryptInputs({
                          ...decryptInputs,
                          [p.id]: e.target.value,
                        })
                      }
                    />
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handleDecrypt(p)}
                    >
                      Decrypt
                    </button>
                    {decryptedResults[p.id] && (
                      <div className="alert alert-info mt-2 p-2 small">
                        <strong>Decrypted:</strong> {decryptedResults[p.id]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Share Info */}
      {shareInfo && (
        <div className="alert alert-success shadow-soft fade-in mt-4">
          <strong>Share link created:</strong>{" "}
          <a href={shareInfo.url} target="_blank" rel="noreferrer">
            {shareInfo.url}
          </a>
          <div>Expires: {new Date(shareInfo.expiresAt).toLocaleString()}</div>
        </div>
      )}

      {/* Files Table */}
      <section className="card shadow-soft border-0 fade-in mt-5">
        <div className="card-body table-container">
          <h5 className="card-title text-primary mb-3">📁 Your Files</h5>
          <table className="table table-hover align-middle table-gradient">
            <thead>
              <tr>
                <th>File</th>
                <th>Uploaded</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(files) && files.length > 0 ? (
                files.map((f) => (
                  <tr key={f.id}>
                    <td>{f.filename_original || f.filename}</td>
                    <td>{new Date(f.created_at).toLocaleString()}</td>
                    <td>
                      {f.expires_at
                        ? new Date(f.expires_at).toLocaleString()
                        : "Never"}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-success me-2"
                        onClick={() => createShare(f.id)}
                      >
                        Share
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-4">
                    No files uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default UserDashboard;

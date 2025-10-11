import React, { useEffect, useState } from "react";
import axios from "axios";
import "./UserDashboard.css";
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

    // Decode token to get user info
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({ username: payload.username || payload.email, id: payload.id });
    } catch {
      console.warn("Failed to decode JWT");
    }

    // Fetch files
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

  // Fetch encrypted passwords from backend
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

  // File upload handlers
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

  // Create file share
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

  // Save password via backend
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
      fetchPasswords(); // refresh list
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save password");
    }
  };

  // Decrypt password via backend
  const handleDecrypt = async (entry) => {
    const providedKey = decryptInputs[entry.id];
    if (!providedKey?.trim()) return alert("Enter your decryption key!");

    try {
      const res = await axios.post(`${apiBase}/vault/decrypt`, {
        id: entry.id,
        key: providedKey,
      });

      setDecryptedResults((prev) => ({ ...prev, [entry.id]: res.data.decrypted }));
    } catch (err) {
      const msg = err.response?.data?.message || "Decryption failed!";
      setDecryptedResults((prev) => ({ ...prev, [entry.id]: msg }));
    }
  };

  return (
    <div className="user-dashboard container py-5">
      {/* Header */}
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold">
          Welcome, <span className="username">{user.username}</span>
        </h3>
        <div>
          <button className="btn btn-outline-primary me-2" onClick={() => window.location.reload()}>
            Refresh
          </button>
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="row g-4">
        {/* File Upload Card */}
        <div className="col-md-6">
          <section className="card shadow-lg border-0 h-100">
            <div className="card-body">
              <h5 className="card-title text-primary">🔐 Upload & Encrypt Files</h5>
              <form onSubmit={uploadFile} className="d-flex flex-wrap gap-3 align-items-center">
                <input type="file" className="form-control" onChange={handleFileChange} />
                <button className="btn btn-gradient" type="submit" disabled={loading}>
                  {loading ? "Encrypting..." : "Upload"}
                </button>
              </form>
              <small className="text-muted d-block mt-2">Files are encrypted using AES + HMAC.</small>
            </div>
          </section>
        </div>

        {/* Password Vault */}
        <div className="col-md-6">
          <section className="card shadow-lg border-0 h-100">
            <div className="card-body">
              <h5 className="card-title text-success">🧩 Secure Password Vault</h5>
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
              <ul className="list-group list-group-flush mt-2">
                {encryptedPasswords.length === 0 && (
                  <li className="list-group-item text-muted text-center">No passwords saved yet.</li>
                )}
                {encryptedPasswords.map((p) => (
                  <li key={p.id} className="list-group-item">
                    <strong>{p.service}</strong>
                    <div className="text-break small">{p.data}</div>

                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Enter key to decrypt"
                        className="form-control form-control-sm mb-2"
                        value={decryptInputs[p.id] || ""}
                        onChange={(e) =>
                          setDecryptInputs({ ...decryptInputs, [p.id]: e.target.value })
                        }
                      />
                      <button className="btn btn-sm btn-outline-success" onClick={() => handleDecrypt(p)}>
                        Decrypt
                      </button>

                      {decryptedResults[p.id] && (
                        <div className="mt-2 alert alert-info p-2 small">
                          <strong>Decrypted Password:</strong> {decryptedResults[p.id]}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>

      {/* Share Info */}
      {shareInfo && (
        <div className="alert alert-success shadow-sm fade-in mt-4">
          <strong>Share link created:</strong>{" "}
          <a href={shareInfo.url} target="_blank" rel="noreferrer">
            {shareInfo.url}
          </a>
          <div>Expires: {new Date(shareInfo.expiresAt).toLocaleString()}</div>
        </div>
      )}

      {/* Files Table */}
      <section className="card shadow-lg border-0 fade-in mt-4">
        <div className="card-body">
          <h5 className="card-title text-primary">Your Files</h5>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-gradient text-white">
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
                      <td>{f.expires_at ? new Date(f.expires_at).toLocaleString() : "Never"}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-success me-2" onClick={() => createShare(f.id)}>
                          Share
                        </button>
                       
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-muted text-center">
                      No files uploaded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default UserDashboard;

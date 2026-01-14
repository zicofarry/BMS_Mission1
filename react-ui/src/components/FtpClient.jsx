import React, { useState } from "react";
import "./FtpClient.css";

export default function FtpClient() {
  const [ftpConfig, setFtpConfig] = useState({
    host: "ftp://192.168.30.100",
    port: 21,
    user: "hariff",
    password: "rnddefense2014ajah",
    dbname: "DEFAULT.db",
  });
  const [message, setMessage] = useState("");

  return (
    <div className="ftp-container">
      <h2 className="ftp-title">FTP Client</h2>

      <div className="ftp-group">
        <label>Host:</label>
        <input
          className="ftp-input"
          value={ftpConfig.host}
          onChange={(e) => setFtpConfig({ ...ftpConfig, host: e.target.value })}
        />
      </div>

      <div className="ftp-group">
        <label>Port:</label>
        <input
          type="number"
          className="ftp-input"
          value={ftpConfig.port}
          onChange={(e) => setFtpConfig({ ...ftpConfig, port: parseInt(e.target.value) })}
        />
      </div>

      <div className="ftp-group">
        <label>User:</label>
        <input
          className="ftp-input"
          value={ftpConfig.user}
          onChange={(e) => setFtpConfig({ ...ftpConfig, user: e.target.value })}
        />
      </div>

      <div className="ftp-group">
        <label>Password:</label>
        <input
          type="password"
          className="ftp-input"
          value={ftpConfig.password}
          onChange={(e) =>
            setFtpConfig({ ...ftpConfig, password: e.target.value })
          }
        />
      </div>

      <div className="ftp-group">
        <label>Pilih Database:</label>
        <select
          className="ftp-select"
          value={ftpConfig.dbname}
          onChange={(e) =>
            setFtpConfig({ ...ftpConfig, dbname: e.target.value })
          }
        >
          <option value="">--Pilih--</option>
          <option value="posko.db">posko.db</option>
          <option value="uk.db">uk.db</option>
          <option value="gw.db">gw.db</option>
        </select>
      </div>

      <button
        className="ftp-button"
        onClick={async () => {
          const res = await fetch("http://localhost:3001/upload-ftp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ftpConfig),
          });
          const data = await res.json();
          setMessage(data.message || data.error);
        }}
      >
        Upload
      </button>

      {message && <p className="ftp-message">{message}</p>}
    </div>
  );
}

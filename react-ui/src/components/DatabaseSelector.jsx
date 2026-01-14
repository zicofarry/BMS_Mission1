import React, { useState, useEffect } from "react";

export default function DatabaseSelector({ onTableClick, onToggleEdit, editMode }) {
  const [selectedDb, setSelectedDb] = useState("source.db");
  const [tables, setTables] = useState([]);

  const databases = ["source.db","posko.db", "uk.db", "gw.db"];

  useEffect(() => {
    if (selectedDb) {
      fetch(`http://localhost:3001/tables/${selectedDb}`)
        .then(res => res.json())
        .then(data => setTables(data))
        .catch(err => console.error(err));
    }
  }, [selectedDb]);

  return (
    <div>
      <h3>Pilih Menu</h3>
      <button
        style={{ marginLeft: "10px", backgroundColor: "#0a74da", color: "white" }}
        onClick={() => onTableClick(selectedDb, "FTP")}
      >
        FTP Client
      </button>
	  <br/>
      <button
        style={{ marginLeft: "10px", backgroundColor: "#0a74da", color: "white" }}
        onClick={() => onTableClick(selectedDb, "UK")}
      >
        UK Tables
      </button>
      <br/>
      <button
        style={{ marginLeft: "10px", backgroundColor: "#0a74da", color: "white" }}
        onClick={() => onTableClick(selectedDb, "GW")}
      >
        GW Tables
      </button>
      <button
        style={{ marginLeft: "10px", backgroundColor: "#0a74da", color: "white" }}
        onClick={() => onTableClick(selectedDb, "Ajax")}
      >
        Ajax
      </button>
      <br/>
      <h3>Pilih Database</h3>
      <select onChange={(e) => setSelectedDb(e.target.value)} value={selectedDb}>
        <option value="">--Pilih Database--</option>
        {databases.map((db) => (
          <option key={db} value={db}>{db}</option>
        ))}
      </select>

      <button style={{ marginTop: "10px" }} onClick={onToggleEdit}>
        {editMode ? "Selesai Edit" : "Edit Mode"}
      </button>


      <h4 style={{ marginTop: "20px" }}>Tabel:</h4>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {tables.map((t) => (
          <li key={t}>
            <button
              style={{ width: "100%", margin: "4px 0" }}
              onClick={() => onTableClick(selectedDb, t)}
            >
              {t}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
/*
import React, { useState, useEffect } from "react";

export default function DatabaseSelector({ onTableClick, onToggleEdit, editMode }) {
  const [selectedDb, setSelectedDb] = useState("");
  const [tables, setTables] = useState([]);

  useEffect(() => {
    if (selectedDb) {
      fetch(`http://localhost:3001/tables/${selectedDb}`)
        .then((res) => res.json())
        .then((data) => setTables(data))
        .catch((err) => console.error(err));
    }
  }, [selectedDb]);

  return (
    <div>
      <h2>Pilih Database</h2>
      <select
        value={selectedDb}
        onChange={(e) => setSelectedDb(e.target.value)}
        style={{ padding: "6px", width: "100%", marginBottom: "12px" }}
      >
        <option value="">-- pilih database --</option>
        <option value="posko">posko.db</option>
        <option value="uk">uk.db</option>
        <option value="gw">gw.db</option>
      </select>

      <button
        onClick={onToggleEdit}
        style={{
          display: "block",
          marginBottom: "12px",
          padding: "6px",
          background: editMode ? "#dc2626" : "#10b981",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        {editMode ? "Keluar Edit Mode" : "Masuk Edit Mode"}
      </button>

      {selectedDb && (
        <div>
          <h3>Tabel:</h3>
          <ul>
            {tables.map((t, i) => (
              <li
                key={i}
                style={{ cursor: "pointer", color: "blue", marginBottom: "4px" }}
                onClick={() => onTableClick(selectedDb, t)}
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ marginTop: "20px" }}>
        <button onClick={() => onTableClick("FTP", "FTP")}>Kirim FTP</button>
      </div>

    </div>
  );
}
*/

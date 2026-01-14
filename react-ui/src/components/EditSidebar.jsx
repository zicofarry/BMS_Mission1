import React, { useState } from "react";
import SystemInfo from "./SystemInfo.jsx";
let port=4000
export default function Sidebar({ tables, onSelect, onChange }) {
  const [name, setName] = useState("");
  const [columns, setColumns] = useState("id INTEGER PRIMARY KEY, name TEXT");

  const createTable = () => {
    fetch("http://localhost:4000/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, columns })
    }).then(() => { setName(""); onChange(); });
  };

  const deleteTable = (t) => {
    if (!window.confirm("Hapus tabel " + t + "?")) return;
    fetch("http://localhost:${port}/api/tables/" + t, { method: "DELETE" }).then(onChange);
  };

  const systemInfo = (t) => {
//    if (!window.confirm("Hapus tabel " + t + "?")) return;
    return <SystemInfo/>
  };
  
  return (
    <div className="sidebar">
      <h3>Tabel</h3>
      <ul>
        {tables.map(t => (
          <li key={t}>
            <button onClick={() => onSelect(t)}>{t}</button>
            <button onClick={() => deleteTable(t)}>x</button>
          </li>
        ))}
      </ul>
      <h4>Tambah Tabel</h4>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="nama" />
      <input value={columns} onChange={e => setColumns(e.target.value)} />
      <button onClick={createTable}>Buat</button>
      <button onClick={systemInfo}>System Info</button>
      
    </div>
  );
}

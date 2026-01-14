import React, { useState,useEffect } from "react";
import SelectTable from "./SelectTable.jsx";

let port=4000

export default function Sidebar({ tables, onSelect, onChange }) {
  const [name, setName] = useState("");
  const [current, setCurrent] = useState(null);
/*
  useEffect(() => {
    fetch("http://localhost:4000/api/tables")
      .then(r => r.json())
      .then(setTables);
  }, [current]);
*/  
  return (
    <div className="sidebar">
      <SelectTable onChange={setName}/>
      <h3>Tabel</h3>
      <ul>
        {tables.map(t => (
          <li key={t}>
            <button onClick={() => onSelect(t)}>{t}</button>
          </li>
        ))}
      </ul>
      
    </div>
  );
}

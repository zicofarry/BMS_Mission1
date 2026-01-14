import React, { useState, useEffect } from "react";
import RowForm from "./RowForm.jsx";
let port=4000
export default function TableViewer({ table }) {
  const [data, setData] = useState({ columns: [], pk: "id", rows: [] });

  const load = () => {
    fetch(`http://localhost:${port}/api/table/${table}`)
      .then(r => r.json())
      .then(setData);
  };

  const loadPrev = () => {
    fetch(`http://localhost:${port}/api/table/${table}`)
      .then(r => r.json())
      .then(setData);
  };
  const loadNext = () => {
    fetch(`http://localhost:${port}/api/table/${table}`)
      .then(r => r.json())
      .then(setData);
  };

  useEffect(() => { load(); }, [table]);

  return (
    <div className="table-viewer">
      <h3>{table}</h3>
      <table>
        <thead>
          <tr>
            {data.columns.map(c => <th key={c.name}>{c.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i}>
              {data.columns.map(c => (
                <td key={c.name}>{row[c.name]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <br/>
	  <div style={{ display: "flex", gap: "10px" }}>
      <button style={{padding: "5px"}} onClick={loadPrev}>Sebelumnya</button>
      <button style={{padding: "5px"}} onClick={loadNext}>Berikutnya</button>
      <button style={{padding: "5px"}} >Ubah</button>
      <button style={{padding: "5px"}} onClick={load}>Kembali</button>
      </div>
    </div>
  );
}

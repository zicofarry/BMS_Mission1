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

  const del = (id) => {
    fetch(`http://localhost:${port}/api/table/${table}/row/${id}`, { method: "DELETE" })
      .then(load);
  };

  const save = (id, row) => {
    fetch(`http://localhost:${port}/api/table/${table}/row/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row)
    }).then(load);
  };

  return (
    <div className="table-viewer">
      <h3>{table}</h3>
      <table>
        <thead>
          <tr>
            {data.columns.map(c => <th key={c.name}>{c.name}</th>)}
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i}>
              {data.columns.map(c => (
                <td key={c.name}>
                  <input defaultValue={row[c.name]} 
                    onBlur={e => save(row[data.pk], { ...row, [c.name]: e.target.value })} 
                  className="input-cell"
                  />
                </td>
              ))}
              <td><button style={{width:"40px"}} onClick={() => del(row[data.pk])}>-</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <br/>
      <RowForm table={table} columns={data.columns} onDone={load} />
	  <div style={{ display: "flex", gap: "10px" }}>
      <button style={{padding: "5px"}} onClick={loadPrev}>Sebelumnya</button>
      <button style={{padding: "5px"}} onClick={loadNext}>Berikutnya</button>
      <button style={{padding: "5px"}} onClick={save}>Ubah</button>
      <button style={{padding: "5px"}} onClick={load}>Kembali</button>
      </div>
    </div>
  );
}

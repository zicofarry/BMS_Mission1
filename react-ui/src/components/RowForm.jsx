import React, { useState } from "react";
let port=4000
export default function RowForm({ table, columns, onDone }) {
  const [form, setForm] = useState({});

  const submit = () => {
    fetch(`http://localhost:{port}/api/table/${table}/row`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    }).then(onDone);
  };

  return (
    <div className="row-form">
      {columns.map(c => (
        <input key={c.name} placeholder={c.name}
          onChange={e => setForm({ ...form, [c.name]: e.target.value })} />
      ))}
      <button style={{width:"40px"}} onClick={submit}>+</button>
    </div>
  );
}

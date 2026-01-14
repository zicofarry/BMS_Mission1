import { useState } from "react";

export default function SystemInfo() {
  const [form, setForm] = useState({
    no: "",
    id: "",
    nama: "",
    jenis: "",
    versi: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Data Form:", form);
    alert(`Data berhasil disubmit:\n${JSON.stringify(form, null, 2)}`);
    setForm({ no: "", id: "", nama: "", jenis: "", versi: "" });
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h2>Form System Info</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
        <div>
          <label>No:</label>
          <input
            type="text"
            name="no"
            value={form.no}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>ID:</label>
          <input
            type="text"
            name="id"
            value={form.id}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Nama:</label>
          <input
            type="text"
            name="nama"
            value={form.nama}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Jenis:</label>
          <input
            type="text"
            name="jenis"
            value={form.jenis}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Versi:</label>
          <input
            type="text"
            name="versi"
            value={form.versi}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <button type="submit" style={{ padding: "10px", background: "#4caf50", color: "white", border: "none" }}>
          Submit
        </button>
      </form>
    </div>
  );
}

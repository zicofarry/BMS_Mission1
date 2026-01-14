import React, { useState, useEffect, useRef } from "react";

// konfigurasi kolom
const IT = [
  ["10%", "NO", "NO", "button", "", ""],
  ["20%", "BMS", "ID", "text", "changeRow", ""],
  ["30%", "RANPUR", "NAMA", "text", "changeRow", ""],
  ["30%", "TYPE", "TYPE", "text", "changeRow", ""],
  ["10%", "ACTIVE", "ACTIVE", "text", "changeRow", ""],
];

export default function DynamicTable() {
  const [rows, setRows] = useState([]);
  const loaded = useRef(false);
  const [page,setPage] = useState(1);
  const [perPage,setPerPage] = useState(10);

  // ================================
  //  LOAD DATA DARI BACKEND SEKALI
  // ================================
    const loadData = async () => {
      const res = await fetch("http://localhost:3001/dataPage/uk.db/node/1/10");
      const json = await res.json();

      // Jika kosong, buat 1 row default
      if (!Array.isArray(json) || json.length === 0) {
        setRows([{ no: 1, bms: "", ranpur: "", type: "", active: "" }]);
      } else {
        setRows(json);
      }
    };

  useEffect(() => {
    if (loaded.current) return;
    loadData();
    loaded.current = true;
  }, []);

  // ================================
  //  UPDATE PER CELL
  // ================================
  const updateCell = (rowIndex, field, value) => {
    setRows((prev) => {
      const r = [...prev];
      r[rowIndex][field] = value;
      return r;
    });
  };

  // ================================
  //  TAMBAH BARIS
  // ================================
  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        no: prev.length + 1,
        bms: "",
        ranpur: "",
        type: "",
        active: "",
      },
    ]);
  };

  // ================================
  //  HAPUS BARIS
  // ================================
  const deleteRow = (index) => {
    setRows((prev) => {
      const filtered = prev.filter((_, i) => i !== index);

      // renumber
      return filtered.map((r, i) => ({ ...r, no: i + 1 }));
    });
  };

  // ================================
  //  SIMPAN KE DATABASE (AJAX)
  // ================================
  const saveData = async () => {
    const res = await fetch("http://localhost:3001/api/save/node", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    });

    const json = await res.json();
    alert("Saved: " + JSON.stringify(json));
  };
  // ======================================================
  //               PAGINATION (AJAX, bukan slicing)
  // ======================================================
  const getPrev = () => {
    if (page > 1) fetchData(page - 1);
  };

  const getNext = () => {
    loadData(page + 1);
  };
  return (
    <div style={{ padding: 20 }}>
      <h2>Dynamic Table - IT[] Config</h2>

      <table border="1" cellPadding={4} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {IT.map((col, i) => (
              <th key={i}>{col[2]}</th>
            ))}
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {IT.map(([width, field, label, type], colIndex) => (
                <td key={colIndex} style={{ width, textAlign: "center" }}>
                  {type === "button" ? (
                    <b>{row.NO}</b>
                  ) : (
                    <input
                      style={{ width: "95%", border: 0 }}
                      type="text"
                      value={row[field] || ""}
                      onChange={(e) =>
                        updateCell(rowIndex, field, e.target.value)
                      }
                    />
                  )}
                </td>
              ))}

              <td>
                <button
                  style={{ background: "red", color: "white" }}
                  onClick={() => deleteRow(rowIndex)}
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />

      <button onClick={addRow}>+ Tambah Baris</button>
      <button onClick={saveData} style={{ marginLeft: 10, color: "green" }}>
        Simpan Database
      </button>
        <button  onClick={getPrev}>
          Prev
        </button>
        Halaman {page} dari {perPage}
        <button  onClick={getNext}>
          Next
        </button>

      <pre style={{ marginTop: 20, padding: 10, background: "#f0f0f0" }}>
        {JSON.stringify(rows, null, 2)}
      </pre>
    </div>
  );
}

import React, { useEffect, useState } from "react";

export default function TableContent({ dbname, table, editMode }) {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [newRow, setNewRow] = useState({});
  const [primaryKey, setPrimaryKey] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [editTable, setEditTable] = useState(false);

  // 🔹 Fetch data + primary key
  useEffect(() => {
    if (!dbname || !table) return;

    const fetchData = async () => {
      const [dataRes, pkRes] = await Promise.all([
        fetch(`http://localhost:3001/data/${dbname}/${table}`),
        fetch(`http://localhost:3001/primarykey/${dbname}/${table}`),
      ]);

      const data = await dataRes.json();
      const pkData = await pkRes.json();
console.log(data)
      setRows(Array.isArray(data) ? data : []);
      setColumns(data.length ? Object.keys(data[0]) : []);
      setPrimaryKey(pkData.primaryKey || "id");
      if (data.length > 0) {
        const last = data[data.length - 1];
        const copy = { ...last };
        delete copy[pkData.primaryKey || "id"];
        setNewRow(copy);
      }
    };

    fetchData();
  }, [dbname, table]);

  // 🔍 Filter dan pagination
  const filtered = rows.filter((r) =>
    Object.values(r).some((v) =>
      String(v).toLowerCase().includes(search.toLowerCase())
    )
  );
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  // 🧩 CRUD handlers
  const handleAdd = async () => {
    await fetch(`http://localhost:3001/data/${dbname}/${table}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRow),
    }).then(() =>
      fetch(`http://localhost:3001/data/${dbname}/${table}`)
        .then((res) => res.json())
        .then((data) => setRows(data))
    );
  };

  const handleUpdate = async (row) => {
    const pk = row[primaryKey];
    await fetch(`http://localhost:3001/data/${dbname}/${table}/${pk}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
  };

  const handleDelete = async (row) => {
    const pk = row[primaryKey];
    await fetch(`http://localhost:3001/data/${dbname}/${table}/${pk}`, {
      method: "DELETE",
    });
  };

  const onToggleEditTable = () => {
    setEditTable(!editTable);
  };

  return (
    <div style={{ padding: "10px" }}>
      <h3>
        {table} <small>({dbname})</small>
      </h3>
      {primaryKey && <p>Primary key: <b>{primaryKey}</b></p>}

      <input
        placeholder="Cari..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "10px", width: "40%", padding: "4px" }}
      />

      <table border="1" cellPadding={editMode ? "0" : "1"}
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #ccc",
        }}
      >
        <thead style={{ background: "#eee" }}>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
            {editMode && <th>Aksi_DDD</th>}
          </tr>
        </thead>
        <tbody>
          {paginated.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td key={col}>
                  {editMode ? (
                    <input
                      value={row[col] ?? ""}
                      onChange={(e) => {
                        const updated = [...rows];
                        updated[(page - 1) * perPage + i][col] =
                          e.target.value;
                        setRows(updated);
                      }}
                      style={{
                        border:0,
                        width: "90%",
                        padding: 0,
                      }}
                      
                    />
                  ) : (
                    row[col]
                  )}
                </td>
              ))}
              {editMode && (
                <td>
                  <button onClick={() => handleUpdate(row)}>💾</button>
                  <button onClick={() => handleDelete(row)}>❌</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>
        Halaman {page} dari {totalPages}
        <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
          Next
        </button>
        <button onClick={onToggleEditTable}>
          {editMode ? "Simpan" : "Ubah"}
        </button>
      </div>

      {editMode && (
        <div style={{ marginTop: "20px" }}>
          {columns
            .filter((col) => col !== primaryKey)
            .map((col) => (
              <input
                key={col}
                placeholder={col}
                value={newRow[col] || ""}
                onChange={(e) =>
                  setNewRow({ ...newRow, [col]: e.target.value })
                }
              />
            ))}
          <button onClick={handleAdd}>Tambah</button>
        </div>
      )}
    </div>
  );
}

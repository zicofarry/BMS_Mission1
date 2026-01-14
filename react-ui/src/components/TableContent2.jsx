import React, { useEffect, useState } from "react";
import "./FtpClient.css";

export default function TableContent({ dbname, table, editMode }) {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [newRow, setNewRow] = useState({});
  const [primaryKey, setPrimaryKey] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [editTable, setEditTable] = useState(false);
  const [ftpConfig, setFtpConfig] = useState({
    host: "ftp://192.168.30.100",
    port: 21,
    user: "hariff",
    password: "rnddefense2014ajah",
    dbname: "DEFAULT.db",
  });
  const [message, setMessage] = useState("");

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

      setRows(Array.isArray(data) ? data : []);
      setColumns(data.length ? Object.keys(data[0]) : []);
      setPrimaryKey(pkData.primaryKey || "id");

      // isi default newRow dari row terakhir
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
    })
    .then(() => fetch(`http://localhost:3001/data/${dbname}/${table}`)
    .then((res) => res.json())
    .then((data) => setRows(data))
    );// refresh tabel setelah insert
//    alert("Data ditambahkan");
  };

  const handleUpdate = async (row) => {
    const pk = row[primaryKey];
    await fetch(`http://localhost:3001/data/${dbname}/${table}/${pk}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    alert("Data diperbarui");
  };

  const handleDelete = async (row) => {
    const pk = row[primaryKey];
    await fetch(`http://localhost:3001/data/${dbname}/${table}/${pk}`, {
      method: "DELETE",
    });
    alert("Data dihapus");
  };

  if (table === "FTP") {
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
        onChange={(e) => setFtpConfig({ ...ftpConfig, port: e.target.value })}
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
let hide=1
   const    onToggleEditTable=() => {setEditTable(!editTable);editMode=editTable;}

  return (
    <div style={{ padding: "10px" }}>
      <h3>
        {table} <small>({dbname})</small>
      </h3>

      {primaryKey && (
        <p style={{ color: "gray" }}>Primary key: <b>{primaryKey}</b></p>
      )}

      {/* 🔍 Search box */}
      <input
        placeholder="Cari..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "10px", width: "40%", padding: "4px" }}
      />

      {/* 📋 Table */}
      <table border="1"  
      cellPadding={editMode?"0":"2"}
      style={{ borderCollapse: "collapse"}}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
            {editMode && <th>Aksi_data</th>}
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
                        updated[(page - 1) * perPage + i][col] = e.target.value;
                        setRows(updated);
                      }}
                      style={{outline:0}}
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

      {/* 📄 Pagination */}
      <div style={{ marginTop: "10px" }}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
        Halaman {page} dari {totalPages}
        <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
      <button style={{ marginTop: "10px" }} onClick={onToggleEditTable}>
        {editMode ? "Simpan" : "Ubah"}
      </button>

      </div>

      {/* ➕ Add Form */}
      {editMode && (
        <div style={{ marginTop: "20px" }}>
          {!hide&&<h4>Tambah Data</h4>}
          {hide?"":columns.map(
            (col) =>
              col !== primaryKey && (
                <input
                  key={col}
                  placeholder={col}
                  value={newRow[col] || ""}
                  onChange={(e) =>
                    setNewRow({ ...newRow, [col]: e.target.value })
                  }
                  style={{ marginRight: "6px", padding: "4px" }}
                />
              )
          )}
          <button onClick={handleAdd}>Tambah</button>
        </div>
      )}
    </div>
  );
}

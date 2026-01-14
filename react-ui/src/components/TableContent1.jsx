import React, { useState, useEffect } from "react";
import "./FtpClient.css";


export default function TableContent({ dbname, table, editMode }) {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [newRow, setNewRow] = useState({});
  const [primaryKey, setPrimaryKey] = useState(null);

  // 🔍 state untuk search & pagination
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20); // default 5 baris
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [ftpConfig, setFtpConfig] = useState({
    host: "ftp://192.168.30.100",
    port: 21,
    user: "hariff",
    password: "rnddefense2014ajah",
    dbname: "DEFAULT.db",
  });
  const [message, setMessage] = useState("");
/*
  // fetch data awal
  const fetchData = async () => {
    const res = await fetch(`http://localhost:3001/data/${dbname}/${table}`);
    const data = await res.json();
    setRows(data.rows || []);
    setColumns(data.columns || []);
  };

  useEffect(() => {
    fetchData();
  }, [dbname, table]);
*/


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

useEffect(() => {
    if (dbname && table && table !== "FTP") {
      fetch(`http://localhost:3001/data/${dbname}/${table}`)
        .then((res) => res.json())
        .then((data) => {
          setRows(Array.isArray(data) ? data : []);
          if (Array.isArray(data) && data.length > 0) {
            setColumns(Object.keys(data[0]));
          } else {
            setColumns([]);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [dbname, table]);

  useEffect(() => {
    if (dbname && table) {
      fetch(`http://localhost:3001/data/${dbname}/${table}`)
        .then((res) => res.json())
        .then((data) => {
          setRows(data);
          if (data.length > 0) setColumns(Object.keys(data[0]));
        })
        .catch((err) => console.error(err));
    }
  }, [dbname, table]);


 // setiap kali rows berubah, set newRow = row terakhir
  useEffect(() => {
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      // exclude id biar auto increment
      const rowWithoutId = Object.fromEntries(
        Object.entries(lastRow).filter(([key]) => key !== "id")
      );
      setNewRow(rowWithoutId);
    }
  }, [rows]);

  if (!dbname || !table) return <div>Pilih tabel dari navigator.</div>;

  // 🔍 Filter data berdasarkan search
const filteredRows = Array.isArray(rows)
  ? rows.filter((row) =>
      Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  : [];

  // 📄 Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredRows.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);


  // 🔍 Filter dan pagination
  const filtered = rows.filter((r) =>
    Object.values(r).some((v) =>
      String(v).toLowerCase().includes(search.toLowerCase())
    )
  );
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
//  const totalPages = Math.ceil(filtered.length / perPage);

  // Tambah data
  const handleAdd = async () => {
    if (!newRow || Object.keys(newRow).length === 0) return;
      console.log("Add newRow",newRow)

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
  
  /*  const handleAdd = () => {
    fetch(`http://localhost:3001/data/${dbname}/${table}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRow),
    })
      .then(() =>
        fetch(`http://localhost:3001/data/${dbname}/${table}`).then((res) =>
          res.json()
        )
      )
      .then((data) => {
        setRows(data);
        setNewRow({});
      });
  };
*/
/*
  // Update data
  const handleUpdate = (id, updated) => {
    fetch(`http://localhost:3001/data/${dbname}/${table}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    }).then(() => fetch(`http://localhost:3001/data/${dbname}/${table}`)
        .then((res) => res.json())
        .then((data) => setRows(data))
    );
  };

  // Delete data
  const handleDelete = (id) => {
    if (!window.confirm("Yakin hapus data ini?")) return;

    fetch(`http://localhost:3001/data/${dbname}/${table}/${id}`, {
      method: "DELETE",
    }).then(() =>
      fetch(`http://localhost:3001/data/${dbname}/${table}`)
        .then((res) => res.json())
        .then((data) => setRows(data))
    );
  };
*/

  // Update data
  const handleUpdate = async (row) => {
    const pk = row[primaryKey];
    await fetch(`http://localhost:3001/data/${dbname}/${table}/${pk}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    }).then(() => fetch(`http://localhost:3001/data/${dbname}/${table}`)
        .then((res) => res.json())
        .then((data) => setRows(data))
    );
  };

  // Delete data
  const handleDelete = async (id) => {
    //if (!window.confirm("Yakin hapus data ini?")) return;
    const pk = row[primaryKey];

    await fetch(`http://localhost:3001/data/${dbname}/${table}/${pk}`, {
      method: "DELETE",
    }).then(() =>
      fetch(`http://localhost:3001/data/${dbname}/${table}`)
        .then((res) => res.json())
        .then((data) => setRows(data))
    );
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

  return (
    <div>
      <h2>
        {editMode ? "Edit Mode" : "View Mode"} – {table} ({dbname})
      </h2>

      {/* 🔍 Search + Rows per Page */}
      <div style={{ display: "flex", justifyContent: "space-between", margin: "10px 0" }}>
        <input
          type="text"
          placeholder="Cari data..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); // reset ke halaman 1 saat search
          }}
          style={{ padding: "6px", width: "50%" }}
        />

        <div>
          <label style={{ marginRight: "6px" }}>Rows per page:</label>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1); // reset ke halaman 1
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>


      {/* Table */}
      <table
        border="1"
        cellPadding="1"
        style={{ borderCollapse: "collapse"}}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
            {editMode && <th>Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {currentRows.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => (
                <td key={col} 
                >
                  {editMode && col !== "id" ? (
                    <input
                      value={row[col]}
                      onChange={(e) => {
                        const updated = { ...row, [col]: e.target.value };
                        handleUpdate(row.id, updated);
                      }}
                    />
                  ) : (
                    row[col]
                  )}
                </td>
              ))}
              {editMode && (
                <td>
                  <button onClick={() => handleDelete(row.id)}>Hapus</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
{/*
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
*/}        </table>

{/* Add Form */}
     {editMode && newRow && (
        <div style={{ marginBottom: "12px" }}>
          <button onClick={handleAdd}>Tambah (Copy Row Terakhir)</button>
        </div>
      )}
{/*
      {editMode && (
        <div style={{ marginBottom: "12px" }}>
          <h3>Tambah Data</h3>
          {columns.map(
            (col) =>
              col !== "id" && (
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
*/}
      {/* 📄 Pagination Controls */}
      <div style={{ marginTop: "10px", textAlign: "center" }}>
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        <span style={{ margin: "0 10px" }}>
          Halaman {currentPage} dari {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}


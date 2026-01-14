import React, { useState, useEffect, useRef } from "react";

const it = [
  ["10%", "NO", "NO", "button", "", ""],
  ["20%", "BMS", "ID", "text", "changeRow", "checkNumber(this)"],
  ["30%", "RANPUR", "NAMA", "text", "changeRow", ""],
  ["30%", "TYPE", "TYPE", "text", "changeRow", ""],
  ["10%", "ACTIVE", "ACTIVE", "text", "changeRow", ""],
];

// ambil header dari index ke-2
const headers = it.map((item) => item[2]);

export default function GwTables({ dbname = "gw.db", table = "node" }) {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [primaryKey, setPrimaryKey] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage,setPerPage] =useState(10);
  const [editTable, setEditTable] = useState(false);
  const loaded = useRef(false);
  const [newRow,setNewRow] = useState([]);
  const [lastRow,setLastRow] =useState(21);
  
  // 🔍 Filter dan pagination
  const filtered = rows.filter((r) =>
    Object.values(r).some((v) =>
      String(v).toLowerCase().includes(search.toLowerCase())
    )
  );
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

	
  const onToggleEditTable = () => {
    setEditTable(!editTable);
    if(editTable)savePage();
  };
    const fetchData = async (pg) => {
      try {
        const [dataRes, pkRes] = await Promise.all([
          fetch(`http://localhost:3001/dataPage/gw.db/node/${pg}/${perPage}`),
          fetch(`http://localhost:3001/primarykey/gw.db/node`),
        ]);

        const data = await dataRes.json();
        const pkData = await pkRes.json();

        if (Array.isArray(data)) {
          setRows(data);
//          return data;
          if (data.length > 0) setColumns(Object.keys(data[0]));
        } else {
          console.warn("Data bukan array:", data);
          setRows([]);
        }

        if (pkData?.primaryKey) setPrimaryKey(pkData.primaryKey);
      // isi default newRow dari row terakhir
      if (data.length > 0) {
        const last = data[data.length - 1];
        const copy = { ...last };
        delete copy[pkData.primaryKey || "id"];
        setNewRow(copy);
      }

        console.log("Data diterima:", newRow);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

  // 🔹 Ambil data dari backend
  useEffect(() => {
    if (loaded.current) return;
    fetchData(page);
    loaded.current = true;
  }, [dbname, table]);

const getLastPage = async () => {
  const resp = await fetch(`http://localhost:3001/count/gw.db/node`);
  const json = await resp.json();
  const total = json.total;
  console.log("total ",resp,total);
  return Math.max(1, Math.ceil(total / perPage));
};
  const getNext=async ()=>{
	let pg=(perPage+page);
setPage(pg)
console.log(page,perPage)
    await fetchData(pg);
  }
  const getPrev=async ()=>{
	if(page>perPage){let pg=page-perPage;
setPage(pg)
    await fetchData(pg);}
  }
  // 🔹 Tambah baris baru
const addRow = async () => {
  // Ambil max NO dari database
  const resp = await fetch(`http://localhost:3001/maxno/gw.db/node`);
  const j = await resp.json();

  const nextNo = (j?.max ?? 0) + 1;

  const newRow = {
    no: nextNo,
    bms: "",
    ranpur: "",
    type: "",
    active: "",
  };

  setRows([...rows, newRow]);
};

/*  const addRow = async () => {
    const newRow = {
      no: rows.length + 1,
      bms: "",
      ranpur: "",
      type: "",
      active: "",
    };
    await fetchData(lastRow);
    setRows([...rows, newRow]);
  };

const addRow = async () => {
  console.log("Mencari halaman terakhir...");

  // 1. hitung halaman terakhir dari database
  const lastPg = await getLastPage();

  console.log("LAST PAGE =", lastPg);

  // 2. pindah ke halaman terakhir dan tunggu data selesai diload
  const lastRows = await fetchData(lastPg);

  console.log("LAST ROWS =", lastRows.length);

  // 3. tambahkan baris baru ke rows halaman terakhir
  const newRow = {
    no: lastRows.length ? lastRows[lastRows.length - 1].no + 1 : 1,
    bms: "",
    ranpur: "",
    type: "",
    active: "",
  };

  const updated = [...lastRows, newRow];
  setRows(updated);

  console.log("Row baru ditambah!");

  // 4. Set page terakhir
  setPage(lastPg);
};

  setRows([...rows, newRow]);
};
*/
  // 🔹 Hapus baris
  const deleteRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    const renumbered = updated.map((r, i) => ({ ...r, no: i }));
    setRows(renumbered);
  };

  // 🔹 Update cell
  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };
  const saveDataRow = (pk) => {
         fetch(`http://localhost:3001/data/gw.db/node/${pk}`,{
//    await fetch(`http://localhost:3001/data/${dbname}/${table}/${pk}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows[pk]),
    });
  }

// contoh di React (sebelumnya ada fungsi saveData)
const saveDataX = async () => {
  try {
    const resp = await fetch(`http://localhost:3001/data/gw.db/node`,{
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows) // rows adalah array objek baris
    });
    const j = await resp.json();
    if (resp.ok) {
      alert("Sukses tersimpan: " + j.inserted + " baris");
    } else {
      alert("Gagal: " + (j.error || JSON.stringify(j)));
    }
  } catch (err) {
    console.error(err);
    alert("Error koneksi ke server: " + err.message);
  }
};

const savePage = async () => {
  try {
    const resp = await fetch(
      `http://localhost:3001/savePage/gw.db/node`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows), // hanya halaman aktif
      }
    );

    const j = await resp.json();

    if (resp.ok) {
      alert("✔ Halaman tersimpan: " + j.saved + " baris");
    } else {
      alert("Gagal: " + JSON.stringify(j));
    }
  } catch (err) {
    alert("Error koneksi: " + err.message);
  }
};

const saveData = async () => {
  try {
    const resp = await fetch(`http://localhost:3001/savePage/gw.db/node`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows)   // Hanya data di halaman aktif!
    });

    const j = await resp.json();

    alert(`Sukses!

Insert baru: ${j.inserted}
Update: ${j.updated}`);
  } catch (err) {
    alert("Error: " + err.message);
  }
};

  return (
    <div style={{ padding: "20px" }}>
      <h2>Tabel GW (Database: {dbname}, Table: {table})</h2>

      <table border="1" cellPadding="4" style={{ borderCollapse: "collapse", width: "80%" }}>
        <thead style={{ background: "#eee" }}>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
            {editTable && <th>Aksi</th>}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
//          {paginated.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {it.map(([_, key, __, type], colIndex) => (
                <td
                  key={colIndex}
                  style={{ border: "1px solid #ccc", textAlign: "center" }}
                >
                  {type === "button" ? (
                    //row.no || rowIndex + 1
                    row[key]
                  ) : (
                    <input
                      type={type || "text"}
                      value={row[key] || ""}
                      onChange={(e) =>
                        handleChange(rowIndex, key, e.target.value)
                      }
                      style={{
                        border: "0px",
                        width: "95%",
                        padding: "4px",
                        textAlign: "center",
                      }}
                    />
                  )}
                </td>
              ))}
				{editTable && 
              (<td>
                <button
                  onClick={() => deleteRow(rowIndex)}
                  style={{
                    background: "red",
                    color: "white",
                    padding: "4px 8px",
                    border: "none",
                    borderRadius: "4px",
                  }}
                >
                  Hapus
                </button>
              </td>)}
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={addRow}
        style={{
          marginTop: "10px",
          background: "green",
          color: "white",
          padding: "6px 10px",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        + Tambah Baris
      </button>
        <button  onClick={getPrev}>
          Prev
        </button>
        Halaman {page} dari {totalPages}
        <button  onClick={getNext}>
          Next
        </button>

      <button
        onClick={onToggleEditTable}
        style={{
          marginTop: "10px",
          marginLeft: "10px",
          background: "green",
          color: "white",
          padding: "6px 10px",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
          {editTable ?  "💾 Simpan" : "Ubah"}
       
      </button>

      <pre
        style={{
          marginTop: "15px",
          background: "#f7f7f7",
          padding: "10px",
          borderRadius: "6px",
          maxHeight: "300px",
          overflow: "auto",
        }}
      >
        {JSON.stringify(rows, null, 2)}
      </pre>
    </div>
  );
}

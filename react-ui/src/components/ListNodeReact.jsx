import React, { useEffect, useState } from "react";
import "./list.css";

// React port of the provided CGI HTML page
// - Single-file component that renders the table, paging and save (Ubah) actions
// - Basic client-side validation functions included (number, IP, IP-with-netmask)
// - Fetches data from ../cgi/listnode_get.cgi?s1={S1}&s2={S2}
// - Saves data to ../cgi/listnode_save.cgi via POST (JSON)

const defaultIt = [
  ["3%", "no", "NO", "button", "", ""],
  ["7%", "bms", "ID", "text", "changeRow", "checkNumber(this)"],
  ["8%", "ranpur", "NAMA", "text", "changeRow", ""],
  ["7%", "type", "TYPE", "text", "changeRow", ""],
  ["9%", "rga1", "RGA1", "text", "changeRow", ""],
  ["9%", "rga2", "RGA2", "text", "changeRow", ""],
  ["7%", "ip1", "IP1", "text", "changeRow", "checkIpWithNetMask(this)"],
  ["7%", "radio1", "RADIO1", "text", "changeRow", "checkIp(this)"],
  ["7%", "ip2", "IP2", "text", "changeRow", "checkIpWithNetMask(this)"],
  ["7%", "remote1", "REMOTE1", "text", "changeRow", "checkIp(this)"],
  ["7%", "ip3", "IP3", "text", "changeRow", "checkIpWithNetMask(this)"],
  ["7%", "radio2", "RADIO2", "text", "changeRow", "checkIp(this)"],
  ["7%", "ip4", "IP4", "text", "changeRow", "checkIpWithNetMask(this)"],
  ["7%", "remote2", "REMOTE2", "text", "changeRow", "checkIp(this)"],
];

export default function ListNodeReact({
  cmdGet = "../cgi/listnode_get.cgi",
  cmdSet = "../cgi/listnode_save.cgi",
  initialCountRow = 25,
}) {
  const [it] = useState(defaultIt);
  const col = it.length;
  const [countRow] = useState(initialCountRow);
  const [S1, setS1] = useState(1);
  const [S2] = useState(0);
  const [rows, setRows] = useState(() => createEmptyRows(initialCountRow, it));
  const [debug, setDebug] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshValue();
  }, [S1]);

  // Helpers
  function createEmptyRows(n, itArray) {
    const result = [];
    for (let r = 0; r < n; r++) {
      const obj = {};
      itArray.forEach((colDef) => {
        const key = colDef[1];
        obj[key] = "";
      });
      obj._row = r + 1;
      result.push(obj);
    }
    return result;
  }

  function changeRow(rowIndex, key, value) {
    setRows((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [key]: value };
      return next;
    });
  }

  // Validation functions
  function checkNumber(val) {
    if (val === "") return true;
    return /^\d+$/.test(val);
  }

  function checkIp(ip) {
    if (!ip) return true;
    // allow empty or IPv4 simple
    const re = /^(25[0-5]|2[0-4]\d|[01]?\d?\d)(\.(25[0-5]|2[0-4]\d|[01]?\d?\d)){3}$/;
    return re.test(ip);
  }

  function checkIpWithNetMask(val) {
    if (!val) return true;
    // support formats: 192.168.1.1 or 192.168.1.0/24
    if (val.includes("/")) {
      const parts = val.split("/");
      const ip = parts[0];
      const mask = parts[1];
      if (!checkIp(ip)) return false;
      const m = parseInt(mask, 10);
      return m >= 0 && m <= 32;
    }
    return checkIp(val);
  }

  function validateAll() {
    // iterate over rows and check special validations based on it definitions
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < it.length; c++) {
        const key = it[c][1];
        const validator = it[c][5] || ""; // original stored function name as string
        const value = rows[r][key];
        if (validator.includes("checkNumber") && value && !checkNumber(value)) {
          alert(`Baris ${r + 1}: kolom ${it[c][2]} harus berupa angka.`);
          return false;
        }
        if (validator.includes("checkIpWithNetMask") && value && !checkIpWithNetMask(value)) {
          alert(`Baris ${r + 1}: kolom ${it[c][2]} berisi IP atau IP/netmask yang tidak valid.`);
          return false;
        }
        if (validator.includes("checkIp") && value && !checkIp(value)) {
          alert(`Baris ${r + 1}: kolom ${it[c][2]} berisi IP yang tidak valid.`);
          return false;
        }
      }
    }
    return true;
  }

  // Networking functions
  async function refreshValue() {
    setLoading(true);
    try {
      const url = `${cmdGet}?s1=${S1}&s2=${S2}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Expecting the CGI to return JSON array of rows. If it returns other format, adapt.
      const data = await res.json();
      // Map data to rows state. If data shorter than countRow, fill remainder with empty rows.
      const next = createEmptyRows(countRow, it);
      if (Array.isArray(data)) {
        for (let i = 0; i < Math.min(data.length, countRow); i++) {
          const src = data[i];
          const dst = { ...next[i] };
          it.forEach((colDef) => {
            const key = colDef[1];
            if (src.hasOwnProperty(key)) dst[key] = src[key];
            // also try uppercase keys
            else if (src.hasOwnProperty(key.toUpperCase())) dst[key] = src[key.toUpperCase()];
          });
          next[i] = dst;
        }
      }
      setRows(next);
    } catch (err) {
      console.error("refreshValue error", err);
      // If CGI returns HTML or text, try to parse simple CSV lines (fallback)
      try {
        const text = await err?.response?.text?.();
        console.warn("fetch fallback text: ", text);
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  }

  function refreshValuePrev() {
    setS1((s) => Math.max(1, s - 1));
  }
  function refreshValueNext() {
    setS1((s) => s + 1);
  }

  function fillChildLast() {
    // Duplicate the last non-empty row into the last row
    setRows((prev) => {
      const copy = [...prev];
      const lastNonEmpty = [...copy].reverse().find((r) => Object.values(r).some((v) => v !== "" && v !== null));
      if (!lastNonEmpty) return copy;
      copy[copy.length - 1] = { ...lastNonEmpty, _row: copy.length };
      return copy;
    });
  }

  async function handleSave() {
    if (!validateAll()) return;
    // prepare payload: convert rows to array of objects
    const payload = { s1: S1, s2: S2, rows };
    try {
      const res = await fetch(cmdSet, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      const txt = await res.text();
      alert("Simpan berhasil. Server response:\n" + txt);
      // Optionally refresh
      refreshValue();
    } catch (err) {
      console.error("save error", err);
      alert("Gagal menyimpan: " + err.message);
    }
  }

  const toggleDebug = () => setDebug((d) => !d);

  return (
    <div className="listnode-root">
      <h3 id="headLine" style={{ textAlign: "center" }}>Daftar Konfigurasi Node</h3>

      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <button onClick={toggleDebug} id="tdebug">{debug ? "-" : "="}</button>
      </div>

      <div id="div_form">
        <table className="config-table" style={{ margin: "0 auto", width: "95%" }}>
          <thead>
            <tr>
              {it.map((c, idx) => (
                <th key={idx} style={{ width: c[0] }}>{c[2]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ridx) => (
              <tr key={ridx} id={`div${ridx + 1}`}>
                {it.map((c, cidx) => {
                  const key = c[1];
                  const type = c[3];
                  if (type === "button") {
                    return (
                      <td key={cidx} style={{ textAlign: "center" }}>
                        <button onClick={() => alert(`Baris ${ridx + 1} button clicked`)}>..</button>
                      </td>
                    );
                  }
                  return (
                    <td key={cidx}>
                      <input
                        value={row[key] || ""}
                        onChange={(e) => changeRow(ridx, key, e.target.value)}
                        onBlur={(e) => {
                          // perform validations according to validator string
                          const validator = c[5] || "";
                          const v = e.target.value;
                          if (validator.includes("checkNumber") && v && !checkNumber(v)) {
                            alert(`Kolom ${c[2]} harus berupa angka`);
                          }
                          if (validator.includes("checkIpWithNetMask") && v && !checkIpWithNetMask(v)) {
                            alert(`Kolom ${c[2]} berisi IP atau IP/netmask yang tidak valid`);
                          }
                          if (validator.includes("checkIp") && v && !checkIp(v)) {
                            alert(`Kolom ${c[2]} berisi IP yang tidak valid`);
                          }
                        }}
                        className="input-cell"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div id="div_edit" style={{ display: "block", textAlign: "center", marginTop: 12 }}>
        <div style={{ width: 960 }} />
        <div>
          <button style={{ width: 35 }} onClick={fillChildLast}>+</button>
        </div>
      </div>

      <div id="button" style={{ textAlign: "center", marginTop: 16 }}>
        <table style={{ margin: "0 auto", width: "30%" }}>
          <tbody>
            <tr>
              <td style={{ width: "10%" }} />
              <td>
                <button className="button2" onClick={refreshValuePrev}>Sebelumnya</button>
              </td>
              <td style={{ width: "10%" }} />
              <td>
                <button className="button2" onClick={refreshValueNext}>Berikutnya</button>
              </td>
              <td style={{ width: "10%" }} />
              <td>
                <button className="button2" id="save" onClick={handleSave}>Ubah</button>
              </td>
              <td style={{ width: "10%" }} />
              <td>
                <a href="../cgi/mainmenu.cgi" target="_blank" rel="noreferrer"><button className="button2">Kembali</button></a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {debug && (
        <pre style={{ background: "#f7f7f7", padding: 8, marginTop: 12 }}>{JSON.stringify({ S1, S2, rows }, null, 2)}</pre>
      )}

      {loading && <div style={{ textAlign: "center" }}>Loading...</div>}
    </div>
  );
}

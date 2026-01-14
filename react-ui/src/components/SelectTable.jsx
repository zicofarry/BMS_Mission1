import React, { useState,useEffect } from "react";

let port=4000
  let DbFiles=["Posko","GW","Personil"]
export default function SelectTable() {
  const [dbFileName, setDbFileName] = useState("Posko");

  useEffect(() => {
    fetch("http://localhost:4000/api/database")
      .then(r =>{ r.json();console.log("r",r)})
  }, [DbFiles]);
console.log("file=",DbFiles)

  const handleChange = (event) => {
//    setDbFileName(event.target.value)
    fetch("http://localhost:4000/api/database", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name})
    }).then(() => { setDbFileName(""); onChange(); });
  }
function selectDb(val)
{
let dbName=val.target.value
console.log("select",dbName)
    fetch("http://localhost:4000/api/database", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dbName})
    }).then(() => {setDbFileName(dbName)})
}
  return (
    <div className="main">
      <h3>Select Database</h3>
      <select value={dbFileName} onChange={selectDb}>
        <option value="Posko">Posko</option>
        <option value="GW">GW</option>
        <option value="UK">UK</option>
       </select>
    </div>
  )
}


import React from "react";
import FtpClient from "./FtpClient";
import UkTables from "./UkTables";
import GwTables from "./GwTables";
import TableContent from "./TableContent";
//import ListNode from "./ListNodeReact"
import Ajax from "./DynamicTable"

export default function MainContent({ dbname, table, editMode }) {
  if (!table) {
    return <div style={{ padding: "20px" }}>Silakan pilih tabel dari treeview.</div>;
  }

  // Mapping tabel dengan komponen
  const componentMap = {
    FTP: <FtpClient dbname={dbname} />,
    UK: <UkTables dbname={dbname} />,
    GW: <GwTables dbname={dbname} />,
//    Node: <ListNode dbname={dbname} />
	Ajax :<Ajax/>
  };

  // Pilih komponen berdasarkan nama tabel
  return (
    <div style={{ padding: "10px" }}>
      {componentMap[table] ? (
        componentMap[table]
      ) : (
        <TableContent dbname={dbname} table={table} editMode={editMode} />
      )}
    </div>
  );
}

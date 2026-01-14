
import React, { useState } from "react";
import DatabaseSelector from "./components/DatabaseSelector";
import SidebarTree from "./components/SidebarTree"; // treeview di kiri
import MainContent from "./components/MainContent"; // konten kanan
import "./App.css";

export default function App() {
  const [selectedDb, setSelectedDb] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="app-container">
      <header className="header">📊 BMS Mission Editor</header>
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar kiri */}
{/*      <div style={{ width: "25%", borderRight: "1px solid #ccc" }}>
        <SidebarTree
          onSelect={(db, table) => {
            setSelectedDb(db);
            setSelectedTable(table);
          }}
        />
      </div>
*/}
        <aside className="navigator">
          <DatabaseSelector
            onTableClick={(db, table) => {
              setSelectedDb(db);
              setSelectedTable(table);
            }}
            onToggleEdit={() => setEditMode(!editMode)}
            editMode={editMode}
          />
        </aside>

      {/* Konten kanan */}
      <div style={{ flex: 1 }}>
        <MainContent
          dbname={selectedDb}
          table={selectedTable}
          editMode={editMode}
        />
      </div>
    </div>
    </div>
  );
}
/*

import React, { useState } from "react";
import DatabaseSelector from "./components/DatabaseSelector";
import FtpClient from "./components/FtpClient";
import TableContent from "./components/TableContent";
import SidebarTree from "./components/SidebarTree"; // treeview di kiri
import MainContent from "./components/MainContent"; // konten kanan
import "./App.css";

export default function App() {
  const [selectedDb, setSelectedDb] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="app-container">
      <header className="header">📊 BMS Mission Editor</header>
{      <div style={{ width: "25%", borderRight: "1px solid #ccc" }}>
        <SidebarTree
          onSelect={(db, table) => {
            setSelectedDb(db);
            setSelectedTable(table);
          }}
        />
      </div>
}
      <div className="body">
        <aside className="navigator">
          <DatabaseSelector
            onTableClick={(db, table) => {
              setSelectedDb(db);
              setSelectedTable(table);
            }}
            onToggleEdit={() => setEditMode(!editMode)}
            editMode={editMode}
          />
        </aside>
        <main className="content">
	{
<TableContent dbname={selectedDb} table={selectedTable} editMode={editMode} />
	}
        </main>
      </div>
    </div>
  );
}



*/

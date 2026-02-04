import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import FtpClient from "./components/FtpClient";
import UkTables from "./components/UkTables";
import GwTables from "./components/GwTables";
import UnifiedTable from "./components/UnifiedTable";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("DB");
  const [selectedDb, setSelectedDb] = useState("source.db");
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");

  // Fetch tables when database changes
  useEffect(() => {
    if (selectedDb) {
      fetch(`http://localhost:3001/tables/${selectedDb}`)
        .then((res) => res.json())
        .then((data) => {
          setTables(data);
          // Auto-select first table
          if (data.length > 0) {
            setSelectedTable(data[0]);
          } else {
            setSelectedTable("");
          }
        })
        .catch((err) => console.error(err));
    }
  }, [selectedDb]);

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "FTP":
        return <FtpClient dbname={selectedDb} />;
      case "UK":
        return (
          <UnifiedTable
            dbname="uk.db"
            table="node"
            title="UK Tables - Node"
            subtitle="Database: uk.db"
          />
        );
      case "GW":
        return (
          <UnifiedTable
            dbname="gw.db"
            table="node"
            title="GW Tables - Node"
            subtitle="Database: gw.db"
          />
        );
      case "DB":
      default:
        return (
          <UnifiedTable
            dbname={selectedDb}
            table={selectedTable}
            title={selectedTable}
            subtitle={`Database: ${selectedDb}`}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedDb={selectedDb}
        onDbChange={setSelectedDb}
        tables={tables}
        selectedTable={selectedTable}
        onTableSelect={setSelectedTable}
      />

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

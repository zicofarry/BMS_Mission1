import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import UnifiedTable from "./components/UnifiedTable";
import UserManagement from "./components/UserManagement";
import FtpClient from "./components/FtpClient";
import UpdateDataModal from "./components/UpdateDataModal";
import "./App.css";

// Database configs for each tab
const DB_CONFIG = {
  SOURCE: { dbname: 'source.db', defaultTable: 'node' },
  UK: { dbname: 'uk.db', defaultTable: 'node' },
  GW: { dbname: 'gw.db', defaultTable: 'node' },
  POSKO: { dbname: 'posko.db', defaultTable: 'tblUnit' },
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("SOURCE");
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Table states for each database
  const [tables, setTables] = useState({});
  const [selectedTables, setSelectedTables] = useState({
    SOURCE: 'node',
    UK: 'node',
    GW: 'node',
    POSKO: 'tblUnit',
  });

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Fetch tables for current tab
  const fetchTables = useCallback(async (tabId) => {
    const config = DB_CONFIG[tabId];
    if (!config) return;

    try {
      const response = await fetch(`http://localhost:3001/tables/${config.dbname}`);
      const data = await response.json();

      setTables(prev => ({ ...prev, [tabId]: data }));

      // Set default table if not already set
      if (!selectedTables[tabId] && data.length > 0) {
        setSelectedTables(prev => ({ ...prev, [tabId]: data[0] }));
      }
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    }
  }, [selectedTables]);

  // Fetch tables when tab changes
  useEffect(() => {
    if (user && DB_CONFIG[activeTab]) {
      fetchTables(activeTab);
    }
  }, [activeTab, user, fetchTables]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleTableChange = (tabId, tableName) => {
    setSelectedTables(prev => ({ ...prev, [tabId]: tableName }));
  };

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Render content based on active tab
  const renderContent = () => {
    // User Management (admin only)
    if (activeTab === 'USERS') {
      return <UserManagement />;
    }

    // Send Data tab
    if (activeTab === 'SEND') {
      return <FtpClient dbname="source.db" user={user} />;
    }

    // Table tabs (SOURCE, UK, GW, POSKO)
    const config = DB_CONFIG[activeTab];
    if (config) {
      const tabTables = tables[activeTab] || [];
      const currentTable = selectedTables[activeTab] || config.defaultTable;

      return (
        <div className="table-section">
          {/* Table selector */}
          <div className="table-selector">
            <label>Pilih Table:</label>
            <select
              value={currentTable}
              onChange={(e) => handleTableChange(activeTab, e.target.value)}
            >
              {tabTables.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Update Data button - only for SOURCE tab and admin */}
            {activeTab === 'SOURCE' && isAdmin && (
              <button
                className="btn-update-data"
                onClick={() => setShowUpdateModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                Update Data
              </button>
            )}
          </div>

          <UnifiedTable
            key={`${config.dbname}-${currentTable}`}
            dbname={config.dbname}
            table={currentTable}
            title={`${activeTab} Tables - ${currentTable}`}
            subtitle={`Database: ${config.dbname}`}
            readOnly={!isAdmin}
          />

          {/* Update Data Modal */}
          <UpdateDataModal
            isOpen={showUpdateModal}
            onClose={() => setShowUpdateModal(false)}
          />
        </div>
      );
    }

    return null;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

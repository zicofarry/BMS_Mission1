import React from "react";
import "./Navbar.css";

const TABS = [
    { id: "FTP", label: "FTP Client", icon: "upload" },
    { id: "UK", label: "UK Tables", icon: "plug" },
    { id: "GW", label: "GW Tables", icon: "globe" },
    { id: "DB", label: "Database Browser", icon: "database" },
];

const DATABASES = ["source.db", "posko.db", "uk.db", "gw.db"];

// SVG Icon component
const Icon = ({ name, size = 16 }) => {
    const icons = {
        upload: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
        ),
        plug: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v5" />
                <path d="M6 7h12" />
                <path d="M6 10v4c0 3.5 2.5 6 6 6s6-2.5 6-6v-4" />
            </svg>
        ),
        globe: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
        ),
        database: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
        ),
        chart: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
    };

    return icons[name] || null;
};

export default function Navbar({
    activeTab,
    onTabChange,
    selectedDb,
    onDbChange,
    tables,
    selectedTable,
    onTableSelect,
}) {
    return (
        <>
            <nav className="navbar">
                <div className="navbar-brand">
                    <Icon name="chart" size={24} />
                    <span>BMS Mission Editor</span>
                </div>

                <div className="navbar-tabs">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            className={activeTab === tab.id ? "active" : ""}
                            onClick={() => onTabChange(tab.id)}
                        >
                            <Icon name={tab.icon} size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="navbar-right">
                    <select
                        className="navbar-select"
                        value={selectedDb}
                        onChange={(e) => onDbChange(e.target.value)}
                    >
                        {DATABASES.map((db) => (
                            <option key={db} value={db}>
                                {db}
                            </option>
                        ))}
                    </select>
                </div>
            </nav>

            {/* Sub-tabs for table selection when in DB Browser mode */}
            {activeTab === "DB" && tables && tables.length > 0 && (
                <div className="sub-tabs">
                    {tables.map((t) => (
                        <button
                            key={t}
                            className={selectedTable === t ? "active" : ""}
                            onClick={() => onTableSelect(t)}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}

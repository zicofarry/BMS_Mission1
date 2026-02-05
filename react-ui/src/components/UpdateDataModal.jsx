import React, { useState } from 'react';

// Target database and tables configuration
const SYNC_TARGETS = {
    uk: {
        label: 'UK Database',
        dbname: 'uk.db',
        tables: ['lan', 'node', 'vpn'],
        endpoint: '/sync/update-targets'
    },
    gw: {
        label: 'GW Database',
        dbname: 'gw.db',
        tables: ['node'],
        endpoint: '/sync/update-targets'
    },
    posko: {
        label: 'Posko Database',
        dbname: 'posko.db',
        tables: ['tblUnit', 'tblMID', 'tblNetIf', 'tblBNet', 'tblUnitChannel', 'tblRegister'],
        endpoint: '/sync/update-posko'
    }
};

export default function UpdateDataModal({ isOpen, onClose }) {
    const [selectedTargets, setSelectedTargets] = useState({
        uk: { enabled: true, tables: ['lan', 'node', 'vpn'] },
        gw: { enabled: true, tables: ['node'] },
        posko: { enabled: false, tables: ['tblUnit', 'tblMID', 'tblNetIf', 'tblBNet', 'tblUnitChannel', 'tblRegister'] }
    });
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

    const getToken = () => localStorage.getItem('token');

    const handleToggleDb = (dbKey) => {
        setSelectedTargets(prev => ({
            ...prev,
            [dbKey]: {
                ...prev[dbKey],
                enabled: !prev[dbKey].enabled
            }
        }));
    };

    const handleToggleTable = (dbKey, tableName) => {
        setSelectedTargets(prev => {
            const currentTables = prev[dbKey].tables;
            const newTables = currentTables.includes(tableName)
                ? currentTables.filter(t => t !== tableName)
                : [...currentTables, tableName];

            return {
                ...prev,
                [dbKey]: {
                    ...prev[dbKey],
                    tables: newTables
                }
            };
        });
    };

    const handleSync = async () => {
        setLoading(true);
        setError('');
        setResults(null);

        const allResults = {};

        try {
            // Sync to each enabled database
            for (const [dbKey, config] of Object.entries(selectedTargets)) {
                if (!config.enabled || config.tables.length === 0) continue;

                const targetConfig = SYNC_TARGETS[dbKey];
                const endpoint = `http://localhost:3001${targetConfig.endpoint}`;

                const body = dbKey === 'posko'
                    ? { targetTables: config.tables }
                    : { targetDb: targetConfig.dbname, targetTables: config.tables };

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getToken()}`
                    },
                    body: JSON.stringify(body)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || `Failed to sync to ${targetConfig.dbname}`);
                }

                allResults[dbKey] = data.results;
            }

            setResults(allResults);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const hasAnyEnabled = Object.values(selectedTargets).some(t => t.enabled && t.tables.length > 0);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 550, maxHeight: '80vh', overflowY: 'auto' }}>
                <h3>Update Data ke Database Target</h3>
                <p>Sinkronisasi data dari Source Table ke database target</p>

                {/* General warning */}
                <div style={{ background: '#fef3c7', padding: '10px 14px', borderRadius: 8, border: '1px solid #fcd34d', marginTop: 12, marginBottom: 16, fontSize: 13, color: '#92400e' }}>
                    ⚠️ <strong>Perhatian:</strong> Sync akan MENGHAPUS semua data existing di table target dan menggantinya dengan data dari Source.
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 16, padding: '12px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: 8, fontSize: 14, border: '1px solid #fecaca' }}>
                        {error}
                    </div>
                )}

                {!results ? (
                    <>
                        {/* UK Database */}
                        <div className="modal-section">
                            <div className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={selectedTargets.uk.enabled}
                                    onChange={() => handleToggleDb('uk')}
                                    id="uk-db"
                                />
                                <label htmlFor="uk-db" style={{ fontWeight: 600, cursor: 'pointer' }}>
                                    {SYNC_TARGETS.uk.label} (uk.db)
                                </label>
                            </div>

                            {selectedTargets.uk.enabled && (
                                <div className="checkbox-group" style={{ marginLeft: 26, marginTop: 8 }}>
                                    {SYNC_TARGETS.uk.tables.map(table => (
                                        <div key={table} className="checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={selectedTargets.uk.tables.includes(table)}
                                                onChange={() => handleToggleTable('uk', table)}
                                                id={`uk-${table}`}
                                            />
                                            <span>{table}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* GW Database */}
                        <div className="modal-section">
                            <div className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={selectedTargets.gw.enabled}
                                    onChange={() => handleToggleDb('gw')}
                                    id="gw-db"
                                />
                                <label htmlFor="gw-db" style={{ fontWeight: 600, cursor: 'pointer' }}>
                                    {SYNC_TARGETS.gw.label} (gw.db)
                                </label>
                            </div>

                            {selectedTargets.gw.enabled && (
                                <div className="checkbox-group" style={{ marginLeft: 26, marginTop: 8 }}>
                                    {SYNC_TARGETS.gw.tables.map(table => (
                                        <div key={table} className="checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={selectedTargets.gw.tables.includes(table)}
                                                onChange={() => handleToggleTable('gw', table)}
                                                id={`gw-${table}`}
                                            />
                                            <span>{table}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Posko Database */}
                        <div className="modal-section">
                            <div className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={selectedTargets.posko.enabled}
                                    onChange={() => handleToggleDb('posko')}
                                    id="posko-db"
                                />
                                <label htmlFor="posko-db" style={{ fontWeight: 600, cursor: 'pointer' }}>
                                    {SYNC_TARGETS.posko.label} (posko.db)
                                </label>
                            </div>

                            {selectedTargets.posko.enabled && (
                                <div className="checkbox-group" style={{ marginLeft: 26, marginTop: 8 }}>
                                    {SYNC_TARGETS.posko.tables.map(table => (
                                        <div key={table} className="checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={selectedTargets.posko.tables.includes(table)}
                                                onChange={() => handleToggleTable('posko', table)}
                                                id={`posko-${table}`}
                                            />
                                            <span>{table}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 16, lineHeight: 1.6 }}>
                            <strong>Field Mapping:</strong>
                            <br />• UK/GW: no→NO, bms→BMS, info→RANPUR, type→TYPE
                            <br />• Posko: bms→MID/Address, info→VehicleID, callsign→CallSign, password→Password, url→StreamVal
                        </div>
                    </>
                ) : (
                    <div className="sync-result">
                        <h4>Sinkronisasi Berhasil!</h4>

                        {Object.entries(results).map(([dbKey, tableResults]) => (
                            <div key={dbKey} style={{ marginBottom: 12 }}>
                                <strong style={{ fontSize: 13 }}>{SYNC_TARGETS[dbKey].label}:</strong>
                                {Object.entries(tableResults).map(([table, counts]) => (
                                    <div key={table} className="sync-result-item">
                                        <span>{table}</span>
                                        <span>
                                            {counts.deleted ? `Del: ${counts.deleted}, ` : ''}
                                            Insert: {counts.inserted}
                                            {counts.updated ? `, Update: ${counts.updated}` : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>
                        {results ? 'Tutup' : 'Batal'}
                    </button>
                    {!results && (
                        <button
                            className="btn btn-sync"
                            onClick={handleSync}
                            disabled={loading || !hasAnyEnabled}
                        >
                            {loading ? 'Menyinkronkan...' : 'Update Data'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

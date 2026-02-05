import React, { useState, useEffect, useCallback, useRef } from "react";
import "./UnifiedTable.css";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function UnifiedTable({
    dbname,
    table,
    title,
    subtitle,
    columnConfig, // Optional: custom column configuration
    readOnly = false, // If true, hide edit/add/delete buttons
    showUpdateButton = false, // If true, show "Update Data" button (for source table)
}) {
    // State
    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState([]);
    const [schema, setSchema] = useState([]);
    const [primaryKey, setPrimaryKey] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);
    const [showValidationToast, setShowValidationToast] = useState(false);
    const [originalRows, setOriginalRows] = useState([]);

    // Track modified rows by primary key
    const modifiedRowsRef = useRef(new Set());

    // Track rows marked for deletion
    const deletedRowsRef = useRef(new Set());

    // Fetch data
    const fetchData = useCallback(async () => {
        if (!dbname || !table) return;

        setLoading(true);
        try {
            const [dataRes, pkRes, schemaRes] = await Promise.all([
                fetch(`http://localhost:3001/data/${dbname}/${table}`),
                fetch(`http://localhost:3001/primarykey/${dbname}/${table}`),
                fetch(`http://localhost:3001/schema/${dbname}/${table}`),
            ]);

            const data = await dataRes.json();
            const pkData = await pkRes.json();
            let schemaData = [];

            try {
                schemaData = await schemaRes.json();
            } catch (e) {
                console.warn("Schema endpoint not available");
            }

            setRows(Array.isArray(data) ? data : []);
            setOriginalRows(Array.isArray(data) ? JSON.parse(JSON.stringify(data)) : []);
            setColumns(data.length ? Object.keys(data[0]) : []);
            setPrimaryKey(pkData.primaryKey || "id");
            setSchema(Array.isArray(schemaData) ? schemaData : []);
            modifiedRowsRef.current = new Set(); // Reset modified tracking
            deletedRowsRef.current = new Set(); // Reset deleted tracking
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [dbname, table]);

    useEffect(() => {
        fetchData();
        setPage(1);
        setEditMode(false);
    }, [fetchData]);

    // Filter and pagination
    const filtered = rows.filter((r) =>
        Object.values(r).some((v) =>
            String(v).toLowerCase().includes(search.toLowerCase())
        )
    );
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);
    const totalPages = Math.ceil(filtered.length / perPage);

    // Validate a value based on column schema
    const validateValue = (colName, value) => {
        const colSchema = schema.find((s) => s.name?.toUpperCase() === colName?.toUpperCase());
        if (!colSchema) return { valid: true };

        const type = colSchema.type?.toUpperCase() || "TEXT";

        if (type.includes("INT") || type.includes("INTEGER")) {
            if (value !== "" && value !== null && isNaN(parseInt(value))) {
                return { valid: false, expected: "INTEGER", message: `harus berupa angka bulat` };
            }
        } else if (type.includes("REAL") || type.includes("FLOAT") || type.includes("DOUBLE")) {
            if (value !== "" && value !== null && isNaN(parseFloat(value))) {
                return { valid: false, expected: "REAL", message: `harus berupa angka` };
            }
        }

        return { valid: true };
    };

    // Validate all rows before save
    const validateAllRows = () => {
        const errors = [];

        rows.forEach((row, rowIndex) => {
            columns.forEach((col) => {
                const result = validateValue(col, row[col]);
                if (!result.valid) {
                    errors.push({
                        row: rowIndex + 1,
                        column: col,
                        value: row[col],
                        message: `Baris ${rowIndex + 1}, Kolom "${col}": ${result.message}`,
                    });
                }
            });
        });

        return errors;
    };

    // Handle cell change - track modified rows
    const handleCellChange = (rowIndex, col, value) => {
        const actualIndex = (page - 1) * perPage + rowIndex;
        const updated = [...rows];
        updated[actualIndex][col] = value;
        setRows(updated);

        // Track this row as modified
        if (primaryKey && updated[actualIndex][primaryKey] !== undefined) {
            modifiedRowsRef.current.add(updated[actualIndex][primaryKey]);
        }

        // Auto-hide validation toast when user starts editing
        if (showValidationToast) {
            setShowValidationToast(false);
            setValidationErrors([]);
        }
    };

    // Add new row (copy last row) - WITHOUT enabling edit mode
    const handleAddRow = async () => {
        // Get max primary key value
        let nextPk = 1;
        if (rows.length > 0 && primaryKey) {
            const maxPk = Math.max(...rows.map((r) => parseInt(r[primaryKey]) || 0));
            nextPk = maxPk + 1;
        }

        // Copy last row or create empty
        let newRow = {};
        if (rows.length > 0) {
            newRow = { ...rows[rows.length - 1] };
        } else {
            columns.forEach((col) => {
                newRow[col] = "";
            });
        }

        // Set primary key
        if (primaryKey) {
            newRow[primaryKey] = nextPk;
        }

        const updatedRows = [...rows, newRow];
        setRows(updatedRows);

        // Track new row as modified (needs to be inserted)
        modifiedRowsRef.current.add(nextPk);

        // Navigate to last page to see new row
        const newTotalPages = Math.ceil(updatedRows.length / perPage);
        setPage(newTotalPages);

        // Enable edit mode so user can modify the new row
        setEditMode(true);
    };

    // Mark row for deletion
    const handleMarkForDelete = (rowIndex) => {
        const actualIndex = (page - 1) * perPage + rowIndex;
        const row = rows[actualIndex];
        const pk = row[primaryKey];

        // Add to deleted set
        deletedRowsRef.current.add(pk);

        // Remove from UI immediately
        const updated = rows.filter((_, i) => i !== actualIndex);
        setRows(updated);

        // Remove from modified if it was there
        modifiedRowsRef.current.delete(pk);
    };

    // Toggle edit mode
    const handleToggleEdit = () => {
        if (editMode) {
            // Trying to save
            const errors = validateAllRows();

            if (errors.length > 0) {
                setValidationErrors(errors);
                setShowValidationToast(true);
                return;
            }

            // Save changes - handleSave will control editMode state
            handleSave();
        } else {
            setEditMode(true);
        }
    };

    // Save only modified rows to backend
    const handleSave = async () => {
        try {
            // Get only modified rows
            const modifiedPks = modifiedRowsRef.current;
            const deletedPks = deletedRowsRef.current;
            const rowsToSave = rows.filter(row => modifiedPks.has(row[primaryKey]));

            const hasChanges = rowsToSave.length > 0 || deletedPks.size > 0;

            if (!hasChanges) {
                alert("Tidak ada perubahan untuk disimpan.");
                return;
            }

            let insertCount = 0;
            let updateCount = 0;
            let deleteCount = 0;

            // Save modified rows
            if (rowsToSave.length > 0) {
                const resp = await fetch(`http://localhost:3001/savePage/${dbname}/${table}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(rowsToSave),
                });
                const result = await resp.json();

                // Check if there are validation errors from backend
                if (result.errors && result.errors.length > 0) {
                    setValidationErrors(result.errors);
                    setShowValidationToast(true);
                    return; // Don't proceed, stay in edit mode
                }

                if (resp.ok && result.success !== false) {
                    insertCount = result.inserted || 0;
                    updateCount = result.updated || 0;
                } else if (!resp.ok) {
                    alert("Gagal menyimpan: " + (result.error || JSON.stringify(result)));
                    return;
                }
            }

            // Delete marked rows
            if (deletedPks.size > 0) {
                for (const pk of deletedPks) {
                    const resp = await fetch(`http://localhost:3001/data/${dbname}/${table}/${pk}`, {
                        method: "DELETE",
                    });
                    if (resp.ok) {
                        deleteCount++;
                    }
                }
            }

            setOriginalRows(JSON.parse(JSON.stringify(rows)));
            modifiedRowsRef.current = new Set(); // Reset modified tracking
            deletedRowsRef.current = new Set(); // Reset deleted tracking
            setEditMode(false); // Exit edit mode on success

            let message = "Data tersimpan!";
            if (insertCount > 0) message += `\nInsert: ${insertCount}`;
            if (updateCount > 0) message += `\nUpdate: ${updateCount}`;
            if (deleteCount > 0) message += `\nHapus: ${deleteCount}`;
            alert(message);
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    // Cancel edit mode
    const handleCancelEdit = () => {
        setRows(JSON.parse(JSON.stringify(originalRows)));
        setEditMode(false);
        setValidationErrors([]);
        setShowValidationToast(false);
        modifiedRowsRef.current = new Set(); // Reset modified tracking
        deletedRowsRef.current = new Set(); // Reset deleted tracking
    };

    // Get column display name
    const getColumnLabel = (col) => {
        if (columnConfig) {
            const config = columnConfig.find((c) => c.key === col);
            if (config) return config.label;
        }
        return col;
    };

    if (!dbname || !table) {
        return (
            <div className="table-container">
                <div className="empty-state">
                    <div className="icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                            <line x1="9" y1="21" x2="9" y2="9" />
                        </svg>
                    </div>
                    <p>Silakan pilih tabel untuk ditampilkan</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="table-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Memuat data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="table-container">
            {/* Header */}
            <div className="table-header">
                <h2>{title || table}</h2>
                <span className="subtitle">{subtitle || `Database: ${dbname}`}</span>
            </div>

            {/* Toolbar */}
            <div className="table-toolbar">
                <div className="toolbar-left">
                    {!readOnly && (
                        <button className="btn btn-primary" onClick={handleAddRow}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Tambah Data
                        </button>
                    )}

                    {!readOnly && (
                        <>
                            {editMode ? (
                                <>
                                    <button className="btn btn-success" onClick={handleToggleEdit}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                            <polyline points="17 21 17 13 7 13 7 21" />
                                            <polyline points="7 3 7 8 15 8" />
                                        </svg>
                                        Simpan
                                    </button>
                                    <button className="btn btn-secondary" onClick={handleCancelEdit}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                        Batal
                                    </button>
                                </>
                            ) : (
                                <button className="btn btn-warning" onClick={handleToggleEdit}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    Ubah
                                </button>
                            )}
                        </>
                    )}

                    {readOnly && (
                        <span className="read-only-badge">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            Read Only
                        </span>
                    )}
                </div>

                <div className="toolbar-right">
                    <div className="search-wrapper">
                        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            className="search-input"
                            type="text"
                            placeholder="Cari data..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>

                    <div className="rows-per-page">
                        <span>Tampilkan:</span>
                        <select
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(parseInt(e.target.value));
                                setPage(1);
                            }}
                        >
                            {ROWS_PER_PAGE_OPTIONS.map((n) => (
                                <option key={n} value={n}>
                                    {n} baris
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            {rows.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                    </div>
                    <p>Tidak ada data</p>
                </div>
            ) : (
                <table className="unified-table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col}>{getColumnLabel(col)}</th>
                            ))}
                            {editMode && <th style={{ width: '60px' }}>Aksi</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((row, rowIndex) => (
                            <tr key={rowIndex} className={editMode ? "editing" : ""}>
                                {columns.map((col) => (
                                    <td key={col}>
                                        {editMode ? (
                                            <input
                                                className={`cell-input ${validationErrors.some(
                                                    (e) =>
                                                        e.row === (page - 1) * perPage + rowIndex + 1 &&
                                                        e.column === col
                                                )
                                                    ? "error"
                                                    : ""
                                                    }`}
                                                type="text"
                                                value={row[col] ?? ""}
                                                onChange={(e) =>
                                                    handleCellChange(rowIndex, col, e.target.value)
                                                }
                                            />
                                        ) : (
                                            row[col]
                                        )}
                                    </td>
                                ))}
                                {editMode && (
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className="btn-icon btn-icon-danger"
                                            onClick={() => handleMarkForDelete(rowIndex)}
                                            title="Hapus baris"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                <line x1="10" y1="11" x2="10" y2="17" />
                                                <line x1="14" y1="11" x2="14" y2="17" />
                                            </svg>
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Pagination */}
            <div className="table-pagination">
                <div className="pagination-info">
                    Menampilkan {Math.min((page - 1) * perPage + 1, filtered.length)} -{" "}
                    {Math.min(page * perPage, filtered.length)} dari {filtered.length} data
                </div>

                <div className="pagination-buttons">
                    <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        Prev
                    </button>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        Next
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Validation Error Toast */}
            {showValidationToast && validationErrors.length > 0 && (
                <div className="validation-toast">
                    <button
                        className="close-btn"
                        onClick={() => setShowValidationToast(false)}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                    <h4>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        Validasi Gagal
                    </h4>
                    <ul>
                        {validationErrors.slice(0, 5).map((err, i) => (
                            <li key={i}>{err.message}</li>
                        ))}
                        {validationErrors.length > 5 && (
                            <li>...dan {validationErrors.length - 5} error lainnya</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

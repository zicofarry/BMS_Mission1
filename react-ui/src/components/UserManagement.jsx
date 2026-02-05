import React, { useState, useEffect, useCallback } from 'react';
import './UserManagement.css';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state for add
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'user'
    });

    // Edit state
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        role: 'user',
        password: '' // optional password change
    });

    const getToken = () => localStorage.getItem('token');

    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:3001/auth/users', {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch('http://localhost:3001/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            setSuccess(`User "${formData.username}" berhasil ditambahkan`);
            setFormData({ username: '', password: '', role: 'user' });
            setShowForm(false);
            fetchUsers();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setEditFormData({
            role: user.role,
            password: ''
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const updateData = { role: editFormData.role };
            if (editFormData.password) {
                updateData.password = editFormData.password;
            }

            const response = await fetch(`http://localhost:3001/auth/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            setSuccess(`User "${editingUser.username}" berhasil diupdate`);
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (userId, username) => {
        if (!window.confirm(`Yakin ingin menghapus user "${username}"?`)) return;

        setError('');
        setSuccess('');

        try {
            const response = await fetch(`http://localhost:3001/auth/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            setSuccess(`User "${username}" berhasil dihapus`);
            fetchUsers();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="user-management">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Memuat data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="user-management">
            <div className="um-header">
                <div>
                    <h2>Kelola User</h2>
                    <p className="subtitle">Tambah, edit, atau hapus akun pengguna</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Tambah User
                </button>
            </div>

            {error && (
                <div className="alert alert-error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {success}
                </div>
            )}

            {showForm && (
                <div className="user-form-card">
                    <h3>Tambah User Baru</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="user">User (Read Only)</option>
                                    <option value="admin">Admin (Full Access)</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                Batal
                            </button>
                            <button type="submit" className="btn btn-success">
                                Simpan User
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Modal */}
            {editingUser && (
                <div className="modal-overlay" onClick={() => setEditingUser(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Edit User: {editingUser.username}</h3>
                        <form onSubmit={handleEditSubmit}>
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label>Role</label>
                                <select
                                    value={editFormData.role}
                                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                >
                                    <option value="user">User (Read Only)</option>
                                    <option value="admin">Admin (Full Access)</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label>Password Baru (kosongkan jika tidak ingin mengganti)</label>
                                <input
                                    type="password"
                                    value={editFormData.password}
                                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                    placeholder="Kosongkan jika tidak ingin ganti"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-success">
                                    Update User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="users-table-wrapper">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Dibuat</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>
                                    <div className="user-name">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        {user.username}
                                    </div>
                                </td>
                                <td>
                                    <span className={`role-badge role-${user.role}`}>
                                        {user.role === 'admin' ? 'Admin' : 'User'}
                                    </span>
                                </td>
                                <td>{new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="btn-icon btn-icon-edit"
                                            onClick={() => handleEdit(user)}
                                            title="Edit user"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                        </button>
                                        <button
                                            className="btn-icon btn-icon-danger"
                                            onClick={() => handleDelete(user.id, user.username)}
                                            title="Hapus user"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

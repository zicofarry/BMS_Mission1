import React, { useEffect, useState } from 'react';

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '' });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const result = await window.electronAPI.invoke('get-users');
      console.log("result=",result)
      const data = result.rows || result;
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  const addUser = async () => {
    if (!form.name || !form.email) return;
    await window.electronAPI.invoke('add-user', form);
    setForm({ name: '', email: '' });
    loadUsers();
  };

  const updateUser = async (id, name, email) => {
    const newName = prompt('New name:', name);
    const newEmail = prompt('New email:', email);
    if (!newName || !newEmail) return;
    await window.electronAPI.invoke('update-user', { id, name: newName, email: newEmail });
    loadUsers();
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await window.electronAPI.invoke('delete-user', { id });
    loadUsers();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Users</h2>
      <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead>
        <tbody>
          {users.length === 0 && <tr><td colSpan="4" align="center">(No data)</td></tr>}
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;

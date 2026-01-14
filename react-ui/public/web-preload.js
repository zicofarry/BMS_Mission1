// web-preload.js - run in browser (served from /)
window.electronAPI = {
  invoke: async (channel, data) => {
    // map channels to REST API endpoints
    try {
      if (channel === 'get-users') {
        const res = await fetch('http://localhost:4000/api/users');
        return res.json();
      }
      if (channel === 'add-user') {
        await fetch('http://localhost:4000/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const res = await fetch('http://localhost:4000/api/users');
        return res.json();
      }
      if (channel === 'update-user') {
        const id = data.id;
        await fetch(`http://localhost:4000/api/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const res = await fetch('http://localhost:4000/api/users');
        return res.json();
      }
      if (channel === 'delete-user') {
        const id = data.id;
        await fetch(`http://localhost:4000/api/users/${id}`, { method: 'DELETE' });
        const res = await fetch('http://localhost:4000/api/users');
        return res.json();
      }
      return [];
    } catch (err) {
      console.error('web-preload error', err);
      return [];
    }
  }
};

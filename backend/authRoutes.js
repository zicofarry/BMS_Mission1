const express = require('express');
const router = express.Router();
const Database = require('./database');
const { hashPassword, comparePassword, generateToken, authMiddleware, adminMiddleware } = require('./auth');

const AUTH_DB = 'source.db';

// Login endpoint
router.post('/login', async (req, res) => {
    let db;
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username dan password harus diisi' });
        }

        db = new Database(AUTH_DB);
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

        if (!user) {
            return res.status(401).json({ error: 'Username atau password salah' });
        }

        const isValid = await comparePassword(password, user.password);

        if (!isValid) {
            return res.status(401).json({ error: 'Username atau password salah' });
        }

        const token = generateToken(user);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (db) db.close();
    }
});

// Get current user info
router.get('/me', authMiddleware, (req, res) => {
    res.json({
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
    });
});

// Get all users (admin only)
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
    let db;
    try {
        db = new Database(AUTH_DB);
        const users = await db.all('SELECT id, username, role, created_at FROM users ORDER BY id');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (db) db.close();
    }
});

// Register new user (admin only)
router.post('/register', authMiddleware, adminMiddleware, async (req, res) => {
    let db;
    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username dan password harus diisi' });
        }

        const validRoles = ['admin', 'user'];
        const userRole = validRoles.includes(role) ? role : 'user';

        db = new Database(AUTH_DB);

        // Check if username exists
        const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
        if (existing) {
            return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        const hashedPassword = await hashPassword(password);

        const result = await db.run(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [username, hashedPassword, userRole]
        );

        res.json({
            success: true,
            user: {
                id: result.id,
                username,
                role: userRole
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (db) db.close();
    }
});

// Delete user (admin only)
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    let db;
    try {
        const userId = parseInt(req.params.id);

        // Prevent self-deletion
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Tidak dapat menghapus akun sendiri' });
        }

        db = new Database(AUTH_DB);

        const user = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        await db.run('DELETE FROM users WHERE id = ?', [userId]);

        res.json({ success: true, message: 'User berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (db) db.close();
    }
});

// Update user (admin only)
router.put('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    let db;
    try {
        const userId = parseInt(req.params.id);
        const { password, role } = req.body;

        db = new Database(AUTH_DB);

        const user = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        const updates = [];
        const values = [];

        if (password) {
            updates.push('password = ?');
            values.push(await hashPassword(password));
        }

        if (role && ['admin', 'user'].includes(role)) {
            updates.push('role = ?');
            values.push(role);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Tidak ada data yang diupdate' });
        }

        values.push(userId);
        await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

        res.json({ success: true, message: 'User berhasil diupdate' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (db) db.close();
    }
});

module.exports = router;

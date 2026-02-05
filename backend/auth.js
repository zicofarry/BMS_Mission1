const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT Secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'bms-mission-editor-secret-key-2024';
const JWT_EXPIRES_IN = '24h';

// Hash password
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

// Compare password with hash
async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

// Verify JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

// Middleware to authenticate requests
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Token tidak valid atau kadaluarsa' });
    }

    req.user = decoded;
    next();
}

// Middleware to check admin role
function adminMiddleware(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang diizinkan.' });
    }
    next();
}

// Middleware to check write permission (admin only for modifications)
function writeMiddleware(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang dapat mengubah data.' });
    }
    next();
}

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    authMiddleware,
    adminMiddleware,
    writeMiddleware,
    JWT_SECRET
};

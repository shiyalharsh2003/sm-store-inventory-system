const jwt = require('jsonwebtoken');
const { db } = require('../db');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_inventory_key_123!@#');

    const user = await db.users.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User session expired or not found. Access denied.' });
    }

    // Attach user information to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};

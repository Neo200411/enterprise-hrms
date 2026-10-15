import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  try {
    // Look the user up on every request so deleted users and role changes take effect immediately,
    // rather than whatever role was baked into the token at login
    const result = await query('SELECT id, email, role FROM public.users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized: User no longer exists' });
    }
    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

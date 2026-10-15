import { query } from '../config/db.js';
import { cleanName } from './auth.controller.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Admin: everyone who can log in
export const listUsers = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, role, created_at FROM public.users
       ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'manager' THEN 2 ELSE 3 END, name ASC`
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin: change someone's display name
export const updateUserName = async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, error } = cleanName(req.body.name);
    if (error) return res.status(400).json({ error });

    const result = await query(
      'UPDATE public.users SET name = $1 WHERE id = $2 RETURNING id, name, email, role, created_at',
      [name, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error updating user name:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

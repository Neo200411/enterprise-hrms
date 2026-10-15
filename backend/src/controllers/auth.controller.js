import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const SALT_ROUNDS = 10;

export const register = async (req, res) => {
  try {
    const { password } = req.body;
    const email = String(req.body.email || '').trim().toLowerCase();
    const { name, error: nameError } = cleanName(req.body.name);
    // Self-registration always creates an employee. Managers/admins are promoted
    // in the database by an admin, never chosen by the client.
    const role = 'employee';

    if (!email || !password || !name) {
      return res.status(400).json({ error: nameError || 'Missing required fields' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user already exists
    const existingUser = await query('SELECT id FROM public.users WHERE LOWER(email) = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user into DB
    const result = await query(
      `INSERT INTO public.users (email, password_hash, role, name) 
       VALUES ($1, $2, $3, $4) RETURNING id, email, role, name`,
      [email, password_hash, role, name]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'User already exists with this email' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { password } = req.body;
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await query('SELECT * FROM public.users WHERE LOWER(email) = $1', [email]);
    const user = result.rows[0];

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query('SELECT id, email, role, name FROM public.users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const result = await query('SELECT password_hash FROM public.users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await query('UPDATE public.users SET password_hash = $1 WHERE id = $2', [password_hash, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Shared rule for names, used here and by the admin People page
export const cleanName = (value) => {
  const name = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!name) return { error: 'Name is required' };
  if (name.length > 100) return { error: 'Name must be 100 characters or fewer' };
  return { name };
};

// Any signed-in user can change their own display name
export const updateMyName = async (req, res) => {
  try {
    const { name, error } = cleanName(req.body.name);
    if (error) return res.status(400).json({ error });

    const result = await query(
      'UPDATE public.users SET name = $1 WHERE id = $2 RETURNING id, email, role, name',
      [name, req.user.id]
    );
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update name error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

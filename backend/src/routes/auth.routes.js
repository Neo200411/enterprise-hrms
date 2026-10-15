import { Router } from 'express';
import { register, login, getMe, updateMyName, changePassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { rateLimit } from '../middleware/rate-limit.middleware.js';

const router = Router();

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// 10 attempts per email+IP per 15 minutes stops password guessing
const loginLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 10,
  keyFn: (req) => `${req.ip}:${String(req.body?.email || '').trim().toLowerCase()}`,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

const registerLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 20,
  keyFn: (req) => req.ip,
  message: 'Too many sign-up attempts. Please try again later.',
});

// Stops guessing the current password with a stolen session
const passwordLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 10,
  keyFn: (req) => `pw:${req.user.id}`,
  message: 'Too many password change attempts. Please try again in 15 minutes.',
});

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMyName);
router.put('/password', authenticate, passwordLimiter, changePassword);

export default router;

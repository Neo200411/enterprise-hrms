import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getUserSettings, updateUserSettings } from '../controllers/settings.controller.js';

const router = Router();

// Apply authenticate middleware so req.user.id is always populated securely
router.get('/', authenticate, getUserSettings);
router.put('/', authenticate, updateUserSettings);

export default router;

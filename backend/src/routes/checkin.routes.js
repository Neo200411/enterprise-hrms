import { Router } from 'express';
import { getMyCheckins, submitCheckin, getTeamCheckins } from '../controllers/checkin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Employee routes
router.get('/my-checkins', authenticate, authorize(['employee', 'manager', 'admin']), getMyCheckins);
router.post('/', authenticate, authorize(['employee', 'manager', 'admin']), submitCheckin);

// Manager/Admin routes
router.get('/team', authenticate, authorize(['manager', 'admin']), getTeamCheckins);

export default router;

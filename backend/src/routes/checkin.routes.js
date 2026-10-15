import { Router } from 'express';
import { getMyCheckins, submitCheckin, getTeamCheckins } from '../controllers/checkin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Employee routes
router.get('/my-checkins', authenticate, getMyCheckins);
router.post('/', authenticate, submitCheckin);

// Manager/Admin routes
router.get('/team', authenticate, authorize(['manager', 'admin']), getTeamCheckins);

export default router;

import { Router } from 'express';
import { getMyGoals, submitGoals } from '../controllers/goal.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Any signed-in user (employee, manager or admin) can plan their own goals
router.get('/', authenticate, getMyGoals);
router.post('/submit', authenticate, submitGoals);

export default router;

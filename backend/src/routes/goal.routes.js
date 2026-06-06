import { Router } from 'express';
import { getMyGoals, submitGoals } from '../controllers/goal.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize(['employee', 'manager', 'admin']),
  getMyGoals
);

router.post(
  '/submit',
  authenticate,
  authorize(['employee', 'manager', 'admin']),
  submitGoals
);

export default router;
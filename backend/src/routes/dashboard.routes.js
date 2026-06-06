import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getEmployeeDashboard } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/employee', authenticate, getEmployeeDashboard);

export default router;

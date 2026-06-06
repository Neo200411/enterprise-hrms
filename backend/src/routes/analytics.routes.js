import { Router } from 'express';
import { getDashboardMetrics, exportGoalsData, getManagerDashboard } from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Only admins can access analytics routes
router.get('/dashboard', authenticate, authorize(['admin']), getDashboardMetrics);
router.get('/export', authenticate, authorize(['admin']), exportGoalsData);

// Manager route
router.get('/manager-dashboard', authenticate, authorize(['manager', 'admin']), getManagerDashboard);

export default router;

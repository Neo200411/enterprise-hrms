import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import {
  getEmployeeDashboard,
  getManagerDashboard,
  getAdminDashboard,
  exportGoalsData,
  getAuditLogs,
} from '../controllers/reports.controller.js';

const router = Router();

// Every report requires a signed-in user
router.use(authenticate);

// Employee
router.get('/employee-dashboard', getEmployeeDashboard);

// Manager (admins can see manager views too)
router.get('/manager-dashboard', authorize(['manager', 'admin']), getManagerDashboard);

// Admin
router.get('/admin-dashboard', authorize(['admin']), getAdminDashboard);
router.get('/export', authorize(['admin']), exportGoalsData);
router.get('/audit-logs', authorize(['admin']), getAuditLogs);

export default router;

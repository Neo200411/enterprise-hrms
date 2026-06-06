import { Router } from 'express';
import { getPendingApprovals, updateSubmissionStatus } from '../controllers/approval.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Only managers and admins can access approval routes
router.get('/pending', authenticate, authorize(['manager', 'admin']), getPendingApprovals);
router.put('/submissions/:submissionId/action', authenticate, authorize(['manager', 'admin']), updateSubmissionStatus);

export default router;

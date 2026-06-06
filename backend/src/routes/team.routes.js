import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { getTeamMembers } from '../controllers/team.controller.js';

const router = Router();

router.get('/', authenticate, authorize(['manager', 'admin']), getTeamMembers);

export default router;

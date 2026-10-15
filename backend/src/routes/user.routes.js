import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { listUsers, updateUserName } from '../controllers/user.controller.js';

const router = Router();

// People management is admin-only
router.use(authenticate, authorize(['admin']));

router.get('/', listUsers);
router.put('/:id/name', updateUserName);

export default router;

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { getAllEmployees } from '../controllers/employee.controller.js';

const router = Router();

router.get('/', authenticate, authorize(['admin']), getAllEmployees);

export default router;

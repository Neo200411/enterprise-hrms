import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { rateLimit } from '../middleware/rate-limit.middleware.js';
import { improveGoal } from '../controllers/ai.controller.js';

const router = Router();

// Each AI call costs quota, so limit how often one person can use it
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyFn: (req) => `ai:${req.user.id}`,
  message: 'You have used the AI assistant a lot — please wait a few minutes.',
});

router.post('/improve-goal', authenticate, aiLimiter, improveGoal);

export default router;

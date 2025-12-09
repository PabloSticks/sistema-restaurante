import { Router } from 'express';
import { getDashboardStats } from '../controllers/stats.controller.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken, verifyAdmin);

router.get('/dashboard', getDashboardStats);

export default router;
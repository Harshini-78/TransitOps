import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Protect all dashboard routes with JWT authentication
router.use(authenticate);

// GET /dashboard
router.get('/', dashboardController.getAnalytics);

export default router;

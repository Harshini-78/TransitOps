import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Protect all reports routes with JWT authentication
router.use(authenticate);

// GET /reports/fleet
router.get('/fleet', reportsController.getFleetReport);

// GET /reports/trips
router.get('/trips', reportsController.getTripReport);

// GET /reports/maintenance
router.get('/maintenance', reportsController.getMaintenanceReport);

// GET /reports/expenses
router.get('/expenses', reportsController.getExpenseReport);

// GET /reports/financial
router.get('/financial', reportsController.getFinancialReport);

export default router;

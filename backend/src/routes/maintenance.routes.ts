import { Router } from 'express';
import { maintenanceController } from '../controllers/maintenance.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Protect all maintenance routes with JWT authentication
router.use(authenticate);

// POST /maintenance
router.post('/', maintenanceController.create);

// GET /maintenance
router.get('/', maintenanceController.findAll);

// GET /maintenance/:id
router.get('/:id', maintenanceController.findById);

// PATCH /maintenance/:id
router.patch('/:id', maintenanceController.update);

// DELETE /maintenance/:id
router.delete('/:id', maintenanceController.delete);

export default router;

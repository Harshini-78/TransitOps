import { Router } from 'express';
import { fuelLogController } from '../controllers/fuel-log.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Protect all fuel log routes with JWT authentication
router.use(authenticate);

// POST /fuel-logs
router.post('/', fuelLogController.create);

// GET /fuel-logs
router.get('/', fuelLogController.findAll);

// GET /fuel-logs/:id
router.get('/:id', fuelLogController.findById);

// PATCH /fuel-logs/:id
router.patch('/:id', fuelLogController.update);

// DELETE /fuel-logs/:id
router.delete('/:id', fuelLogController.delete);

export default router;

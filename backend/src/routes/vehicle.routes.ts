import { Router } from 'express';
import { vehicleController } from '../controllers/vehicle.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

// Require users to be authenticated to access vehicle records
router.use(authenticate);

// GET /vehicles (accessible to all authenticated roles)
router.get('/', vehicleController.findAll);

// GET /vehicles/:id (accessible to all authenticated roles)
router.get('/:id', vehicleController.findById);

// POST /vehicles (restricted to Admin and Fleet Managers)
router.post('/', authorize('ADMIN', 'FLEET_MANAGER'), vehicleController.create);

// PUT /vehicles/:id (restricted to Admin and Fleet Managers)
router.put('/:id', authorize('ADMIN', 'FLEET_MANAGER'), vehicleController.update);

// DELETE /vehicles/:id (restricted to Admin and Fleet Managers)
router.delete('/:id', authorize('ADMIN', 'FLEET_MANAGER'), vehicleController.delete);

export default router;

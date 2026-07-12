import { Router } from 'express';
import { tripController } from '../controllers/trip.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

// Require users to be authenticated to access trip endpoints
router.use(authenticate);

// POST /trips (restricted to Admin and Fleet Managers)
router.post('/', authorize('ADMIN', 'FLEET_MANAGER'), tripController.create);

// GET /trips (accessible to Admin, Fleet Managers, and Analysts)
router.get('/', authorize('ADMIN', 'FLEET_MANAGER', 'ANALYST'), tripController.findAll);

// GET /trips/:id (accessible to Admin, Fleet Managers, and Analysts)
router.get('/:id', authorize('ADMIN', 'FLEET_MANAGER', 'ANALYST'), tripController.findById);

// PUT /trips/:id (restricted to Admin and Fleet Managers)
router.put('/:id', authorize('ADMIN', 'FLEET_MANAGER'), tripController.update);

// PATCH /trips/:id/status (restricted to Admin, Fleet Managers, and Drivers)
router.patch('/:id/status', authorize('ADMIN', 'FLEET_MANAGER', 'DRIVER'), tripController.updateStatus);

export default router;

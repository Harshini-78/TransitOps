import { Router } from 'express';
import { tripController } from '../controllers/trip.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

// Require users to be authenticated to access trip endpoints
router.use(authenticate);

// POST /trips (restricted to Admin and Fleet Managers)
router.post('/', authorize('ADMIN', 'FLEET_MANAGER'), tripController.create);

export default router;

import { Router } from 'express';
import { driverController } from '../controllers/driver.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/', driverController.findAll);
router.get('/:id', driverController.findById);
router.post('/', authorize('ADMIN', 'FLEET_MANAGER'), driverController.create);
router.put('/:id', authorize('ADMIN', 'FLEET_MANAGER'), driverController.update);
router.delete('/:id', authorize('ADMIN', 'FLEET_MANAGER'), driverController.delete);

export default router;

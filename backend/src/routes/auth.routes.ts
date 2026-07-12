import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { ApiResponse } from '../utils/api-response';

const router = Router();

// Public endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected endpoints for testing roles and token extraction
router.get('/me', authenticate, (req, res) => {
  ApiResponse.success(res, req.user, 'Current user session profile retrieved');
});

router.get('/admin-only', authenticate, authorize('ADMIN'), (req, res) => {
  ApiResponse.success(res, { role: req.user?.role }, 'Admin dashboard data accessible');
});

router.get(
  '/manager-or-admin',
  authenticate,
  authorize('ADMIN', 'FLEET_MANAGER'),
  (req, res) => {
    ApiResponse.success(
      res,
      { role: req.user?.role },
      'Fleet Manager or Admin dashboard data accessible'
    );
  }
);

export default router;

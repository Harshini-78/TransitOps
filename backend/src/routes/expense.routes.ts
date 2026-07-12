import { Router } from 'express';
import { expenseController } from '../controllers/expense.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Protect all expense routes with JWT authentication
router.use(authenticate);

// POST /expenses
router.post('/', expenseController.create);

// GET /expenses
router.get('/', expenseController.findAll);

// GET /expenses/:id
router.get('/:id', expenseController.findById);

// PATCH /expenses/:id
router.patch('/:id', expenseController.update);

// DELETE /expenses/:id
router.delete('/:id', expenseController.delete);

export default router;

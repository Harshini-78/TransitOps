import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from '../services/expense.service';
import { createExpenseSchema, updateExpenseSchema } from '../validators/expense.validator';
import { ApiResponse } from '../utils/api-response';

export class ExpenseController {
  private expenseService = new ExpenseService();

  /**
   * POST /expenses
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = createExpenseSchema.parse(req.body);
      const expense = await this.expenseService.create(parsedBody);
      ApiResponse.created(res, expense, 'Expense record created successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /expenses
   */
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 10));

      const { expenses, total } = await this.expenseService.findAll(page, limit);

      ApiResponse.success(
        res,
        {
          expenses,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
        'Expense records retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /expenses/:id
   */
  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const expense = await this.expenseService.findById(id);
      ApiResponse.success(res, expense, 'Expense record retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /expenses/:id
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const parsedBody = updateExpenseSchema.parse(req.body);
      const updatedExpense = await this.expenseService.update(id, parsedBody);
      ApiResponse.success(res, updatedExpense, 'Expense record updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /expenses/:id
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.expenseService.delete(id);
      ApiResponse.success(res, null, 'Expense record deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const expenseController = new ExpenseController();

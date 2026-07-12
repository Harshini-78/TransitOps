import { z } from 'zod';
import { ExpenseCategory } from '@prisma/client';

export const createExpenseSchema = z.object({
  vehicleId: z
    .string({ required_error: 'Vehicle ID is required' })
    .min(1, 'Vehicle ID cannot be empty')
    .trim(),
  category: z.nativeEnum(ExpenseCategory, {
    errorMap: () => ({
      message: 'Category must be one of: FUEL, INSURANCE, REPAIR, TOLL, OTHER',
    }),
  }),
  amount: z
    .number({ required_error: 'Amount is required' })
    .gt(0, 'Amount must be greater than 0'),
  description: z
    .string({ required_error: 'Description is required' })
    .min(5, 'Description must be at least 5 characters')
    .trim(),
  expenseDate: z.coerce.date({
    required_error: 'Expense date is required',
    invalid_type_error: 'Invalid expense date format',
  }),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

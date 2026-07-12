import { prisma } from '../prisma/client';
import { CreateExpenseInput, UpdateExpenseInput } from '../validators/expense.validator';
import { ApiError } from '../utils/api-error';
import { Expense } from '@prisma/client';

export class ExpenseService {
  /**
   * Create a new expense.
   */
  async create(input: CreateExpenseInput): Promise<Expense> {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: input.vehicleId },
    });

    if (!vehicle) {
      throw ApiError.notFound(`Vehicle with ID '${input.vehicleId}' not found`);
    }

    if (vehicle.status === 'RETIRED') {
      throw new ApiError(400, 'Cannot create expense for retired vehicles');
    }

    return prisma.expense.create({
      data: {
        ...input,
        deletedAt: null,
      },
    });
  }

  /**
   * Retrieve all non-deleted expenses with pagination and relations.
   */
  async findAll(page = 1, limit = 10): Promise<{ expenses: Expense[]; total: number }> {
    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { expenseDate: 'desc' },
        include: {
          vehicle: true,
        },
      }),
      prisma.expense.count({
        where: { deletedAt: null },
      }),
    ]);

    return { expenses, total };
  }

  /**
   * Find a single non-deleted expense by ID.
   */
  async findById(id: string): Promise<Expense> {
    const expense = await prisma.expense.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        vehicle: true,
      },
    });

    if (!expense) {
      throw ApiError.notFound(`Expense with ID '${id}' not found`);
    }

    return expense;
  }

  /**
   * Update an expense.
   */
  async update(id: string, input: UpdateExpenseInput): Promise<Expense> {
    // Check if expense exists and is not soft-deleted
    const expense = await prisma.expense.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!expense) {
      throw ApiError.notFound(`Expense with ID '${id}' not found`);
    }

    // If updating vehicleId, verify it exists and is not retired
    if (input.vehicleId && input.vehicleId !== expense.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: input.vehicleId },
      });

      if (!vehicle) {
        throw ApiError.notFound(`Vehicle with ID '${input.vehicleId}' not found`);
      }

      if (vehicle.status === 'RETIRED') {
        throw new ApiError(400, 'Cannot create expense for retired vehicles');
      }
    }

    return prisma.expense.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Soft delete an expense.
   */
  async delete(id: string): Promise<Expense> {
    const expense = await prisma.expense.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!expense) {
      throw ApiError.notFound(`Expense with ID '${id}' not found`);
    }

    return prisma.expense.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

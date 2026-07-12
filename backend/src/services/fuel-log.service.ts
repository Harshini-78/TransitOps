import { prisma } from '../prisma/client';
import { CreateFuelLogInput, UpdateFuelLogInput } from '../validators/fuel-log.validator';
import { ApiError } from '../utils/api-error';
import { FuelLog } from '@prisma/client';

export class FuelLogService {
  /**
   * Create a new fuel log record.
   */
  async create(input: CreateFuelLogInput): Promise<FuelLog> {
    // Check if trip exists
    const trip = await prisma.trip.findUnique({
      where: { id: input.tripId },
    });

    if (!trip) {
      throw ApiError.notFound(`Trip with ID '${input.tripId}' not found`);
    }

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: input.vehicleId },
    });

    if (!vehicle) {
      throw ApiError.notFound(`Vehicle with ID '${input.vehicleId}' not found`);
    }

    // Calculate operational costs
    const totalCost = input.liters * input.pricePerLiter;

    return prisma.fuelLog.create({
      data: {
        ...input,
        totalCost,
        deletedAt: null,
      },
    });
  }

  /**
   * Retrieve all non-deleted fuel logs with pagination and relations.
   */
  async findAll(page = 1, limit = 10): Promise<{ fuelLogs: FuelLog[]; total: number }> {
    const skip = (page - 1) * limit;

    const [fuelLogs, total] = await Promise.all([
      prisma.fuelLog.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { fuelDate: 'desc' },
        include: {
          trip: true,
          vehicle: true,
        },
      }),
      prisma.fuelLog.count({
        where: { deletedAt: null },
      }),
    ]);

    return { fuelLogs, total };
  }

  /**
   * Find a single non-deleted fuel log by ID.
   */
  async findById(id: string): Promise<FuelLog> {
    const fuelLog = await prisma.fuelLog.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        trip: true,
        vehicle: true,
      },
    });

    if (!fuelLog) {
      throw ApiError.notFound(`Fuel log with ID '${id}' not found`);
    }

    return fuelLog;
  }

  /**
   * Update an existing fuel log.
   */
  async update(id: string, input: UpdateFuelLogInput): Promise<FuelLog> {
    // Check if fuel log exists and is not soft-deleted
    const fuelLog = await prisma.fuelLog.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!fuelLog) {
      throw ApiError.notFound(`Fuel log with ID '${id}' not found`);
    }

    // If tripId is being updated, verify that the new trip exists
    if (input.tripId && input.tripId !== fuelLog.tripId) {
      const trip = await prisma.trip.findUnique({
        where: { id: input.tripId },
      });

      if (!trip) {
        throw ApiError.notFound(`Trip with ID '${input.tripId}' not found`);
      }
    }

    // If vehicleId is being updated, verify that the new vehicle exists
    if (input.vehicleId && input.vehicleId !== fuelLog.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: input.vehicleId },
      });

      if (!vehicle) {
        throw ApiError.notFound(`Vehicle with ID '${input.vehicleId}' not found`);
      }
    }

    // Recalculate operational costs if liters or pricePerLiter changes
    let totalCost = fuelLog.totalCost;
    if (input.liters !== undefined || input.pricePerLiter !== undefined) {
      const liters = input.liters !== undefined ? input.liters : fuelLog.liters;
      const pricePerLiter = input.pricePerLiter !== undefined ? input.pricePerLiter : fuelLog.pricePerLiter;
      totalCost = liters * pricePerLiter;
    }

    return prisma.fuelLog.update({
      where: { id },
      data: {
        ...input,
        totalCost,
      },
    });
  }

  /**
   * Soft delete a fuel log record.
   */
  async delete(id: string): Promise<FuelLog> {
    const fuelLog = await prisma.fuelLog.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!fuelLog) {
      throw ApiError.notFound(`Fuel log with ID '${id}' not found`);
    }

    return prisma.fuelLog.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

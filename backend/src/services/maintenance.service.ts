import { prisma } from '../prisma/client';
import { CreateMaintenanceInput, UpdateMaintenanceInput } from '../validators/maintenance.validator';
import { ApiError } from '../utils/api-error';
import { Maintenance, MaintenanceStatus, VehicleStatus } from '@prisma/client';

export class MaintenanceService {
  /**
   * Create a new maintenance record and set vehicle status to IN_MAINTENANCE.
   */
  async create(input: CreateMaintenanceInput): Promise<Maintenance> {
    return prisma.$transaction(async (tx) => {
      // 1. Check if vehicle exists
      const vehicle = await tx.vehicle.findUnique({
        where: { id: input.vehicleId },
      });

      if (!vehicle) {
        throw ApiError.notFound('Vehicle not found');
      }

      // 2. Business rule validations on vehicle status
      if (vehicle.status === VehicleStatus.IN_MAINTENANCE) {
        throw new ApiError(409, 'Vehicle is already under maintenance.');
      }
      if (vehicle.status === VehicleStatus.ON_TRIP) {
        throw new ApiError(409, 'Vehicle is currently on an active trip.');
      }
      if (vehicle.status === VehicleStatus.RETIRED) {
        throw new ApiError(409, 'Retired vehicles cannot receive maintenance records.');
      }
      if (vehicle.status !== VehicleStatus.AVAILABLE) {
        throw new ApiError(409, 'Vehicle is currently unavailable.');
      }

      // 3. Create the maintenance record (default status is PENDING)
      const maintenance = await tx.maintenance.create({
        data: {
          vehicleId: input.vehicleId,
          title: input.title,
          description: input.description,
          maintenanceType: input.maintenanceType,
          cost: input.cost,
          scheduledDate: input.scheduledDate,
          status: MaintenanceStatus.PENDING,
        },
        include: {
          vehicle: true,
        },
      });

      // 4. Automatically update vehicle status AVAILABLE -> IN_MAINTENANCE
      await tx.vehicle.update({
        where: { id: vehicle.id },
        data: { status: VehicleStatus.IN_MAINTENANCE },
      });

      return maintenance;
    });
  }

  /**
   * Retrieve all maintenance records with pagination.
   */
  async findAll(page = 1, limit = 10): Promise<{ maintenances: Maintenance[]; total: number }> {
    const skip = (page - 1) * limit;

    const [maintenances, total] = await Promise.all([
      prisma.maintenance.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: true,
        },
      }),
      prisma.maintenance.count(),
    ]);

    return { maintenances, total };
  }

  /**
   * Retrieve a single maintenance record by its unique ID.
   */
  async findById(id: string): Promise<Maintenance> {
    const maintenance = await prisma.maintenance.findUnique({
      where: { id },
      include: {
        vehicle: true,
      },
    });

    if (!maintenance) {
      throw ApiError.notFound('Maintenance record not found');
    }

    return maintenance;
  }

  /**
   * Update a maintenance record. If status transitions to COMPLETED, free up the vehicle.
   */
  async update(id: string, input: UpdateMaintenanceInput): Promise<Maintenance> {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch existing record
      const maintenance = await tx.maintenance.findUnique({
        where: { id },
      });

      if (!maintenance) {
        throw ApiError.notFound('Maintenance record not found');
      }

      // 2. Determine if status is changing to COMPLETED
      const isCompleting = input.status === MaintenanceStatus.COMPLETED && maintenance.status !== MaintenanceStatus.COMPLETED;

      // 3. Prepare updates
      const updatedFields: any = {
        title: input.title,
        description: input.description,
        maintenanceType: input.maintenanceType,
        cost: input.cost,
        status: input.status,
      };

      if (input.completedDate !== undefined) {
        updatedFields.completedDate = input.completedDate;
      }

      if (isCompleting) {
        updatedFields.completedDate = new Date();
      }

      // 4. Update the maintenance record
      const updatedMaintenance = await tx.maintenance.update({
        where: { id },
        data: updatedFields,
        include: {
          vehicle: true,
        },
      });

      // 5. If completed, set vehicle status to AVAILABLE
      if (isCompleting) {
        await tx.vehicle.update({
          where: { id: maintenance.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });
      }

      return updatedMaintenance;
    });
  }

  /**
   * Soft delete maintenance: set status to CANCELLED and free up the vehicle if appropriate.
   */
  async delete(id: string): Promise<Maintenance> {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch existing record
      const maintenance = await tx.maintenance.findUnique({
        where: { id },
      });

      if (!maintenance) {
        throw ApiError.notFound('Maintenance record not found');
      }

      // 2. Update status to CANCELLED
      const updatedMaintenance = await tx.maintenance.update({
        where: { id },
        data: { status: MaintenanceStatus.CANCELLED },
        include: {
          vehicle: true,
        },
      });

      // 3. If maintenance wasn't completed, free up the vehicle
      if (maintenance.status !== MaintenanceStatus.COMPLETED) {
        await tx.vehicle.update({
          where: { id: maintenance.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });
      }

      return updatedMaintenance;
    });
  }
}

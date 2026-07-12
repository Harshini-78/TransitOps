import { prisma } from '../prisma/client';
import { CreateVehicleInput, UpdateVehicleInput } from '../validators/vehicle.validator';
import { ApiError } from '../utils/api-error';
import { Vehicle } from '@prisma/client';

export class VehicleService {
  /**
   * Create a new vehicle after validating registration number uniqueness.
   */
  async create(input: CreateVehicleInput): Promise<Vehicle> {
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { registrationNumber: input.registrationNumber },
    });

    if (existingVehicle) {
      throw new ApiError(409, `Vehicle with registration number '${input.registrationNumber}' already exists`);
    }

    return prisma.vehicle.create({
      data: input,
    });
  }

  /**
   * Retrieve all vehicles.
   */
  async findAll(): Promise<Vehicle[]> {
    return prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find a vehicle by its unique ID.
   */
  async findById(id: string): Promise<Vehicle> {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw ApiError.notFound(`Vehicle with ID '${id}' not found`);
    }

    return vehicle;
  }

  /**
   * Update a vehicle's properties.
   */
  async update(id: string, input: UpdateVehicleInput): Promise<Vehicle> {
    // Verify the target vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw ApiError.notFound(`Vehicle with ID '${id}' not found`);
    }

    // If changing the registration number, verify it is not already taken
    if (input.registrationNumber && input.registrationNumber !== vehicle.registrationNumber) {
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { registrationNumber: input.registrationNumber },
      });

      if (existingVehicle) {
        throw new ApiError(409, `Vehicle with registration number '${input.registrationNumber}' already exists`);
      }
    }

    return prisma.vehicle.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Delete a vehicle from the system.
   */
  async delete(id: string): Promise<Vehicle> {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw ApiError.notFound(`Vehicle with ID '${id}' not found`);
    }

    // Remove the vehicle
    return prisma.vehicle.delete({
      where: { id },
    });
  }
}

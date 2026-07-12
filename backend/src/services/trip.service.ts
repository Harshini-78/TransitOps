import { prisma } from '../prisma/client';
import { CreateTripInput } from '../validators/trip.validator';
import { ApiError } from '../utils/api-error';
import { Trip, TripStatus } from '@prisma/client';

export class TripService {
  /**
   * Create a new trip after verifying that the vehicle and driver exist.
   */
  async create(input: CreateTripInput): Promise<Trip> {
    // 1. Check whether the Vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: input.vehicleId },
    });
    if (!vehicle) {
      throw ApiError.notFound('Vehicle not found');
    }

    // 2. Check whether the Driver exists
    const driver = await prisma.driver.findUnique({
      where: { id: input.driverId },
    });
    if (!driver) {
      throw ApiError.notFound('Driver not found');
    }

    // 3. Create the Trip with status set to SCHEDULED
    return prisma.trip.create({
      data: {
        vehicleId: input.vehicleId,
        driverId: input.driverId,
        source: input.source,
        destination: input.destination,
        cargoWeight: input.cargoWeight,
        distance: input.distance,
        startTime: input.startTime,
        endTime: input.endTime,
        status: TripStatus.SCHEDULED,
      },
    });
  }
}

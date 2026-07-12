import { prisma } from '../prisma/client';
import { CreateTripInput, UpdateTripInput } from '../validators/trip.validator';
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

  /**
   * Retrieve all trips with pagination and relations.
   */
  async findAll(page = 1, limit = 10): Promise<{ trips: Trip[]; total: number }> {
    const skip = (page - 1) * limit;

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: true,
          driver: true,
        },
      }),
      prisma.trip.count(),
    ]);

    return { trips, total };
  }

  /**
   * Find a trip by its unique ID, including vehicle and driver details.
   */
  async findById(id: string): Promise<Trip> {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
      },
    });

    if (!trip) {
      throw ApiError.notFound(`Trip with ID '${id}' not found`);
    }

    return trip;
  }

  /**
   * Update a trip's details. vehicleId and driverId cannot be updated.
   */
  async update(id: string, input: UpdateTripInput): Promise<Trip> {
    // 1. Find existing trip
    const trip = await prisma.trip.findUnique({
      where: { id },
    });

    if (!trip) {
      throw ApiError.notFound(`Trip with ID '${id}' not found`);
    }

    // 2. Validate start and end time chronology
    const newStartTime = input.startTime ?? trip.startTime;
    const newEndTime = input.endTime ?? trip.endTime;

    if (newStartTime && newEndTime && newEndTime <= newStartTime) {
      throw ApiError.badRequest('End time must be after start time');
    }

    // 3. Execute update
    return prisma.trip.update({
      where: { id },
      data: {
        source: input.source,
        destination: input.destination,
        cargoWeight: input.cargoWeight,
        distance: input.distance,
        startTime: input.startTime,
        endTime: input.endTime,
        status: input.status,
      },
      include: {
        vehicle: true,
        driver: true,
      },
    });
  }

  /**
   * Update only the status of a trip.
   */
  async updateStatus(id: string, status: TripStatus): Promise<Trip> {
    // 1. Find existing trip
    const trip = await prisma.trip.findUnique({
      where: { id },
    });

    if (!trip) {
      throw ApiError.notFound(`Trip with ID '${id}' not found`);
    }

    // 2. Execute update
    return prisma.trip.update({
      where: { id },
      data: { status },
      include: {
        vehicle: true,
        driver: true,
      },
    });
  }
}

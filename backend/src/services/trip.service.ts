import { prisma } from '../prisma/client';
import { CreateTripInput, UpdateTripInput } from '../validators/trip.validator';
import { ApiError } from '../utils/api-error';
import { Trip, TripStatus, VehicleStatus, DriverStatus } from '@prisma/client';

export class TripService {
  private validateVehicleAvailability(status: VehicleStatus): void {
    if (status === VehicleStatus.AVAILABLE) {
      return;
    }
    if (status === VehicleStatus.ON_TRIP) {
      throw new ApiError(409, 'Vehicle is currently unavailable.');
    }
    if (status === VehicleStatus.IN_MAINTENANCE) {
      throw new ApiError(409, 'Vehicle is under maintenance.');
    }
    if (status === VehicleStatus.RETIRED) {
      throw new ApiError(409, 'Vehicle has been retired.');
    }
    throw new ApiError(409, 'Vehicle is currently unavailable.');
  }

  private validateDriverAvailability(status: DriverStatus): void {
    if (status === DriverStatus.AVAILABLE) {
      return;
    }
    if (status === DriverStatus.ON_TRIP) {
      throw new ApiError(409, 'Driver is currently unavailable.');
    }
    if (status === DriverStatus.SUSPENDED) {
      throw new ApiError(409, 'Driver has been suspended.');
    }
    throw new ApiError(409, 'Driver is currently unavailable.');
  }

  private validateDriverLicense(licenseExpiry: Date): void {
    if (new Date(licenseExpiry) <= new Date()) {
      throw new ApiError(409, 'Driver license has expired.');
    }
  }

  private validateCargoWeight(cargoWeight: number, capacity: number): void {
    if (cargoWeight > capacity) {
      throw new ApiError(409, 'Cargo weight exceeds vehicle capacity.');
    }
  }

  /**
   * Create a new trip after verifying that the vehicle and driver exist and are available.
   */
  async create(input: CreateTripInput): Promise<Trip> {
    return prisma.$transaction(async (tx) => {
      // 1. Check whether the Vehicle exists
      const vehicle = await tx.vehicle.findUnique({
        where: { id: input.vehicleId },
      });
      if (!vehicle) {
        throw ApiError.notFound('Vehicle not found');
      }

      // 2. Check whether the Driver exists
      const driver = await tx.driver.findUnique({
        where: { id: input.driverId },
      });
      if (!driver) {
        throw ApiError.notFound('Driver not found');
      }

      // 3. Business rule validations
      this.validateVehicleAvailability(vehicle.status);
      this.validateDriverAvailability(driver.status);
      this.validateDriverLicense(driver.licenseExpiry);
      this.validateCargoWeight(input.cargoWeight, vehicle.capacity);

      // 4. Create the Trip with status set to SCHEDULED
      const trip = await tx.trip.create({
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

      // 5. Update Vehicle status to ON_TRIP
      await tx.vehicle.update({
        where: { id: vehicle.id },
        data: { status: VehicleStatus.ON_TRIP },
      });

      // 6. Update Driver status to ON_TRIP
      await tx.driver.update({
        where: { id: driver.id },
        data: { status: DriverStatus.ON_TRIP },
      });

      return trip;
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
<<<<<<< HEAD
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
=======
   * Update only the status of a trip.
   */
  async updateStatus(id: string, status: TripStatus): Promise<Trip> {
    return prisma.$transaction(async (tx) => {
      // 1. Find existing trip
      const trip = await tx.trip.findUnique({
        where: { id },
      });

      if (!trip) {
        throw ApiError.notFound(`Trip with ID '${id}' not found`);
      }

      // 2. Execute update
      const updatedTrip = await tx.trip.update({
        where: { id },
        data: { status },
        include: {
          vehicle: true,
          driver: true,
        },
      });

      // 3. Handle Trip completion: automatically free vehicle and driver
      if (status === TripStatus.COMPLETED) {
        await tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });

        await tx.driver.update({
          where: { id: trip.driverId },
          data: { status: DriverStatus.AVAILABLE },
        });
      }

      return updatedTrip;
>>>>>>> d0914e6 (feat: add trip business rules and transactional workflow)
    });
  }
}

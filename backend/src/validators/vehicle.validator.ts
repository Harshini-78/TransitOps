import { z } from 'zod';
import { VehicleType, VehicleStatus } from '@prisma/client';

export const createVehicleSchema = z.object({
  registrationNumber: z
    .string({ required_error: 'Registration number is required' })
    .min(1, 'Registration number cannot be empty')
    .trim(),
  model: z
    .string({ required_error: 'Model is required' })
    .min(1, 'Model cannot be empty')
    .trim(),
  manufacturer: z
    .string({ required_error: 'Manufacturer is required' })
    .min(1, 'Manufacturer cannot be empty')
    .trim(),
  vehicleType: z.nativeEnum(VehicleType, {
    errorMap: () => ({
      message: 'Vehicle type must be one of: TRUCK, VAN, BUS, CAR',
    }),
  }),
  capacity: z
    .number({ required_error: 'Capacity is required' })
    .gt(0, 'Capacity must be greater than 0'),
  odometer: z
    .number({ required_error: 'Odometer reading is required' })
    .gte(0, 'Odometer reading cannot be negative'),
  purchaseDate: z.coerce.date({
    required_error: 'Purchase date is required',
    invalid_type_error: 'Invalid purchase date format',
  }),
  status: z
    .nativeEnum(VehicleStatus, {
      errorMap: () => ({
        message: 'Status must be one of: AVAILABLE, ON_TRIP, IN_MAINTENANCE, RETIRED',
      }),
    })
    .default(VehicleStatus.AVAILABLE),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;

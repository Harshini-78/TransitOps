import { z } from 'zod';

export const createTripSchema = z
  .object({
    vehicleId: z
      .string({ required_error: 'Vehicle ID is required' })
      .min(1, 'Vehicle ID cannot be empty'),
    driverId: z
      .string({ required_error: 'Driver ID is required' })
      .min(1, 'Driver ID cannot be empty'),
    source: z
      .string({ required_error: 'Source is required' })
      .min(3, 'Source must be at least 3 characters')
      .trim(),
    destination: z
      .string({ required_error: 'Destination is required' })
      .min(3, 'Destination must be at least 3 characters')
      .trim(),
    cargoWeight: z
      .number({ required_error: 'Cargo weight is required' })
      .gt(0, 'Cargo weight must be greater than 0'),
    distance: z
      .number({ required_error: 'Distance is required' })
      .gt(0, 'Distance must be greater than 0'),
    startTime: z.coerce.date({
      required_error: 'Start time is required',
      invalid_type_error: 'Invalid start time format',
    }),
    endTime: z.coerce.date({
      required_error: 'End time is required',
      invalid_type_error: 'Invalid end time format',
    }),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export type CreateTripInput = z.infer<typeof createTripSchema>;

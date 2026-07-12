import { z } from 'zod';
import { TripStatus } from '@prisma/client';

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
      .max(100, 'Source must not exceed 100 characters')
      .trim(),
    destination: z
      .string({ required_error: 'Destination is required' })
      .min(3, 'Destination must be at least 3 characters')
      .max(100, 'Destination must not exceed 100 characters')
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

export const updateTripSchema = z
  .object({
    source: z
      .string()
      .min(3, 'Source must be at least 3 characters')
      .max(100, 'Source must not exceed 100 characters')
      .trim()
      .optional(),
    destination: z
      .string()
      .min(3, 'Destination must be at least 3 characters')
      .max(100, 'Destination must not exceed 100 characters')
      .trim()
      .optional(),
    cargoWeight: z
      .number()
      .gt(0, 'Cargo weight must be greater than 0')
      .optional(),
    distance: z
      .number()
      .gt(0, 'Distance must be greater than 0')
      .optional(),
    startTime: z.coerce.date({
      invalid_type_error: 'Invalid start time format',
    }).optional(),
    endTime: z.coerce.date({
      invalid_type_error: 'Invalid end time format',
    }).optional(),
    status: z.nativeEnum(TripStatus, {
      errorMap: () => ({
        message: 'Status must be one of: SCHEDULED, ONGOING, COMPLETED, CANCELLED',
      }),
    }).optional(),
  })
  .refine((data) => {
    if (data.startTime && data.endTime) {
      return data.endTime > data.startTime;
    }
    return true;
  }, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export const updateTripStatusSchema = z.object({
  status: z.nativeEnum(TripStatus, {
    errorMap: () => ({
      message: 'Status must be one of: SCHEDULED, ONGOING, COMPLETED, CANCELLED',
    }),
  }),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type UpdateTripStatusInput = z.infer<typeof updateTripStatusSchema>;

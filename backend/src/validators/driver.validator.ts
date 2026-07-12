import { z } from 'zod';
import { DriverStatus } from '@prisma/client';

export const createDriverSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(3, 'Name must be at least 3 characters')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .trim(),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .regex(/^\d{10,15}$/, 'Phone number must be between 10 and 15 digits'),
  licenseNumber: z
    .string({ required_error: 'License number is required' })
    .min(1, 'License number cannot be empty')
    .trim(),
  licenseExpiry: z.coerce.date({
    required_error: 'License expiry date is required',
    invalid_type_error: 'Invalid license expiry date format',
  }).refine((val) => val > new Date(), {
    message: 'License expiry date must be a future date',
  }),
  status: z
    .nativeEnum(DriverStatus, {
      errorMap: () => ({
        message: 'Status must be one of: AVAILABLE, ON_TRIP, OFF_DUTY, SUSPENDED',
      }),
    })
    .default(DriverStatus.AVAILABLE),
});

export const updateDriverSchema = createDriverSchema.partial();

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;

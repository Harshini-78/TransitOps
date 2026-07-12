import { z } from 'zod';

export const createFuelLogSchema = z.object({
  tripId: z
    .string({ required_error: 'Trip ID is required' })
    .min(1, 'Trip ID cannot be empty')
    .trim(),
  vehicleId: z
    .string({ required_error: 'Vehicle ID is required' })
    .min(1, 'Vehicle ID cannot be empty')
    .trim(),
  liters: z
    .number({ required_error: 'Liters must be a number' })
    .gt(0, 'Liters must be greater than 0'),
  pricePerLiter: z
    .number({ required_error: 'Price per liter must be a number' })
    .gt(0, 'Price per liter must be greater than 0'),
  fuelDate: z.coerce.date({
    required_error: 'Fuel date is required',
    invalid_type_error: 'Invalid fuel date format',
  }),
});

export const updateFuelLogSchema = createFuelLogSchema.partial();

export type CreateFuelLogInput = z.infer<typeof createFuelLogSchema>;
export type UpdateFuelLogInput = z.infer<typeof updateFuelLogSchema>;

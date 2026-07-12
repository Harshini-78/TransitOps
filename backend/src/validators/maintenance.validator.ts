import { z } from 'zod';
import { MaintenanceStatus, MaintenanceType } from '@prisma/client';

export const createMaintenanceSchema = z.object({
  vehicleId: z
    .string({ required_error: 'Vehicle ID is required' })
    .min(1, 'Vehicle ID cannot be empty'),
  title: z
    .string({ required_error: 'Title is required' })
    .min(3, 'Title must be at least 3 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .min(10, 'Description must be at least 10 characters'),
  maintenanceType: z.nativeEnum(MaintenanceType, {
    errorMap: () => ({
      message: 'Maintenance type must be one of: PREVENTIVE, CORRECTIVE, INSPECTION, EMERGENCY',
    }),
  }),
  cost: z
    .number({ required_error: 'Cost is required' })
    .min(0, 'Cost must be greater than or equal to 0'),
  scheduledDate: z.coerce.date({
    required_error: 'Scheduled date is required',
    invalid_type_error: 'Invalid scheduled date format',
  }),
});

export const updateMaintenanceSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .optional(),
  maintenanceType: z
    .nativeEnum(MaintenanceType, {
      errorMap: () => ({
        message: 'Maintenance type must be one of: PREVENTIVE, CORRECTIVE, INSPECTION, EMERGENCY',
      }),
    })
    .optional(),
  cost: z
    .number()
    .min(0, 'Cost must be greater than or equal to 0')
    .optional(),
  status: z
    .nativeEnum(MaintenanceStatus, {
      errorMap: () => ({
        message: 'Status must be one of: PENDING, IN_PROGRESS, COMPLETED, CANCELLED',
      }),
    })
    .optional(),
  completedDate: z.coerce
    .date({
      invalid_type_error: 'Invalid completed date format',
    })
    .nullable()
    .optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;

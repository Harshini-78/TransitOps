import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/api-error';

/**
 * Middleware to authorize requests based on user roles.
 * Usage: authorize('ADMIN') or authorize('ADMIN', 'FLEET_MANAGER')
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication is required to access this resource');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw ApiError.forbidden('You do not have the required permissions to perform this action');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

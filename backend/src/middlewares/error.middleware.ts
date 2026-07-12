import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { ApiResponse } from '../utils/api-response';
import { ZodError } from 'zod';
import { config } from '../config';

/**
 * Centralized error handler middleware.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // If headers are already sent, delegate to default Express handler
  if (res.headersSent) {
    return;
  }

  // 1. Handle custom ApiError
  if (err instanceof ApiError) {
    ApiResponse.error(res, err.message, err.statusCode, (err.errors as unknown[]) || null);
    return;
  }

  // 2. Handle Zod ValidationError
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    ApiResponse.error(res, 'Validation failed', 400, formattedErrors);
    return;
  }

  // 3. Handle Prisma unique constraint error specifically
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as unknown as { code: string; meta?: { target?: string[] } };
    if (prismaErr.code === 'P2002') {
      const fields = prismaErr.meta?.target ? prismaErr.meta.target.join(', ') : 'fields';
      ApiResponse.error(res, `A user with this ${fields} already exists`, 409);
      return;
    }
  }

  // 4. Handle default/unknown errors
  console.error('💥 Unhandled Exception:', err);

  const message = config.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
  const errors = config.NODE_ENV === 'production' ? null : [err.stack];

  ApiResponse.error(res, message, 500, errors);
}

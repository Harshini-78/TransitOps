import { Response } from 'express';

export class ApiResponse {
  /**
   * Send a successful response
   */
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
    });
  }

  /**
   * Send a 210/201 Created response
   */
  static created<T>(
    res: Response,
    data: T,
    message = 'Resource created successfully'
  ): Response {
    return this.success(res, data, message, 201);
  }

  /**
   * Send a structured error response
   */
  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors: unknown[] | null = null
  ): Response {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors,
    });
  }
}

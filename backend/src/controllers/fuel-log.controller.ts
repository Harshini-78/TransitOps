import { Request, Response, NextFunction } from 'express';
import { FuelLogService } from '../services/fuel-log.service';
import { createFuelLogSchema, updateFuelLogSchema } from '../validators/fuel-log.validator';
import { ApiResponse } from '../utils/api-response';

export class FuelLogController {
  private fuelLogService = new FuelLogService();

  /**
   * POST /fuel-logs
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = createFuelLogSchema.parse(req.body);
      const fuelLog = await this.fuelLogService.create(parsedBody);
      ApiResponse.created(res, fuelLog, 'Fuel log record created successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /fuel-logs
   */
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 10));

      const { fuelLogs, total } = await this.fuelLogService.findAll(page, limit);

      ApiResponse.success(
        res,
        {
          fuelLogs,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
        'Fuel log records retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /fuel-logs/:id
   */
  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const fuelLog = await this.fuelLogService.findById(id);
      ApiResponse.success(res, fuelLog, 'Fuel log record retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /fuel-logs/:id
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const parsedBody = updateFuelLogSchema.parse(req.body);
      const updatedFuelLog = await this.fuelLogService.update(id, parsedBody);
      ApiResponse.success(res, updatedFuelLog, 'Fuel log record updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /fuel-logs/:id
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.fuelLogService.delete(id);
      ApiResponse.success(res, null, 'Fuel log record deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const fuelLogController = new FuelLogController();

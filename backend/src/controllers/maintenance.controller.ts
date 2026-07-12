import { Request, Response, NextFunction } from 'express';
import { MaintenanceService } from '../services/maintenance.service';
import { createMaintenanceSchema, updateMaintenanceSchema } from '../validators/maintenance.validator';
import { ApiResponse } from '../utils/api-response';

export class MaintenanceController {
  private maintenanceService = new MaintenanceService();

  /**
   * POST /maintenance
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = createMaintenanceSchema.parse(req.body);
      const maintenance = await this.maintenanceService.create(parsedBody);
      ApiResponse.created(res, maintenance, 'Maintenance record created successfully.');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /maintenance
   */
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 10));

      const { maintenances, total } = await this.maintenanceService.findAll(page, limit);

      ApiResponse.success(
        res,
        {
          maintenances,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
        'Maintenance records retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /maintenance/:id
   */
  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const maintenance = await this.maintenanceService.findById(id);
      ApiResponse.success(res, maintenance, 'Maintenance record retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /maintenance/:id
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const parsedBody = updateMaintenanceSchema.parse(req.body);
      const updatedMaintenance = await this.maintenanceService.update(id, parsedBody);
      ApiResponse.success(res, updatedMaintenance, 'Maintenance record updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /maintenance/:id
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const deletedMaintenance = await this.maintenanceService.delete(id);
      ApiResponse.success(res, deletedMaintenance, 'Maintenance record cancelled successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const maintenanceController = new MaintenanceController();

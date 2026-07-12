import { Request, Response, NextFunction } from 'express';
import { DriverService } from '../services/driver.service';
import { createDriverSchema, updateDriverSchema } from '../validators/driver.validator';
import { ApiResponse } from '../utils/api-response';

export class DriverController {
  private driverService = new DriverService();

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = createDriverSchema.parse(req.body);
      const driver = await this.driverService.create(parsedBody);
      ApiResponse.created(res, driver, 'Driver registered successfully');
    } catch (error) {
      next(error);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const drivers = await this.driverService.findAll();
      ApiResponse.success(res, drivers, 'Drivers list retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const driver = await this.driverService.findById(id);
      ApiResponse.success(res, driver, 'Driver profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const parsedBody = updateDriverSchema.parse(req.body);
      const updatedDriver = await this.driverService.update(id, parsedBody);
      ApiResponse.success(res, updatedDriver, 'Driver updated successfully');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.driverService.delete(id);
      ApiResponse.success(res, null, 'Driver deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const driverController = new DriverController();

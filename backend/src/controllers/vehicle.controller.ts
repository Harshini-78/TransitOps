import { Request, Response, NextFunction } from 'express';
import { VehicleService } from '../services/vehicle.service';
import { createVehicleSchema, updateVehicleSchema } from '../validators/vehicle.validator';
import { ApiResponse } from '../utils/api-response';

export class VehicleController {
  private vehicleService = new VehicleService();

  /**
   * POST /vehicles
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = createVehicleSchema.parse(req.body);
      const vehicle = await this.vehicleService.create(parsedBody);
      ApiResponse.created(res, vehicle, 'Vehicle registered successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /vehicles
   */
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicles = await this.vehicleService.findAll();
      ApiResponse.success(res, vehicles, 'Vehicles list retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /vehicles/:id
   */
  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const vehicle = await this.vehicleService.findById(id);
      ApiResponse.success(res, vehicle, 'Vehicle profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /vehicles/:id
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const parsedBody = updateVehicleSchema.parse(req.body);
      const updatedVehicle = await this.vehicleService.update(id, parsedBody);
      ApiResponse.success(res, updatedVehicle, 'Vehicle updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /vehicles/:id
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.vehicleService.delete(id);
      ApiResponse.success(res, null, 'Vehicle deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const vehicleController = new VehicleController();

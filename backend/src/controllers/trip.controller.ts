import { Request, Response, NextFunction } from 'express';
import { TripService } from '../services/trip.service';
import { createTripSchema, updateTripSchema, updateTripStatusSchema } from '../validators/trip.validator';
import { ApiResponse } from '../utils/api-response';

export class TripController {
  private tripService = new TripService();

  /**
   * POST /trips
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = createTripSchema.parse(req.body);
      const trip = await this.tripService.create(parsedBody);
      ApiResponse.created(res, trip, 'Trip created successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /trips
   */
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 10));

      const { trips, total } = await this.tripService.findAll(page, limit);

      ApiResponse.success(
        res,
        {
          trips,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
        'Trips list retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /trips/:id
   */
  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const trip = await this.tripService.findById(id);
      ApiResponse.success(res, trip, 'Trip profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /trips/:id
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const parsedBody = updateTripSchema.parse(req.body);
      const updatedTrip = await this.tripService.update(id, parsedBody);
      ApiResponse.success(res, updatedTrip, 'Trip updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /trips/:id/status
   */
  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const parsedBody = updateTripStatusSchema.parse(req.body);
      const updatedTrip = await this.tripService.updateStatus(id, parsedBody.status);
      ApiResponse.success(res, updatedTrip, 'Trip status updated successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const tripController = new TripController();

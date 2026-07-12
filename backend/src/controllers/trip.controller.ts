import { Request, Response, NextFunction } from 'express';
import { TripService } from '../services/trip.service';
import { createTripSchema } from '../validators/trip.validator';
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
}

export const tripController = new TripController();

import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { ApiResponse } from '../utils/api-response';

export class DashboardController {
  private dashboardService = new DashboardService();

  /**
   * GET /dashboard
   * Fetches the dashboard analytics overview.
   */
  getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const analytics = await this.dashboardService.getAnalytics();
      ApiResponse.success(res, analytics, 'Dashboard analytics fetched successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();

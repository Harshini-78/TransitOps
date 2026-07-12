import { Request, Response, NextFunction } from 'express';
import { ReportsService } from '../services/reports.service';
import { ApiResponse } from '../utils/api-response';

export class ReportsController {
  private reportsService = new ReportsService();

  /**
   * GET /reports/fleet
   */
  getFleetReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.reportsService.getFleetReport();
      ApiResponse.success(res, data, 'Fleet report retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /reports/trips
   */
  getTripReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.reportsService.getTripReport();
      ApiResponse.success(res, data, 'Trip report retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /reports/maintenance
   */
  getMaintenanceReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.reportsService.getMaintenanceReport();
      ApiResponse.success(res, data, 'Maintenance report retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /reports/expenses
   */
  getExpenseReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.reportsService.getExpenseReport();
      ApiResponse.success(res, data, 'Expense report retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /reports/financial
   */
  getFinancialReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.reportsService.getFinancialReport();
      ApiResponse.success(res, data, 'Financial report retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const reportsController = new ReportsController();

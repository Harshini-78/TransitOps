import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { ApiResponse } from '../utils/api-response';

export class AuthController {
  private authService = new AuthService();

  /**
   * Controller for POST /auth/register
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = registerSchema.parse(req.body);
      const registeredUser = await this.authService.register(parsedBody);
      ApiResponse.created(res, registeredUser, 'User registration completed successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Controller for POST /auth/login
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = loginSchema.parse(req.body);
      const result = await this.authService.login(parsedBody);
      ApiResponse.success(res, result, 'User logged in successfully');
    } catch (error) {
      next(error);
    }
  };
}
export const authController = new AuthController();

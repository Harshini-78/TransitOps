import express, { Request, Response } from 'express';
import authRoutes from './routes/auth.routes';
import vehicleRoutes from './routes/vehicle.routes';
import driverRoutes from './routes/driver.routes';
import tripRoutes from './routes/trip.routes';
import maintenanceRoutes from './routes/maintenance.routes';
<<<<<<< HEAD
=======
import expenseRoutes from './routes/expense.routes';
import dashboardRoutes from './routes/dashboard.routes';
import fuelLogRoutes from './routes/fuel-log.routes';
import reportsRoutes from './routes/reports.routes';
>>>>>>> 08115db (feat: implement dashboard, maintenance, fuel logs and reports modules)
import { errorHandler } from './middlewares/error.middleware';
import { ApiResponse } from './utils/api-response';

const app = express();

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// API Base routes
app.use('/auth', authRoutes);
app.use('/vehicles', vehicleRoutes);
app.use('/drivers', driverRoutes);
app.use('/trips', tripRoutes);
app.use('/maintenance', maintenanceRoutes);
<<<<<<< HEAD
=======
app.use('/expenses', expenseRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/fuel-logs', fuelLogRoutes);
app.use('/reports', reportsRoutes);
>>>>>>> 08115db (feat: implement dashboard, maintenance, fuel logs and reports modules)

// Fallback route for non-existent endpoints
app.use((req: Request, res: Response) => {
  ApiResponse.error(res, `Route '${req.originalUrl}' not found`, 404);
});

// Centralized global error handler
app.use(errorHandler);

export default app;

export type Role = 'ADMIN' | 'FLEET_MANAGER' | 'DRIVER' | 'ANALYST';

export type VehicleType = 'TRUCK' | 'VAN' | 'BUS' | 'CAR';

export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_MAINTENANCE' | 'RETIRED';

export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';

export type TripStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export type MaintenanceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION' | 'EMERGENCY';

export type ExpenseCategory = 'FUEL' | 'INSURANCE' | 'REPAIR' | 'TOLL' | 'OTHER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSuccessPayload {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: boolean;
  statusCode: number;
  message: string;
  errors: unknown[] | null;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  model: string;
  manufacturer: string;
  vehicleType: VehicleType;
  capacity: number;
  odometer: number;
  purchaseDate: string;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
}

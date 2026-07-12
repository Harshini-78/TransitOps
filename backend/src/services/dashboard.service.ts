import { prisma } from '../prisma/client';
import { VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus } from '@prisma/client';

export interface DashboardData {
  vehicles: {
    total: number;
    available: number;
    onTrip: number;
    inMaintenance: number;
    retired: number;
  };
  drivers: {
    total: number;
    available: number;
    onTrip: number;
    suspended: number;
  };
  trips: {
    total: number;
    scheduled: number;
    ongoing: number;
    completed: number;
    cancelled: number;
  };
  maintenance: {
    total: number;
    pending: number;
    completed: number;
  };
  finance: {
    totalMaintenanceCost: number;
    totalFuelCost: number;
    totalExpenseCost: number;
  };
  fleetUtilization: number;
}

export class DashboardService {
  /**
   * Fetches dashboard analytics including summary metrics for vehicles,
   * drivers, trips, maintenance, finances, and fleet utilization.
   */
  async getAnalytics(): Promise<DashboardData> {
    const [
      vehicleCounts,
      driverCounts,
      tripCounts,
      maintenanceCounts,
      maintenanceSum,
      fuelSum,
      expenseSum,
    ] = await Promise.all([
      // Group and count vehicles by status
      prisma.vehicle.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      // Group and count drivers by status
      prisma.driver.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      // Group and count trips by status
      prisma.trip.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      // Group and count maintenance by status
      prisma.maintenance.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      // Sum maintenance cost
      prisma.maintenance.aggregate({
        _sum: { cost: true },
      }),
      // Sum fuel log cost
      prisma.fuelLog.aggregate({
        _sum: { totalCost: true },
      }),
      // Sum expense cost (excluding soft-deleted)
      prisma.expense.aggregate({
        where: { deletedAt: null },
        _sum: { amount: true },
      }),
    ]);

    // Map Vehicle Counts
    const vehicleStatusMap = vehicleCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {} as Record<VehicleStatus, number>);

    const totalVehicles = Object.values(vehicleStatusMap).reduce((sum, val) => sum + val, 0);
    const availableVehicles = vehicleStatusMap[VehicleStatus.AVAILABLE] || 0;
    const vehiclesOnTrip = vehicleStatusMap[VehicleStatus.ON_TRIP] || 0;
    const vehiclesInMaintenance = vehicleStatusMap[VehicleStatus.IN_MAINTENANCE] || 0;
    const retiredVehicles = vehicleStatusMap[VehicleStatus.RETIRED] || 0;

    // Map Driver Counts
    const driverStatusMap = driverCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {} as Record<DriverStatus, number>);

    const totalDrivers = Object.values(driverStatusMap).reduce((sum, val) => sum + val, 0);
    const availableDrivers = driverStatusMap[DriverStatus.AVAILABLE] || 0;
    const driversOnTrip = driverStatusMap[DriverStatus.ON_TRIP] || 0;
    const suspendedDrivers = driverStatusMap[DriverStatus.SUSPENDED] || 0;

    // Map Trip Counts
    const tripStatusMap = tripCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {} as Record<TripStatus, number>);

    const totalTrips = Object.values(tripStatusMap).reduce((sum, val) => sum + val, 0);
    const scheduledTrips = tripStatusMap[TripStatus.SCHEDULED] || 0;
    const ongoingTrips = tripStatusMap[TripStatus.ONGOING] || 0;
    const completedTrips = tripStatusMap[TripStatus.COMPLETED] || 0;
    const cancelledTrips = tripStatusMap[TripStatus.CANCELLED] || 0;

    // Map Maintenance Counts
    const maintenanceStatusMap = maintenanceCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {} as Record<MaintenanceStatus, number>);

    const totalMaintenance = Object.values(maintenanceStatusMap).reduce((sum, val) => sum + val, 0);
    const pendingMaintenance = maintenanceStatusMap[MaintenanceStatus.PENDING] || 0;
    const completedMaintenance = maintenanceStatusMap[MaintenanceStatus.COMPLETED] || 0;

    // Map Finances
    const totalMaintenanceCost = maintenanceSum._sum.cost || 0;
    const totalFuelCost = fuelSum._sum.totalCost || 0;
    const totalExpenseCost = expenseSum._sum.amount || 0;

    // Calculate Fleet Utilization
    const fleetUtilization = totalVehicles > 0
      ? Math.round((vehiclesOnTrip / totalVehicles) * 100)
      : 0;

    return {
      vehicles: {
        total: totalVehicles,
        available: availableVehicles,
        onTrip: vehiclesOnTrip,
        inMaintenance: vehiclesInMaintenance,
        retired: retiredVehicles,
      },
      drivers: {
        total: totalDrivers,
        available: availableDrivers,
        onTrip: driversOnTrip,
        suspended: suspendedDrivers,
      },
      trips: {
        total: totalTrips,
        scheduled: scheduledTrips,
        ongoing: ongoingTrips,
        completed: completedTrips,
        cancelled: cancelledTrips,
      },
      maintenance: {
        total: totalMaintenance,
        pending: pendingMaintenance,
        completed: completedMaintenance,
      },
      finance: {
        totalMaintenanceCost,
        totalFuelCost,
        totalExpenseCost,
      },
      fleetUtilization,
    };
  }
}

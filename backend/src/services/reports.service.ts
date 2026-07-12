import { prisma } from '../prisma/client';
import { VehicleStatus, TripStatus, MaintenanceStatus, ExpenseCategory } from '@prisma/client';

export class ReportsService {
  /**
   * Fleet Report
   */
  async getFleetReport() {
    const counts = await prisma.vehicle.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const statusMap = counts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {} as Record<VehicleStatus, number>);

    const totalVehicles = Object.values(statusMap).reduce((sum, val) => sum + val, 0);
    const available = statusMap[VehicleStatus.AVAILABLE] || 0;
    const onTrip = statusMap[VehicleStatus.ON_TRIP] || 0;
    const maintenance = statusMap[VehicleStatus.IN_MAINTENANCE] || 0;
    const retired = statusMap[VehicleStatus.RETIRED] || 0;

    const fleetUtilization = totalVehicles > 0
      ? Math.round((onTrip / totalVehicles) * 100)
      : 0;

    return {
      totalVehicles,
      available,
      onTrip,
      maintenance,
      retired,
      fleetUtilization,
    };
  }

  /**
   * Trip Report
   */
  async getTripReport() {
    const [counts, distanceAgg] = await Promise.all([
      prisma.trip.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.trip.aggregate({
        _sum: { distance: true },
        _avg: { distance: true },
      }),
    ]);

    const statusMap = counts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {} as Record<TripStatus, number>);

    const totalTrips = Object.values(statusMap).reduce((sum, val) => sum + val, 0);
    const scheduled = statusMap[TripStatus.SCHEDULED] || 0;
    const ongoing = statusMap[TripStatus.ONGOING] || 0;
    const completed = statusMap[TripStatus.COMPLETED] || 0;
    const cancelled = statusMap[TripStatus.CANCELLED] || 0;

    const totalDistance = distanceAgg._sum.distance || 0;
    const averageDistance = distanceAgg._avg.distance ? Math.round(distanceAgg._avg.distance * 100) / 100 : 0;

    return {
      totalTrips,
      scheduled,
      ongoing,
      completed,
      cancelled,
      averageDistance,
      totalDistance,
    };
  }

  /**
   * Maintenance Report
   */
  async getMaintenanceReport() {
    const [counts, costAgg] = await Promise.all([
      prisma.maintenance.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.maintenance.aggregate({
        _sum: { cost: true },
      }),
    ]);

    const statusMap = counts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {} as Record<MaintenanceStatus, number>);

    const totalMaintenanceRecords = Object.values(statusMap).reduce((sum, val) => sum + val, 0);
    const completed = statusMap[MaintenanceStatus.COMPLETED] || 0;
    const pending = statusMap[MaintenanceStatus.PENDING] || 0;
    const cancelled = statusMap[MaintenanceStatus.CANCELLED] || 0;

    const totalMaintenanceCost = costAgg._sum.cost || 0;

    return {
      totalMaintenanceRecords,
      completed,
      pending,
      cancelled,
      totalMaintenanceCost,
    };
  }

  /**
   * Expense Report
   */
  async getExpenseReport() {
    const counts = await prisma.expense.groupBy({
      where: { deletedAt: null },
      by: ['category'],
      _sum: { amount: true },
    });

    const categoryMap = counts.reduce((acc, curr) => {
      acc[curr.category] = curr._sum.amount || 0;
      return acc;
    }, {} as Record<ExpenseCategory, number>);

    return {
      fuel: categoryMap[ExpenseCategory.FUEL] || 0,
      insurance: categoryMap[ExpenseCategory.INSURANCE] || 0,
      repair: categoryMap[ExpenseCategory.REPAIR] || 0,
      toll: categoryMap[ExpenseCategory.TOLL] || 0,
      other: categoryMap[ExpenseCategory.OTHER] || 0,
    };
  }

  /**
   * Financial Report
   */
  async getFinancialReport() {
    const [fuelAgg, maintenanceAgg, expenseAgg] = await Promise.all([
      prisma.fuelLog.aggregate({
        where: { deletedAt: null },
        _sum: { totalCost: true },
      }),
      prisma.maintenance.aggregate({
        _sum: { cost: true },
      }),
      prisma.expense.aggregate({
        where: { deletedAt: null },
        _sum: { amount: true },
      }),
    ]);

    const totalFuelCost = fuelAgg._sum.totalCost || 0;
    const totalMaintenanceCost = maintenanceAgg._sum.cost || 0;
    const totalExpenseCost = expenseAgg._sum.amount || 0;
    const overallOperationalCost = totalFuelCost + totalMaintenanceCost + totalExpenseCost;

    return {
      totalFuelCost,
      totalMaintenanceCost,
      totalExpenseCost,
      overallOperationalCost,
    };
  }
}

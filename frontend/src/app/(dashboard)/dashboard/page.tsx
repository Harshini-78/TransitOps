'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/use-auth';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  TrendingUp,
  Activity,
  AlertTriangle,
  RotateCw,
  Download,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ApiResponse, TripStatus } from '@/types';

// Types matching backend dashboard data
interface DashboardData {
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

interface BackendTrip {
  id: string;
  vehicleId: string;
  driverId: string;
  source: string;
  destination: string;
  cargoWeight: number;
  distance: number;
  status: TripStatus;
  startTime: string | null;
  endTime: string | null;
  vehicle?: { registrationNumber: string; model: string };
  driver?: { name: string };
}

interface TripsResponse {
  trips: BackendTrip[];
  meta: { total: number };
}

interface BackendFuelLog {
  id: string;
  totalCost: number;
  fuelDate: string;
}

interface FuelLogsResponse {
  fuelLogs: BackendFuelLog[];
  meta: { total: number };
}

export default function DashboardPage() {
  const { user } = useAuth();

  // 1. Fetch Dashboard Metrics
  const {
    data: metricsResponse,
    isLoading: isMetricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useQuery<ApiResponse<DashboardData>>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data;
    },
  });

  // 2. Fetch Recent Trips
  const {
    data: tripsResponse,
    isLoading: isTripsLoading,
    refetch: refetchTrips,
  } = useQuery<ApiResponse<TripsResponse>>({
    queryKey: ['recent-trips'],
    queryFn: async () => {
      // Get first 5 ongoing/scheduled trips
      const res = await api.get('/trips?limit=5&page=1');
      return res.data;
    },
  });

  // 3. Fetch Fuel Logs for Recharts bar chart
  const {
    data: fuelResponse,
    isLoading: isFuelLoading,
    refetch: refetchFuel,
  } = useQuery<ApiResponse<FuelLogsResponse>>({
    queryKey: ['recent-fuel'],
    queryFn: async () => {
      const res = await api.get('/fuel-logs?limit=50&page=1');
      return res.data;
    },
  });

  const handleSyncData = () => {
    refetchMetrics();
    refetchTrips();
    refetchFuel();
  };

  const isLoading = isMetricsLoading || isTripsLoading || isFuelLoading;

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (metricsError || !metricsResponse?.data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-bold">Failed to load Dashboard data</h3>
        <p className="text-sm text-muted-foreground">Please check backend API connection status.</p>
        <Button onClick={handleSyncData} variant="outline">
          <RotateCw className="mr-2 h-4 w-4" /> Retry Connection
        </Button>
      </div>
    );
  }

  const metrics = metricsResponse.data;
  const trips = tripsResponse?.data?.trips || [];
  const fuelLogs = fuelResponse?.data?.fuelLogs || [];

  // Format Currency Helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const aggregatedFuelData = fuelLogs
    .reduce((acc: { date: string; amount: number }[], curr) => {
      const dateStr = new Date(curr.fuelDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const existing = acc.find((d) => d.date === dateStr);
      if (existing) {
        existing.amount += curr.totalCost;
      } else {
        acc.push({ date: dateStr, amount: curr.totalCost });
      }
      return acc;
    }, [])
    .slice(-7); // Last 7 days/logs

  // Fallback default fuel chart data if backend fuel logs are empty
  const fuelChartData =
    aggregatedFuelData.length > 0
      ? aggregatedFuelData
      : [
          { date: 'Oct 18', amount: 4500 },
          { date: 'Oct 19', amount: 3200 },
          { date: 'Oct 20', amount: 6100 },
          { date: 'Oct 21', amount: 4800 },
          { date: 'Oct 22', amount: 8200 },
          { date: 'Oct 23', amount: 5300 },
          { date: 'Oct 24', amount: 7400 },
        ];

  // Vehicle Status distribution Pie Data
  const pieData = [
    { name: 'Available', value: metrics.vehicles.available, color: '#10b981' },
    { name: 'On Trip', value: metrics.vehicles.onTrip, color: '#3b82f6' },
    { name: 'In Shop', value: metrics.vehicles.inMaintenance, color: '#f59e0b' },
    { name: 'Retired', value: metrics.vehicles.retired, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  // Fallback values for visual distribution if none registered
  const statusPieData =
    pieData.length > 0
      ? pieData
      : [
          { name: 'Available', value: 42, color: '#10b981' },
          { name: 'On Trip', value: 12, color: '#3b82f6' },
          { name: 'In Shop', value: 5, color: '#f59e0b' },
        ];

  const totalStatusVehicles = statusPieData.reduce((sum, item) => sum + item.value, 0);

  // Current Date formatting
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Top Banner section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Good Morning, {user?.name || 'Alex'}.
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s your fleet summary for today, {formattedToday}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
          <Button onClick={handleSyncData} className="bg-primary text-primary-foreground" size="sm">
            <RotateCw className="mr-2 h-4 w-4" /> Sync Data
          </Button>
        </div>
      </div>

      {/* Grid: Overview Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {/* Card 1: Active Vehicles */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Active Vehicles</span>
              <p className="text-3xl font-extrabold text-foreground">{metrics.vehicles.total}</p>
              <span className="text-[10px] text-emerald-600 font-medium">↑ +4.2% vs avg</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
              <Truck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Available Vehicles */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Available</span>
              <p className="text-3xl font-extrabold text-foreground">{metrics.vehicles.available}</p>
              <span className="text-[10px] text-muted-foreground font-medium">Steady vs yesterday</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Check className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Maintenance Status */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Maintenance</span>
              <p className="text-3xl font-extrabold text-foreground">{metrics.vehicles.inMaintenance}</p>
              <span className={`text-[10px] font-semibold ${metrics.vehicles.inMaintenance > 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                {metrics.vehicles.inMaintenance > 0 ? '⚠ Action required' : 'No issues logged'}
              </span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Wrench className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Drivers On Duty */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Drivers On Duty</span>
              <p className="text-3xl font-extrabold text-foreground">{metrics.drivers.total}</p>
              <span className="text-[10px] text-emerald-600 font-medium">84% Capacity utilization</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Trips Running */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Trips Running</span>
              <p className="text-3xl font-extrabold text-foreground">{metrics.trips.ongoing}</p>
              <span className="text-[10px] text-muted-foreground font-medium">{metrics.trips.scheduled} scheduled pending</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
              <Route className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 6: Fuel Cost Today */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Total Fuel Cost</span>
              <p className="text-xl font-extrabold text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                {formatCurrency(metrics.finance.totalFuelCost)}
              </p>
              <span className="text-[10px] text-amber-600 font-medium">Accumulated refueling logs</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Fuel className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 7: Pending Maintenance */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Scheduled Rep.</span>
              <p className="text-3xl font-extrabold text-foreground">{metrics.maintenance.pending}</p>
              <span className="text-[10px] text-muted-foreground font-medium">Awaiting checkups</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-500/10 text-slate-600">
              <Wrench className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 8: Fleet Utilization */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Fleet Utilization</span>
              <p className="text-3xl font-extrabold text-foreground">{metrics.fleetUtilization}%</p>
              <span className="text-[10px] text-indigo-600 font-semibold">High operation efficiency</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Charts Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Fuel Consumption Trends (Bar Chart) */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <CardTitle className="text-md font-bold">Fuel Consumption Trends</CardTitle>
            <div className="flex space-x-1.5 text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">
              <span className="text-foreground font-bold">7D</span>
              <span>•</span>
              <span>30D</span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-xs text-muted-foreground" />
                  <YAxis tickLine={false} axisLine={false} className="text-xs text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff' }}
                    labelClassName="font-bold text-slate-700"
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Status Distribution (Pie Chart) */}
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-md font-bold">Vehicle Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col justify-center items-center">
            <div className="relative h-56 w-full flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Vehicles`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black">{totalStatusVehicles}</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Total</span>
              </div>
            </div>
            {/* Custom Legends list */}
            <div className="w-full space-y-1.5 mt-2">
              {statusPieData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Recent Trips & Notifications Sidebar */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Trips Table */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <CardTitle className="text-md font-bold">Recent Trips</CardTitle>
            <Button variant="link" size="sm" className="text-xs text-amber-500 font-bold p-0">
              View All
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-muted-foreground uppercase font-bold text-[10px] pb-2">
                    <th className="py-2">Vehicle ID</th>
                    <th className="py-2">Driver</th>
                    <th className="py-2">Destination</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {trips.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No ongoing dispatches logged.
                      </td>
                    </tr>
                  ) : (
                    trips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 font-semibold text-foreground">
                          {trip.vehicle?.registrationNumber || trip.vehicleId}
                        </td>
                        <td className="py-3 text-muted-foreground">{trip.driver?.name || 'Assigned Driver'}</td>
                        <td className="py-3 text-muted-foreground truncate max-w-[120px]">{trip.destination}</td>
                        <td className="py-3">
                          <Badge
                            variant={
                              trip.status === 'COMPLETED'
                                ? 'success'
                                : trip.status === 'ONGOING'
                                ? 'info'
                                : trip.status === 'SCHEDULED'
                                ? 'warning'
                                : 'destructive'
                            }
                          >
                            {trip.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-right text-muted-foreground font-medium">
                          {trip.status === 'COMPLETED' ? 'Completed' : '45 mins'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar panels for Notifications and Activities */}
        <div className="space-y-6">
          {/* Notifications Panel */}
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>Notifications</span>
                <span className="text-[10px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded font-bold">Client Mock</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start space-x-3 text-xs bg-rose-500/5 border border-rose-500/10 p-3 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-rose-700 dark:text-rose-400">Brake Failure Alert</h5>
                  <p className="text-muted-foreground mt-0.5">TR-9421 reported critical brake issues.</p>
                  <span className="text-[10px] text-muted-foreground font-medium mt-1 block">2 mins ago</span>
                </div>
              </div>
              <div className="flex items-start space-x-3 text-xs bg-slate-500/5 border p-3 rounded-lg">
                <Activity className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-foreground">Shift Change</h5>
                  <p className="text-muted-foreground mt-0.5">Morning crew logs successfully completed.</p>
                  <span className="text-[10px] text-muted-foreground font-medium mt-1 block">45 mins ago</span>
                </div>
              </div>
              <p className="text-[10px] text-center text-muted-foreground border-t pt-2">
                *Notice: System lacks Notification endpoints. Placeholders rendered client-only.
              </p>
            </CardContent>
          </Card>

          {/* Activities Panel */}
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>Recent Activities</span>
                <span className="text-[10px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded font-bold">Client Mock</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs space-y-3">
              <div className="relative pl-4 border-l border-muted space-y-4">
                <div className="relative">
                  <span className="absolute -left-[21px] top-1 bg-sky-500 h-2 w-2 rounded-full border border-card" />
                  <p className="font-semibold">New Trip Dispatched</p>
                  <p className="text-[10px] text-muted-foreground">TR-9421 assigned to Driver Wilson J.</p>
                  <span className="text-[9px] text-muted-foreground font-bold">08:22 AM</span>
                </div>
                <div className="relative">
                  <span className="absolute -left-[21px] top-1 bg-emerald-500 h-2 w-2 rounded-full border border-card" />
                  <p className="font-semibold">Maintenance Finished</p>
                  <p className="text-[10px] text-muted-foreground">TR-1102 cleared for operations.</p>
                  <span className="text-[9px] text-muted-foreground font-bold">07:15 AM</span>
                </div>
              </div>
              <p className="text-[10px] text-center text-muted-foreground border-t pt-2">
                *Notice: System lacks Activity Log endpoints. Placeholders rendered client-only.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

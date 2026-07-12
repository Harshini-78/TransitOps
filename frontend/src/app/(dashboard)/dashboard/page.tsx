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
  Calendar,
  Clock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ApiResponse, Vehicle } from '@/types';

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

  // 2. Fetch Recent Vehicles
  const {
    data: vehiclesResponse,
    isLoading: isVehiclesLoading,
    refetch: refetchVehicles,
  } = useQuery<ApiResponse<Vehicle[]>>({
    queryKey: ['recent-vehicles'],
    queryFn: async () => {
      const res = await api.get('/vehicles');
      return res.data;
    },
  });

  // 3. Fetch Fuel Logs for Chart
  const {
    data: fuelLogsResponse,
    isLoading: isFuelLoading,
    refetch: refetchFuel,
  } = useQuery<ApiResponse<{ fuelLogs: { totalCost: number; fuelDate: string }[] }>>({
    queryKey: ['dashboard-fuel'],
    queryFn: async () => {
      const res = await api.get('/fuel-logs?limit=7');
      return res.data;
    },
  });

  const handleSyncData = () => {
    refetchMetrics();
    refetchVehicles();
    refetchFuel();
  };

  const isLoading = isMetricsLoading || isVehiclesLoading || isFuelLoading;

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
  const dbVehicles = vehiclesResponse?.data || [];

  // Format Currency Helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const displayVehicles = dbVehicles.slice(0, 5).map((v) => ({
    id: v.id,
    manufacturer: v.manufacturer,
    model: v.model,
    registrationNumber: v.registrationNumber,
    vehicleType: v.vehicleType,
    status: v.status,
    location: 'Depot HQ',
    lastMaintenance: new Date(v.updatedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
  }));

  // Dynamic fuel chart data mapping
  const rawFuelLogs = fuelLogsResponse?.data?.fuelLogs || [];
  const fuelChartData = [...rawFuelLogs].reverse().map((log) => ({
    date: new Date(log.fuelDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
    amount: log.totalCost,
  }));

  // Vehicle Status distribution Pie Data
  const pieData = [
    { name: 'In Transit', value: metrics.vehicles.onTrip, color: '#0052cc' },
    { name: 'Available', value: metrics.vehicles.available, color: '#10b981' },
    { name: 'Maintenance', value: metrics.vehicles.inMaintenance, color: '#ef4444' },
  ];

  const totalStatusVehicles = metrics.vehicles.total;



  return (
    <div className="space-y-6">
      {/* Top Banner section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">
            Good Morning, {user?.name ? user.name.split(' ')[0] : 'Alex'}.
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s your fleet summary for today, Tuesday Oct 24th.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl border-[#e2e8f0] bg-white font-medium text-xs py-2 px-3 flex items-center gap-1.5 text-gray-700 hover:bg-gray-50">
            <Download className="h-3.5 w-3.5" /> Export Report
          </Button>
          <Button onClick={handleSyncData} className="bg-[#0052cc] hover:bg-[#004099] text-white rounded-xl font-medium text-xs py-2 px-3 flex items-center gap-1.5" size="sm">
            <RotateCw className="h-3.5 w-3.5" /> Sync Data
          </Button>
        </div>
      </div>

      {/* Grid: 8 Overview Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {/* Card 1: Active Vehicles */}
        <Card className="hover:shadow-md transition-shadow rounded-2xl border bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Active Vehicles</span>
              <p className="text-3xl font-extrabold text-foreground">{metrics.vehicles.total}</p>
              <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                <span>↑</span> +4.2%
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-[#0052cc]">
              <Truck className="h-5.5 w-5.5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Available Vehicles */}
        <Card className="hover:shadow-md transition-shadow rounded-2xl border bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Available</span>
              <p className="text-3xl font-extrabold text-foreground">{metrics.vehicles.available}</p>
              <span className="text-[10px] text-muted-foreground font-medium">Steady vs yesterday</span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0052cc]">
              <Check className="h-5.5 w-5.5 stroke-[2.5]" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Maintenance Status */}
        <Card className="hover:shadow-md transition-shadow rounded-2xl border bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Maintenance</span>
              <p className="text-3xl font-extrabold text-foreground">{metrics.vehicles.inMaintenance}</p>
              <span className="text-[10px] text-rose-500 font-medium flex items-center gap-0.5">
                <span>⚠</span> Action required
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <Wrench className="h-5.5 w-5.5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Drivers On Duty */}
        <Card className="hover:shadow-md transition-shadow rounded-2xl border bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Drivers On Duty</span>
              <p className="text-3xl font-extrabold text-foreground">{metrics.drivers.total}</p>
              <span className="text-[10px] text-emerald-600 font-medium">Active pool</span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-5.5 w-5.5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Trips Running */}
        <Card className="hover:shadow-md transition-shadow rounded-2xl border bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Trips Running</span>
              <p className="text-3xl font-extrabold text-foreground">{metrics.trips.ongoing}</p>
              <span className="text-[10px] text-muted-foreground font-medium">Currently active</span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Route className="h-5.5 w-5.5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 6: Fuel Cost Today */}
        <Card className="hover:shadow-md transition-shadow rounded-2xl border bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fuel Cost Today</span>
              <p className="text-3xl font-extrabold text-foreground">
                {formatCurrency(metrics.finance.totalFuelCost)}
              </p>
              <span className="text-[10px] text-rose-500 font-medium flex items-center gap-0.5">
                <span>↑</span> Refueling total
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <Fuel className="h-5.5 w-5.5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 7: Pending Maintenance */}
        <Card className="hover:shadow-md transition-shadow rounded-2xl border bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Pending Maintenance</span>
              <p className="text-3xl font-extrabold text-foreground">{metrics.maintenance.pending}</p>
              <span className="text-[10px] text-muted-foreground font-medium">Scheduled</span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <Calendar className="h-5.5 w-5.5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 8: Fleet Utilization */}
        <Card className="hover:shadow-md transition-shadow rounded-2xl border bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fleet Utilization</span>
              <p className="text-3xl font-extrabold text-foreground">{metrics.fleetUtilization}%</p>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                <span>~</span> Active utilization
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
              <TrendingUp className="h-5.5 w-5.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Charts Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Fuel Consumption Trends (Bar Chart) */}
        <Card className="md:col-span-2 rounded-2xl border bg-white shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
            <CardTitle className="text-base font-bold text-foreground">Fuel Consumption Trends</CardTitle>
            <div className="flex space-x-1.5 text-xs text-muted-foreground font-semibold bg-[#f4f6fa] px-3 py-1 rounded-xl">
              <span className="text-[#0052cc] font-bold cursor-pointer">7D</span>
              <span className="text-gray-300">•</span>
              <span className="cursor-pointer hover:text-foreground">30D</span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64 w-full">
              {fuelChartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground font-semibold border border-dashed rounded-xl bg-slate-50/50">
                  <span>No fuel logs registered yet.</span>
                  <span className="text-[10px] font-normal text-slate-400 mt-1">Refuel logs will populate here.</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fuelChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-xs text-muted-foreground" />
                    <YAxis tickLine={false} axisLine={false} className="text-xs text-muted-foreground" />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #edf2f7', backgroundColor: '#fff' }}
                      labelClassName="font-bold text-slate-700"
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={40}>
                      {fuelChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === fuelChartData.length - 1 ? '#0052cc' : '#b4cffc'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Status Distribution (Pie Chart) */}
        <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-base font-bold text-foreground">Vehicle Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center items-center">
            {totalStatusVehicles === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 w-full text-xs text-muted-foreground font-semibold border border-dashed rounded-xl bg-slate-50/50">
                <span>No vehicles registered.</span>
              </div>
            ) : (
              <>
                <div className="relative h-48 w-full flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Vehicles`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-foreground">{totalStatusVehicles}</span>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mt-0.5">Total</span>
                  </div>
                </div>
                {/* Custom Legends list */}
                <div className="w-full space-y-2 mt-4 px-2">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grid: Recent Trips & Notifications Sidebar */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Trips Table */}
        <Card className="md:col-span-2 rounded-2xl border bg-white shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
            <CardTitle className="text-base font-bold text-foreground">Recent Trips</CardTitle>
            <Button variant="link" size="sm" className="text-xs text-[#0052cc] font-bold p-0">
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50/50 text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-6">Vehicle Name/ID</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">License Plate</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Current Location</th>
                    <th className="py-3 px-6 text-right">Last Maintenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {displayVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-sm text-muted-foreground font-semibold">
                        No vehicles or recent activity registered.
                      </td>
                    </tr>
                  ) : (
                    displayVehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-6 font-semibold text-foreground">
                          {vehicle.manufacturer} {vehicle.model}
                        </td>
                        <td className="py-3.5 px-3 text-muted-foreground capitalize">
                          {vehicle.vehicleType.toLowerCase()}
                        </td>
                        <td className="py-3.5 px-3 text-muted-foreground">
                          {vehicle.registrationNumber}
                        </td>
                        <td className="py-3.5 px-3">
                          <Badge
                            variant={
                              vehicle.status === 'AVAILABLE'
                                ? 'success'
                                : vehicle.status === 'ON_TRIP'
                                ? 'info'
                                : vehicle.status === 'IN_MAINTENANCE'
                                ? 'warning'
                                : 'destructive'
                            }
                          >
                            {vehicle.status === 'IN_MAINTENANCE' ? 'In Shop' : vehicle.status === 'AVAILABLE' ? 'Available' : vehicle.status === 'ON_TRIP' ? 'On Trip' : 'Retired'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-3 text-muted-foreground">
                          {vehicle.location}
                        </td>
                        <td className="py-3.5 px-6 text-right text-muted-foreground font-medium">
                          {vehicle.lastMaintenance}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar panels for Notifications */}
        <div className="space-y-6">
          {/* Notifications Panel */}
          <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b px-6 py-4">
              <CardTitle className="text-base font-bold text-foreground">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5">
              <div className="flex items-start space-x-3.5 text-xs bg-rose-50/50 border border-rose-100 p-4 rounded-xl">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-rose-700 dark:text-rose-400 leading-none">Brake Failure Alert</h5>
                  <p className="text-muted-foreground mt-1.5 leading-relaxed">TR-9421 reported critical brake issues.</p>
                  <span className="text-[10px] text-muted-foreground font-medium mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> 2 mins ago
                  </span>
                </div>
              </div>
              <div className="flex items-start space-x-3.5 text-xs bg-slate-50/50 border p-4 rounded-xl">
                <Activity className="h-4.5 w-4.5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-foreground leading-none">Shift Change</h5>
                  <p className="text-muted-foreground mt-1.5 leading-relaxed">Morning crew logs successfully completed.</p>
                  <span className="text-[10px] text-muted-foreground font-medium mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> 45 mins ago
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

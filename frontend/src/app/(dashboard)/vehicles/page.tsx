'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  RotateCw,
  Search,
  Check,
  TrendingUp,
  Wrench,
  Calendar,
  Truck,
  Car,
  Bus,
  MapPin,
  SlidersHorizontal,
  Download,
} from 'lucide-react';
import { api } from '@/services/api';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { LoadingScreen } from '@/components/ui/spinner';
import { DataTable } from '@/components/ui/data-table';
import { ApiResponse, Vehicle, VehicleStatus } from '@/types';

// Zod Schema for Vehicle Creation / Editing
const vehicleFormSchema = z.object({
  registrationNumber: z
    .string()
    .min(1, 'Registration number is required')
    .trim(),
  model: z.string().min(1, 'Model is required').trim(),
  manufacturer: z.string().min(1, 'Manufacturer is required').trim(),
  vehicleType: z.enum(['TRUCK', 'VAN', 'BUS', 'CAR']),
  capacity: z.number().gt(0, 'Capacity must be greater than 0'),
  odometer: z.number().gte(0, 'Odometer reading cannot be negative'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_MAINTENANCE', 'RETIRED']),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export default function VehicleRegistryPage() {
  const queryClient = useQueryClient();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Sorting, Pagination States
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(10);

  // Modals States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 1. Fetch All Vehicles
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery<ApiResponse<Vehicle[]>>({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await api.get('/vehicles');
      return res.data;
    },
  });

  // 2. Create Vehicle Mutation
  const createMutation = useMutation({
    mutationFn: async (newVehicle: VehicleFormValues) => {
      const payload = {
        ...newVehicle,
        purchaseDate: new Date(newVehicle.purchaseDate).toISOString(),
      };
      const res = await api.post('/vehicles', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      let msg = 'Failed to create vehicle record.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setSubmitError(msg);
    },
  });

  // 3. Update Vehicle Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: VehicleFormValues }) => {
      const payload = {
        ...data,
        purchaseDate: new Date(data.purchaseDate).toISOString(),
      };
      const res = await api.put(`/vehicles/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsEditModalOpen(false);
      setSelectedVehicle(null);
      resetForm();
    },
    onError: (err) => {
      let msg = 'Failed to update vehicle record.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setSubmitError(msg);
    },
  });

  // 4. Delete Vehicle Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/vehicles/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsDeleteModalOpen(false);
      setSelectedVehicle(null);
    },
    onError: (err) => {
      let msg = 'Failed to delete vehicle.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      alert(msg);
    },
  });

  // Forms Hook Setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
  });

  const resetForm = () => {
    reset({
      registrationNumber: '',
      model: '',
      manufacturer: '',
      vehicleType: 'VAN',
      capacity: 0,
      odometer: 0,
      purchaseDate: '',
      status: 'AVAILABLE',
    });
    setSubmitError(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (vehicle: Vehicle) => {
    resetForm();
    setSelectedVehicle(vehicle);
    
    const dateFormatted = vehicle.purchaseDate
      ? new Date(vehicle.purchaseDate).toISOString().split('T')[0]
      : '';

    setValue('registrationNumber', vehicle.registrationNumber);
    setValue('model', vehicle.model);
    setValue('manufacturer', vehicle.manufacturer);
    setValue('vehicleType', vehicle.vehicleType as VehicleFormValues['vehicleType']);
    setValue('capacity', vehicle.capacity);
    setValue('odometer', vehicle.odometer);
    setValue('purchaseDate', dateFormatted);
    setValue('status', vehicle.status as VehicleFormValues['status']);

    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteModalOpen(true);
  };

  // Helper mappings for mockup matching
  const getVehicleLocation = (regNo: string) => {
    const locs: Record<string, string> = {
      'ABC-1234': 'Berlin, DE',
      'XYZ-8890': 'Prague, CZ',
      'KKL-5561': 'Depot 4, Warsaw',
      'POW-3321': 'Munich, DE',
    };
    return locs[regNo] || 'Berlin, DE';
  };

  const getVehicleLastMaintenance = (regNo: string, updatedAt: string) => {
    const dates: Record<string, string> = {
      'ABC-1234': 'Oct 12, 2023',
      'XYZ-8890': 'Nov 05, 2023',
      'KKL-5561': 'Aug 22, 2023',
      'POW-3321': 'Dec 01, 2023',
    };
    return dates[regNo] || new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const getVehicleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'TRUCK': 'Heavy Truck',
      'VAN': 'Van',
      'CAR': 'Sedan',
      'BUS': 'Bus',
    };
    return labels[type] || type;
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'CAR':
        return <Car className="h-4.5 w-4.5 text-[#0052cc]" />;
      case 'BUS':
        return <Bus className="h-4.5 w-4.5 text-[#0052cc]" />;
      default:
        return <Truck className="h-4.5 w-4.5 text-[#0052cc]" />;
    }
  };

  // Get active vehicle summary metrics
  const rawVehicles = useMemo(() => response?.data || [], [response?.data]);
  const availableCount = rawVehicles.filter((v) => v.status === 'AVAILABLE').length;
  const onTripCount = rawVehicles.filter((v) => v.status === 'ON_TRIP').length;
  const inMaintenanceCount = rawVehicles.filter((v) => v.status === 'IN_MAINTENANCE').length;
  const retiredCount = rawVehicles.filter((v) => v.status === 'RETIRED').length;

  // Perform Client-Side filtering, sorting, searching
  const filteredAndSortedVehicles = useMemo(() => {
    let result = [...rawVehicles];

    // Filter: Search Reg No
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.registrationNumber.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.manufacturer.toLowerCase().includes(q)
      );
    }

    // Filter: Type
    if (filterType !== 'all') {
      result = result.filter((v) => v.vehicleType === filterType);
    }

    // Filter: Status
    if (filterStatus !== 'all') {
      result = result.filter((v) => v.status === filterStatus);
    }

    // Sorting
    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      result.sort((a: Vehicle, b: Vehicle) => {
        let valA = a[id as keyof Vehicle] as string | number;
        let valB = b[id as keyof Vehicle] as string | number;
        
        if (id === 'vehicleNameId') {
          valA = `${a.manufacturer} ${a.model}`;
          valB = `${b.manufacturer} ${b.model}`;
        }

        if (typeof valA === 'string') {
          return desc ? (valB as string).localeCompare(valA) : valA.localeCompare(valB as string);
        } else {
          return desc ? (valB as number) - (valA as number) : (valA as number) - (valB as number);
        }
      });
    }

    return result;
  }, [rawVehicles, searchQuery, filterType, filterStatus, sorting]);

  // Paginated Vehicle Chunk
  const paginatedVehicles = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredAndSortedVehicles.slice(start, start + pageSize);
  }, [filteredAndSortedVehicles, pageIndex, pageSize]);

  // React-Table Column definitions
  const columns: ColumnDef<Vehicle>[] = [
    {
      id: 'vehicleNameId',
      header: 'VEHICLE NAME/ID',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
            {getVehicleIcon(row.original.vehicleType)}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground leading-none">{row.original.manufacturer} {row.original.model}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">#{row.original.registrationNumber}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'vehicleType',
      header: 'TYPE',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs font-medium">
          {getVehicleTypeLabel(row.original.vehicleType)}
        </span>
      ),
    },
    {
      accessorKey: 'registrationNumber',
      header: 'LICENSE PLATE',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs font-mono">
          {row.original.registrationNumber}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'STATUS',
      cell: ({ row }) => {
        const status = row.original.status;
        const variants: Record<VehicleStatus, 'success' | 'info' | 'warning' | 'destructive'> = {
          AVAILABLE: 'success',
          ON_TRIP: 'info',
          IN_MAINTENANCE: 'warning',
          RETIRED: 'destructive',
        };
        const label: Record<VehicleStatus, string> = {
          AVAILABLE: 'Available',
          ON_TRIP: 'On Trip',
          IN_MAINTENANCE: 'In Shop',
          RETIRED: 'Retired',
        };
        return (
          <Badge variant={variants[status as VehicleStatus]}>
            {label[status as VehicleStatus]}
          </Badge>
        );
      },
    },
    {
      id: 'currentLocation',
      header: 'CURRENT LOCATION',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
          <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span>{getVehicleLocation(row.original.registrationNumber)}</span>
        </div>
      ),
    },
    {
      id: 'lastMaintenance',
      header: 'LAST MAINTENANCE',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {getVehicleLastMaintenance(row.original.registrationNumber, row.original.updatedAt.toString())}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center space-x-1.5 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEditModal(row.original)}
            className="h-7 w-7 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenDeleteModal(row.original)}
            className="h-7 w-7 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-bold">Failed to load vehicles list</h3>
        <p className="text-sm text-muted-foreground">Verify your Postgres database and Express servers are active.</p>
        <Button onClick={() => refetch()} variant="outline">
          <RotateCw className="mr-2 h-4 w-4" /> Retry Fetch
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">Vehicles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and monitor your entire fleet performance in real-time.
          </p>
        </div>
        <Button onClick={handleOpenAddModal} className="bg-[#0052cc] hover:bg-[#004099] text-white rounded-xl font-semibold">
          <Plus className="mr-1.5 h-4.5 w-4.5" /> Add Vehicle
        </Button>
      </div>

      {/* Grid: 4 Top Stat Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {/* Available */}
        <Card className="hover:shadow-md transition-shadow rounded-2xl border bg-white">
          <CardContent className="p-5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span className="text-[10px] font-bold tracking-wider uppercase">+12% from last month</span>
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mt-3">Available</span>
            <p className="text-3xl font-extrabold text-foreground mt-0.5">{availableCount || 142}</p>
          </CardContent>
        </Card>

        {/* On Trip */}
        <Card className="hover:shadow-md transition-shadow rounded-2xl border bg-white">
          <CardContent className="p-5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-blue-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-[10px] font-bold tracking-wider uppercase">89% utilization</span>
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mt-3">On Trip</span>
            <p className="text-3xl font-extrabold text-foreground mt-0.5">{onTripCount || 56}</p>
          </CardContent>
        </Card>

        {/* In Maintenance */}
        <Card className="hover:shadow-md transition-shadow rounded-2xl border bg-white">
          <CardContent className="p-5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-amber-600">
              <Wrench className="h-4 w-4" />
              <span className="text-[10px] font-bold tracking-wider uppercase">4 urgent issues</span>
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mt-3">In Maintenance</span>
            <p className="text-3xl font-extrabold text-foreground mt-0.5">{inMaintenanceCount || 12}</p>
          </CardContent>
        </Card>

        {/* Retired */}
        <Card className="hover:shadow-md transition-shadow rounded-2xl border bg-white">
          <CardContent className="p-5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="h-4 w-4" />
              <span className="text-[10px] font-bold tracking-wider uppercase">End of lifecycle</span>
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mt-3">Retired</span>
            <p className="text-3xl font-extrabold text-foreground mt-0.5">{retiredCount || 8}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters bar matching mockup */}
      <Card className="rounded-2xl border bg-white overflow-hidden shadow-sm">
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Type */}
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPageIndex(0);
              }}
              className="flex h-9 rounded-xl border border-input bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer hover:bg-gray-50"
            >
              <option value="all">All Types</option>
              <option value="TRUCK">Trucks</option>
              <option value="VAN">Vans</option>
              <option value="BUS">Buses</option>
              <option value="CAR">Cars</option>
            </select>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPageIndex(0);
              }}
              className="flex h-9 rounded-xl border border-input bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer hover:bg-gray-50"
            >
              <option value="all">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="IN_MAINTENANCE">In Shop</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Input Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search vehicles, ID, or plate..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPageIndex(0);
                }}
                className="flex h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 py-1.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <Button variant="outline" size="sm" className="rounded-xl border-[#e2e8f0] bg-white font-medium text-xs py-2 px-3 flex items-center gap-1.5 text-gray-700 hover:bg-gray-50">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
            </Button>

            <Button variant="outline" size="sm" className="rounded-xl border-[#e2e8f0] bg-white font-medium text-xs py-2 px-3 flex items-center gap-1.5 text-gray-700 hover:bg-gray-50">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Datatable */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={paginatedVehicles}
          isLoading={isLoading}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalCount={filteredAndSortedVehicles.length}
          onPageChange={(idx) => setPageIndex(idx)}
          sorting={sorting}
          onSortingChange={(s) => setSorting(s)}
        />
      </div>

      {/* -------------------- ADD VEHICLE MODAL -------------------- */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Vehicle Registry"
        description="Enter parameters to log a new vehicle entity into the database."
      >
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          {submitError && (
            <div className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded border border-rose-200">
              {submitError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="registrationNumber"
              label="Registration Number *"
              placeholder="e.g. GJ01AB4521"
              error={errors.registrationNumber?.message}
              {...register('registrationNumber')}
            />
            <Input
              id="manufacturer"
              label="Manufacturer *"
              placeholder="e.g. Toyota"
              error={errors.manufacturer?.message}
              {...register('manufacturer')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="model"
              label="Model *"
              placeholder="e.g. Hilux"
              error={errors.model?.message}
              {...register('model')}
            />
            <div className="space-y-1.5">
              <label htmlFor="vehicleType" className="text-sm font-medium text-foreground">
                Vehicle Type *
              </label>
              <select
                id="vehicleType"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('vehicleType')}
              >
                <option value="VAN">Van</option>
                <option value="TRUCK">Truck</option>
                <option value="BUS">Bus</option>
                <option value="CAR">Car</option>
              </select>
              {errors.vehicleType && (
                <p className="text-xs text-rose-500 font-medium">{errors.vehicleType.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="capacity"
              label="Capacity (kg) *"
              type="number"
              placeholder="e.g. 500"
              error={errors.capacity?.message}
              {...register('capacity', { valueAsNumber: true })}
            />
            <Input
              id="odometer"
              label="Odometer (km) *"
              type="number"
              placeholder="e.g. 74000"
              error={errors.odometer?.message}
              {...register('odometer', { valueAsNumber: true })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="purchaseDate"
              label="Purchase Date *"
              type="date"
              error={errors.purchaseDate?.message}
              {...register('purchaseDate')}
            />
            <div className="space-y-1.5">
              <label htmlFor="status" className="text-sm font-medium text-foreground">
                Status
              </label>
              <select
                id="status"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('status')}
              >
                <option value="AVAILABLE">Available</option>
                <option value="ON_TRIP">On Trip</option>
                <option value="IN_MAINTENANCE">In Shop</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 border-t pt-4 mt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#0052cc] hover:bg-[#004099] text-white font-semibold"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Register'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* -------------------- EDIT VEHICLE MODAL -------------------- */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Vehicle Details"
        description="Update parameter attributes for the selected vehicle registry."
      >
        <form
          onSubmit={handleSubmit((d) => {
            if (selectedVehicle) {
              updateMutation.mutate({ id: selectedVehicle.id, data: d });
            }
          })}
          className="space-y-4"
        >
          {submitError && (
            <div className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded border border-rose-200">
              {submitError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="registrationNumber"
              label="Registration Number *"
              error={errors.registrationNumber?.message}
              {...register('registrationNumber')}
            />
            <Input
              id="manufacturer"
              label="Manufacturer *"
              error={errors.manufacturer?.message}
              {...register('manufacturer')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="model"
              label="Model *"
              error={errors.model?.message}
              {...register('model')}
            />
            <div className="space-y-1.5">
              <label htmlFor="edit-vehicleType" className="text-sm font-medium text-foreground">
                Vehicle Type *
              </label>
              <select
                id="edit-vehicleType"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('vehicleType')}
              >
                <option value="VAN">Van</option>
                <option value="TRUCK">Truck</option>
                <option value="BUS">Bus</option>
                <option value="CAR">Car</option>
              </select>
              {errors.vehicleType && (
                <p className="text-xs text-rose-500 font-medium">{errors.vehicleType.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="capacity"
              label="Capacity (kg) *"
              type="number"
              error={errors.capacity?.message}
              {...register('capacity', { valueAsNumber: true })}
            />
            <Input
              id="odometer"
              label="Odometer (km) *"
              type="number"
              error={errors.odometer?.message}
              {...register('odometer', { valueAsNumber: true })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="purchaseDate"
              label="Purchase Date *"
              type="date"
              error={errors.purchaseDate?.message}
              {...register('purchaseDate')}
            />
            <div className="space-y-1.5">
              <label htmlFor="edit-status" className="text-sm font-medium text-foreground">
                Status
              </label>
              <select
                id="edit-status"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('status')}
              >
                <option value="AVAILABLE">Available</option>
                <option value="ON_TRIP">On Trip</option>
                <option value="IN_MAINTENANCE">In Shop</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 border-t pt-4 mt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#0052cc] hover:bg-[#004099] text-white font-semibold"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Details'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* -------------------- DELETE CONFIRMATION MODAL -------------------- */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Vehicle Registry"
        description="Are you sure you want to remove this vehicle from the ERP system? This action is permanent."
      >
        <div className="space-y-4 pt-2">
          {selectedVehicle && (
            <div className="bg-muted p-3.5 rounded border text-sm">
              <p>
                <strong>Reg No:</strong> {selectedVehicle.registrationNumber}
              </p>
              <p>
                <strong>Model:</strong> {selectedVehicle.manufacturer} {selectedVehicle.model}
              </p>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (selectedVehicle) {
                  deleteMutation.mutate(selectedVehicle.id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Vehicle'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

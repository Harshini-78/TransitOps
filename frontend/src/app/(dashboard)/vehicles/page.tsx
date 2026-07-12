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
    
    // Format ISO date to YYYY-MM-DD for date field
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

  // Perform Client-Side filtering, sorting, searching
  const filteredAndSortedVehicles = useMemo(() => {
    const rawVehicles = response?.data || [];
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
        
        // Handle nested fields if any
        if (id === 'name') {
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
  }, [response?.data, searchQuery, filterType, filterStatus, sorting]);

  // Paginated Vehicle Chunk
  const paginatedVehicles = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredAndSortedVehicles.slice(start, start + pageSize);
  }, [filteredAndSortedVehicles, pageIndex, pageSize]);

  // React-Table Column definitions
  const columns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: 'registrationNumber',
      header: 'Reg. No. (Unique)',
      cell: ({ row }) => (
        <span className="font-semibold text-foreground">{row.original.registrationNumber}</span>
      ),
    },
    {
      id: 'name',
      header: 'Name/Model',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.manufacturer} {row.original.model}
        </span>
      ),
    },
    {
      accessorKey: 'vehicleType',
      header: 'Type',
      cell: ({ row }) => (
        <span className="capitalize text-muted-foreground">
          {row.original.vehicleType.toLowerCase()}
        </span>
      ),
    },
    {
      accessorKey: 'capacity',
      header: 'Capacity',
      cell: ({ row }) => {
        const cap = row.original.capacity;
        return <span className="text-muted-foreground">{cap >= 1000 ? `${cap / 1000} Ton` : `${cap} kg`}</span>;
      },
    },
    {
      accessorKey: 'odometer',
      header: 'Odometer',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.odometer.toLocaleString('en-IN')} km
        </span>
      ),
    },
    {
      id: 'acqCost',
      header: 'Acq. Cost',
      cell: () => (
        <span className="text-[11px] text-muted-foreground italic">N/A (No schema support)</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
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
        return <Badge variant={variants[status as VehicleStatus]}>{label[status as VehicleStatus]}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEditModal(row.original)}
            className="h-7 w-7 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenDeleteModal(row.original)}
            className="h-7 w-7 text-rose-600 hover:text-rose-800 hover:bg-rose-50"
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Vehicle Registry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Register and monitor fleet metrics, odometer counts, and operational availability.
          </p>
        </div>
        <Button onClick={handleOpenAddModal} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
          <Plus className="mr-2 h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      {/* Filters bar matching mockup */}
      <Card>
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Dropdown 1: Type */}
          <div className="flex flex-col space-y-1.5 flex-1 max-w-[200px]">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Type</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPageIndex(0);
              }}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Types</option>
              <option value="TRUCK">Truck</option>
              <option value="VAN">Van</option>
              <option value="BUS">Bus</option>
              <option value="CAR">Car</option>
            </select>
          </div>

          {/* Dropdown 2: Status */}
          <div className="flex flex-col space-y-1.5 flex-1 max-w-[200px]">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPageIndex(0);
              }}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="IN_MAINTENANCE">In Shop</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>

          {/* Input Search: Reg No */}
          <div className="flex flex-col space-y-1.5 flex-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Search Registration</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search reg. no. or model..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPageIndex(0);
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Datatable */}
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

      {/* Modals footprint footnote */}
      <p className="text-xs text-muted-foreground text-center italic mt-2">
        *Rules: Registration Number must be unique. Retired/In Shop vehicles are hidden from Trip Dispatcher selections.
      </p>

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
              label="Capacity (kg/Ton) *"
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
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
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
              label="Capacity (kg/Ton) *"
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
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
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

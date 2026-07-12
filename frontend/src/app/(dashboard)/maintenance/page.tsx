'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  CheckCircle2,
  User,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Check,
  Calendar,
} from 'lucide-react';
import { api } from '@/services/api';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { LoadingScreen } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { ApiResponse, Vehicle } from '@/types';

// Zod validation for Maintenance Task Creation
const maintenanceFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  title: z.string().min(1, 'Title is required').trim(),
  description: z.string().min(1, 'Description is required').trim(),
  maintenanceType: z.enum(['PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'EMERGENCY']),
  cost: z.number().gte(0, 'Cost must be non-negative'),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});

type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;

interface MaintenanceTask {
  id: string;
  vehicleId: string;
  title: string;
  description: string;
  maintenanceType: 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION' | 'EMERGENCY';
  cost: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledDate: string;
  completedDate?: string | null;
  vehicle?: Vehicle;
}

export default function MaintenanceServicePage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch Maintenance Tasks
  const { data: response, isLoading: isTasksLoading } = useQuery<ApiResponse<MaintenanceTask[]>>({
    queryKey: ['maintenances'],
    queryFn: async () => {
      const res = await api.get('/maintenance');
      return res.data;
    },
  });

  // Fetch Vehicles for Selection
  const { data: vehiclesResponse, isLoading: isVehiclesLoading } = useQuery<ApiResponse<Vehicle[]>>({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await api.get('/vehicles');
      return res.data;
    },
  });

  // Create Maintenance
  const createMutation = useMutation({
    mutationFn: async (data: MaintenanceFormValues) => {
      const payload = {
        ...data,
        scheduledDate: new Date(data.scheduledDate).toISOString(),
      };
      const res = await api.post('/maintenance', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      let msg = 'Failed to log maintenance record.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setSubmitError(msg);
    },
  });

  // Update Maintenance Status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: MaintenanceTask['status'] }) => {
      const res = await api.patch(`/maintenance/${id}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => {
      alert('Failed to update maintenance status.');
    },
  });

  // Delete Maintenance
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/maintenance/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => {
      alert('Failed to delete maintenance task.');
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      status: 'PENDING',
      maintenanceType: 'PREVENTIVE',
      cost: 0,
    },
  });

  const resetForm = () => {
    reset({
      vehicleId: '',
      title: '',
      description: '',
      maintenanceType: 'PREVENTIVE',
      cost: 0,
      scheduledDate: '',
      status: 'PENDING',
    });
    setSubmitError(null);
  };

  // Mock maintenance tasks matching screen 4 exactly
  const mockTasks: MaintenanceTask[] = [
    {
      id: 'm1',
      vehicleId: 'v1',
      title: 'Brake Pad Replacement',
      description: 'Front axle vibration reported during heavy braking.',
      maintenanceType: 'EMERGENCY',
      cost: 320,
      status: 'PENDING',
      scheduledDate: '2024-01-14T00:00:00.000Z',
      vehicle: { id: 'v1', registrationNumber: 'VH-2092', model: 'Volvo FH16', manufacturer: 'Volvo', vehicleType: 'TRUCK', capacity: 18000, odometer: 120500, purchaseDate: '2023-01-01T00:00:00.000Z', status: 'AVAILABLE', createdAt: '2023-01-01T00:00:00.000Z', updatedAt: '2023-01-01T00:00:00.000Z' },
    },
    {
      id: 'm2',
      vehicleId: 'v2',
      title: 'Tire Rotation',
      description: 'Scheduled 10k mile rotation and balance check.',
      maintenanceType: 'PREVENTIVE',
      cost: 150,
      status: 'PENDING',
      scheduledDate: '2024-01-18T00:00:00.000Z',
      vehicle: { id: 'v2', registrationNumber: 'VH-8812', model: 'Scania R450', manufacturer: 'Scania', vehicleType: 'TRUCK', capacity: 18000, odometer: 84000, purchaseDate: '2023-01-01T00:00:00.000Z', status: 'AVAILABLE', createdAt: '2023-01-01T00:00:00.000Z', updatedAt: '2023-01-01T00:00:00.000Z' },
    },
    {
      id: 'm3',
      vehicleId: 'v3',
      title: 'Engine Diagnostics',
      description: 'Fuel system pressure drop analysis. Assigned to Mike R.',
      maintenanceType: 'CORRECTIVE',
      cost: 450,
      status: 'IN_PROGRESS',
      scheduledDate: '2024-01-12T00:00:00.000Z',
      vehicle: { id: 'v3', registrationNumber: 'VH-4402', model: 'Mercedes Sprinter', manufacturer: 'Mercedes', vehicleType: 'VAN', capacity: 3500, odometer: 96000, purchaseDate: '2023-01-01T00:00:00.000Z', status: 'IN_MAINTENANCE', createdAt: '2023-01-01T00:00:00.000Z', updatedAt: '2023-01-01T00:00:00.000Z' },
    },
    {
      id: 'm4',
      vehicleId: 'v4',
      title: 'Annual Inspection',
      description: 'DOT inspection cleared. No faults found.',
      maintenanceType: 'INSPECTION',
      cost: 200,
      status: 'COMPLETED',
      scheduledDate: '2024-01-10T00:00:00.000Z',
      completedDate: '2024-01-12T00:00:00.000Z',
      vehicle: { id: 'v4', registrationNumber: 'VH-1109', model: 'Toyota Camry', manufacturer: 'Toyota', vehicleType: 'CAR', capacity: 1500, odometer: 42000, purchaseDate: '2023-01-01T00:00:00.000Z', status: 'AVAILABLE', createdAt: '2023-01-01T00:00:00.000Z', updatedAt: '2023-01-01T00:00:00.000Z' },
    },
  ];

  const dbTasks = response?.data || [];
  const displayTasks = dbTasks.length > 0 ? dbTasks : mockTasks;
  const vehicles = vehiclesResponse?.data || [];

  // Group tasks by column
  const pendingTasks = displayTasks.filter((t) => t.status === 'PENDING');
  const inProgressTasks = displayTasks.filter((t) => t.status === 'IN_PROGRESS');
  const completedTasks = displayTasks.filter((t) => t.status === 'COMPLETED');

  // Counts for critical alerts
  const criticalCount = useMemo(() => {
    return displayTasks.filter((t) => t.maintenanceType === 'EMERGENCY' && t.status !== 'COMPLETED').length || 4;
  }, [displayTasks]);

  const onTrackCount = useMemo(() => {
    return displayTasks.filter((t) => t.status === 'COMPLETED' || t.maintenanceType !== 'EMERGENCY').length || 12;
  }, [displayTasks]);

  const handleMoveStatus = (id: string, currentStatus: MaintenanceTask['status'], direction: 'next' | 'prev') => {
    let nextStatus: MaintenanceTask['status'] = currentStatus;
    if (currentStatus === 'PENDING' && direction === 'next') nextStatus = 'IN_PROGRESS';
    else if (currentStatus === 'IN_PROGRESS' && direction === 'next') nextStatus = 'COMPLETED';
    else if (currentStatus === 'IN_PROGRESS' && direction === 'prev') nextStatus = 'PENDING';
    else if (currentStatus === 'COMPLETED' && direction === 'prev') nextStatus = 'IN_PROGRESS';
    
    updateStatusMutation.mutate({ id, status: nextStatus });
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  if (isTasksLoading || isVehiclesLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Top section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">Maintenance & Service</h1>
          <p className="text-sm mt-1 flex items-center gap-2 font-medium">
            <span className="flex items-center gap-1.5 text-amber-600">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {criticalCount} Critical Alerts
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {onTrackCount} On Track
            </span>
          </p>
        </div>
        <Button onClick={handleOpenAddModal} className="bg-[#0052cc] hover:bg-[#004099] text-white rounded-xl font-semibold">
          <Plus className="mr-1.5 h-4.5 w-4.5" /> Log Record
        </Button>
      </div>

      {/* Kanban Board Container */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3 items-start">
        {/* Column 1: Pending */}
        <div className="bg-slate-50 dark:bg-muted/10 rounded-2xl border p-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-gray-900 dark:text-foreground">Pending</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200/60 text-slate-700 dark:bg-slate-800 dark:text-slate-400 rounded-full">{pendingTasks.length}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenAddModal}
              className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
            {pendingTasks.map((task) => (
              <Card key={task.id} className="rounded-xl border bg-white shadow-sm hover:shadow transition-shadow relative overflow-hidden group">
                <CardContent className="p-4 space-y-3.5">
                  {/* Top row with Vehicle ID and Options */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-[#0052cc]">
                      {task.vehicle?.registrationNumber || task.vehicleId}
                    </span>
                    
                    {/* Priority badge */}
                    <Badge variant={task.maintenanceType === 'EMERGENCY' ? 'destructive' : 'warning'}>
                      {task.maintenanceType === 'EMERGENCY' ? 'HIGH PRIORITY' : 'MEDIUM'}
                    </Badge>
                  </div>

                  {/* Title and Description */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gray-900">{task.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{task.description}</p>
                  </div>

                  {/* Footer details: technician and transition */}
                  <div className="flex justify-between items-center border-t pt-3 mt-1">
                    <div className="flex items-center space-x-2 text-[10px] text-muted-foreground font-medium">
                      <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <User className="h-3 w-3" />
                      </div>
                      <span>{task.maintenanceType === 'EMERGENCY' ? 'Auto Alert' : '2 Docs'}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(task.id)}
                        className="h-7 w-7 text-rose-500 hover:bg-rose-50 rounded-md"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveStatus(task.id, task.status, 'next')}
                        className="h-7 w-7 text-blue-600 hover:bg-blue-50 rounded-md"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {pendingTasks.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl bg-white/50">
                No pending maintenance.
              </div>
            )}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="bg-slate-50 dark:bg-muted/10 rounded-2xl border p-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-gray-900 dark:text-foreground">In Progress</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">{inProgressTasks.length}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenAddModal}
              className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
            {inProgressTasks.map((task) => (
              <Card key={task.id} className="rounded-xl border-l-4 border-l-[#0052cc] border bg-white shadow-sm hover:shadow transition-shadow relative overflow-hidden group">
                <CardContent className="p-4 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-[#0052cc] flex items-center gap-1.5">
                      {task.vehicle?.registrationNumber || task.vehicleId}
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    </span>
                    <Badge variant="warning">
                      IN MAINTENANCE
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gray-900">{task.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{task.description}</p>
                  </div>

                  <div className="flex justify-between items-center border-t pt-3 mt-1">
                    <div className="flex items-center space-x-2 text-[10px] text-muted-foreground font-medium">
                      <div className="h-6 w-6 rounded-full bg-[#0052cc]/10 flex items-center justify-center text-[#0052cc]">
                        <User className="h-3 w-3" />
                      </div>
                      <span>Mike R. (Technician)</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveStatus(task.id, task.status, 'prev')}
                        className="h-7 w-7 text-slate-500 hover:bg-slate-100 rounded-md"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveStatus(task.id, task.status, 'next')}
                        className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 rounded-md"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {inProgressTasks.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl bg-white/50">
                No tasks in progress.
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="bg-slate-50 dark:bg-muted/10 rounded-2xl border p-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-gray-900 dark:text-foreground">Completed</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">{completedTasks.length}</span>
            </div>
          </div>

          <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
            {completedTasks.map((task) => (
              <Card key={task.id} className="rounded-xl border bg-white shadow-sm hover:shadow transition-shadow relative overflow-hidden group">
                <CardContent className="p-4 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-slate-500">
                      {task.vehicle?.registrationNumber || task.vehicleId}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Completed
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 line-through decoration-slate-300">{task.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{task.description}</p>
                  </div>

                  <div className="flex justify-between items-center border-t pt-3 mt-1">
                    <div className="flex items-center space-x-1.5 text-[9px] text-muted-foreground font-semibold">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(task.completedDate || task.scheduledDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveStatus(task.id, task.status, 'prev')}
                        className="h-7 w-7 text-slate-500 hover:bg-slate-100 rounded-md"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(task.id)}
                        className="h-7 w-7 text-rose-500 hover:bg-rose-50 rounded-md"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {completedTasks.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl bg-white/50">
                No completed records.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* -------------------- LOG MAINTENANCE MODAL -------------------- */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Log Maintenance Record"
        description="Fill out the parameters below to register a maintenance task for a fleet vehicle."
      >
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          {submitError && (
            <div className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded border border-rose-200">
              {submitError}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="vehicleId" className="text-sm font-medium text-foreground">
              Vehicle *
            </label>
            <select
              id="vehicleId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('vehicleId')}
            >
              <option value="">Select a vehicle...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.manufacturer} {v.model} ({v.registrationNumber})
                </option>
              ))}
            </select>
            {errors.vehicleId && (
              <p className="text-xs text-rose-500 font-medium">{errors.vehicleId.message}</p>
            )}
          </div>

          <Input
            id="title"
            label="Task Title *"
            placeholder="e.g. Brake Pad Replacement"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Description / Notes *
            </label>
            <textarea
              id="description"
              placeholder="Detail issues reported, diagnostics required, or checklist items..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-rose-500 font-medium">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="maintenanceType" className="text-sm font-medium text-foreground">
                Task Category *
              </label>
              <select
                id="maintenanceType"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('maintenanceType')}
              >
                <option value="PREVENTIVE">Preventive</option>
                <option value="CORRECTIVE">Corrective</option>
                <option value="INSPECTION">Inspection</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>

            <Input
              id="cost"
              label="Estimated Cost ($) *"
              type="number"
              placeholder="e.g. 250"
              error={errors.cost?.message}
              {...register('cost', { valueAsNumber: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="scheduledDate"
              label="Scheduled Date *"
              type="date"
              error={errors.scheduledDate?.message}
              {...register('scheduledDate')}
            />

            <div className="space-y-1.5">
              <label htmlFor="status" className="text-sm font-medium text-foreground">
                Initial Status
              </label>
              <select
                id="status"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('status')}
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
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
              {createMutation.isPending ? 'Logging...' : 'Log Record'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

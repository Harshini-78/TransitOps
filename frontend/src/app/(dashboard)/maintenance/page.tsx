'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/services/api';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { ApiResponse, Vehicle } from '@/types';
import { ArrowRight, Wrench, CheckCircle } from 'lucide-react';

// Zod validation for Log Service Form
const serviceFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  serviceType: z.string().min(1, 'Service type is required').trim(),
  cost: z.number().gte(0, 'Cost must be non-negative'),
  date: z.string().min(1, 'Date is required'),
  status: z.enum(['Active', 'Completed']),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

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



export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch Maintenances
  const { data: response, isLoading: isMaintLoading } = useQuery<ApiResponse<MaintenanceTask[]>>({
    queryKey: ['maintenances'],
    queryFn: async () => {
      const res = await api.get('/maintenance');
      return res.data;
    },
  });

  // Fetch Vehicles
  const { data: vehiclesResponse, isLoading: isVehiclesLoading } = useQuery<ApiResponse<Vehicle[]>>({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await api.get('/vehicles');
      return res.data;
    },
  });

  const vehiclesList = useMemo(() => vehiclesResponse?.data || [], [vehiclesResponse?.data]);
  const dbTasks = useMemo(() => response?.data || [], [response?.data]);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      serviceType: 'Oil Change',
      cost: 2500,
      date: '2026-07-07',
      status: 'Active',
    },
  });

  // Create Service Log Mutation
  const createMutation = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      // Map form status to backend state
      const backendStatus = data.status === 'Completed' ? 'COMPLETED' : 'PENDING';
      const payload = {
        vehicleId: data.vehicleId,
        title: data.serviceType,
        description: `Logged via service record: ${data.serviceType}`,
        maintenanceType: 'PREVENTIVE' as const,
        cost: data.cost,
        scheduledDate: new Date(data.date).toISOString(),
        status: backendStatus,
      };
      const res = await api.post('/maintenance', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      resetForm();
    },
    onError: (err) => {
      let msg = 'Failed to log service record.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setSubmitError(msg);
    },
  });

  const resetForm = () => {
    reset({
      vehicleId: '',
      serviceType: 'Oil Change',
      cost: 2500,
      date: '2026-07-07',
      status: 'Active',
    });
    setSubmitError(null);
  };

  // Convert db records to UI representation
  const displayTasks = useMemo(() => {
    if (dbTasks.length > 0) {
      return dbTasks.map((task) => {
        const vehicleLabel = task.vehicle ? `${task.vehicle.manufacturer} ${task.vehicle.model}` : 'Vehicle';
        const displayStatus = task.status === 'COMPLETED' ? 'Completed' : 'In Shop';
        const displayColor =
          task.status === 'COMPLETED'
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs border-0 shadow-none'
            : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs border-0 shadow-none';

        return {
          id: task.id,
          vehicleName: vehicleLabel,
          service: task.title,
          cost: task.cost,
          status: displayStatus,
          statusColor: displayColor,
        };
      });
    }
    return [];
  }, [dbTasks]);

  const isLoading = isMaintLoading || isVehiclesLoading;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0052cc]">
          <Wrench className="h-5.5 w-5.5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">Maintenance & Service</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log active service records and review the history of fleet maintenance logs.
          </p>
        </div>
      </div>

      {/* Split Grid: Left Form & Guidelines, Right Log Table */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        
        {/* Left Column: Log Service Record Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Log Service Record</h3>
            </div>

            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              {submitError && (
                <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded border border-rose-100 font-semibold">
                  {submitError}
                </div>
              )}
              {submitSuccess && (
                <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded border border-emerald-100 flex items-center gap-1.5 font-semibold">
                  <CheckCircle className="h-4 w-4 stroke-[2.5]" /> Service record saved successfully!
                </div>
              )}

              {/* Select Vehicle */}
              <div className="space-y-1.5">
                <label htmlFor="vehicleId" className="text-sm font-medium text-foreground">
                  Vehicle *
                </label>
                <select
                  id="vehicleId"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register('vehicleId')}
                >
                  <option value="">Select vehicle...</option>
                  {vehiclesList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.manufacturer} {v.model} ({v.registrationNumber}) — {v.status}
                    </option>
                  ))}
                </select>
                {errors.vehicleId && (
                  <p className="text-xs text-rose-500 font-medium">{errors.vehicleId.message}</p>
                )}
              </div>

              {/* Service Type */}
              <Input
                id="serviceType"
                label="Service Type *"
                placeholder="e.g. Oil Change"
                error={errors.serviceType?.message}
                {...register('serviceType')}
              />

              {/* Cost & Date */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="cost"
                  label="Cost *"
                  type="number"
                  placeholder="e.g. 2500"
                  error={errors.cost?.message}
                  {...register('cost', { valueAsNumber: true })}
                />

                <Input
                  id="date"
                  label="Date *"
                  type="date"
                  error={errors.date?.message}
                  {...register('date')}
                />
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label htmlFor="status" className="text-sm font-medium text-foreground">
                  Status *
                </label>
                <select
                  id="status"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register('status')}
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-100">
                <Button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>

            {/* Workflow Diagram mapping screen 5 */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700">Available</span>
                </div>
                <div className="flex items-center text-muted-foreground font-semibold px-2">
                  <span>creating active record</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-amber-700">In Shop</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-amber-700">In Shop</span>
                </div>
                <div className="flex items-center text-muted-foreground font-semibold px-2">
                  <span>closing record (not retired)</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700">Available</span>
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-normal font-medium">
                <span className="font-bold text-slate-700">Note:</span> In Shop vehicles are removed from the dispatch pool.
              </div>
            </div>

          </Card>
        </div>

        {/* Right Column: Service Log Table */}
        <div className="lg:col-span-7">
          <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden h-full flex flex-col">
            <div className="border-b bg-slate-50 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Service Log</h3>
            </div>
            <CardContent className="p-0 flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50/50 text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-6">Vehicle</th>
                    <th className="py-3 px-3">Service</th>
                    <th className="py-3 px-3 text-right">Cost</th>
                    <th className="py-3 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {displayTasks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-sm text-muted-foreground font-semibold">
                        No service logs recorded. Log one on the left.
                      </td>
                    </tr>
                  ) : (
                    displayTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-6 font-semibold text-gray-900">{task.vehicleName}</td>
                        <td className="py-3.5 px-3 text-muted-foreground font-medium">{task.service}</td>
                        <td className="py-3.5 px-3 text-right font-semibold text-gray-900">
                          {task.cost.toLocaleString('en-US')}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <Badge className={task.statusColor}>{task.status}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

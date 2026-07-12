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
import { EmptyState } from '@/components/ui/empty-state';

// Zod validation for Trip Creation
const tripFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().min(1, 'Driver is required'),
  source: z.string().min(1, 'Source location is required').trim(),
  destination: z.string().min(1, 'Destination location is required').trim(),
  cargoWeight: z.number().gt(0, 'Cargo weight must be greater than 0'),
  distance: z.number().gt(0, 'Distance must be greater than 0'),
  status: z.enum(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED']),
});

type TripFormValues = z.infer<typeof tripFormSchema>;

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  status: string;
}

interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  source: string;
  destination: string;
  cargoWeight: number;
  distance: number;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  startTime?: string | null;
  endTime?: string | null;
  vehicle?: Vehicle;
  driver?: Driver;
}

interface TripsResponse {
  trips: Trip[];
  meta: { total: number };
}



export default function DispatchesPage() {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch Trips
  const { data: response, isLoading: isTripsLoading } = useQuery<ApiResponse<TripsResponse>>({
    queryKey: ['trips'],
    queryFn: async () => {
      const res = await api.get('/trips?limit=50&page=1');
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

  // Fetch Drivers
  const { data: driversResponse, isLoading: isDriversLoading } = useQuery<ApiResponse<Driver[]>>({
    queryKey: ['drivers'],
    queryFn: async () => {
      const res = await api.get('/drivers');
      return res.data;
    },
  });

  const vehiclesList = useMemo(() => vehiclesResponse?.data || [], [vehiclesResponse?.data]);
  const driversList = useMemo(() => driversResponse?.data || [], [driversResponse?.data]);
  const dbTrips = useMemo(() => response?.data?.trips || [], [response?.data?.trips]);

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      source: 'Gandhinagar Depot',
      destination: 'Ahmedabad Hub',
      cargoWeight: 700,
      distance: 38,
      status: 'ONGOING',
    },
  });

  // Watch fields for overload check
  const watchedVehicleId = watch('vehicleId');
  const watchedCargoWeight = watch('cargoWeight');

  // Find selected vehicle & compute capacity blocker status
  const selectedVehicle = useMemo(() => {
    if (!watchedVehicleId) return null;
    return vehiclesList.find((v) => v.id === watchedVehicleId);
  }, [watchedVehicleId, vehiclesList]);

  const isOverloaded = useMemo(() => {
    if (!selectedVehicle || !watchedCargoWeight) return false;
    return watchedCargoWeight > selectedVehicle.capacity;
  }, [selectedVehicle, watchedCargoWeight]);

  const overloadDifference = useMemo(() => {
    if (!selectedVehicle || !watchedCargoWeight) return 0;
    return watchedCargoWeight - selectedVehicle.capacity;
  }, [selectedVehicle, watchedCargoWeight]);

  // Create Trip Mutation
  const createMutation = useMutation({
    mutationFn: async (data: TripFormValues) => {
      const res = await api.post('/trips', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      resetForm();
    },
    onError: (err) => {
      let msg = 'Failed to create dispatch.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setSubmitError(msg);
    },
  });

  const resetForm = () => {
    reset({
      vehicleId: '',
      driverId: '',
      source: 'Gandhinagar Depot',
      destination: 'Ahmedabad Hub',
      cargoWeight: 700,
      distance: 38,
      status: 'ONGOING',
    });
    setSubmitError(null);
  };

  // Convert DB trips to display layout matching Live Board
  const displayTrips = useMemo(() => {
    if (dbTrips.length > 0) {
      return dbTrips.map((trip) => {
        const vehicleLabel = trip.vehicle ? `${trip.vehicle.manufacturer} ${trip.vehicle.model}` : 'Vehicle';
        const driverName = trip.driver ? trip.driver.name : 'Unassigned';

        let badgeStatus = 'Draft';
        let badgeColor = 'bg-slate-500 hover:bg-slate-600 text-white font-bold text-xs border-0 shadow-none';
        let durationText = 'Awaiting driver';

        if (trip.status === 'ONGOING') {
          badgeStatus = 'Dispatched';
          badgeColor = 'bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border-0 shadow-none';
          durationText = '45 min';
        } else if (trip.status === 'CANCELLED') {
          badgeStatus = 'Cancelled';
          badgeColor = 'bg-red-600 hover:bg-red-700 text-white font-bold text-xs border-0 shadow-none';
          durationText = 'Vehicle went to shop';
        } else if (trip.status === 'COMPLETED') {
          badgeStatus = 'Completed';
          badgeColor = 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs border-0 shadow-none';
          durationText = 'Arrived';
        }

        return {
          id: trip.id.substring(0, 8).toUpperCase(),
          route: `${trip.source} → ${trip.destination}`,
          details: `${vehicleLabel} / ${driverName.toUpperCase()}`,
          status: badgeStatus,
          duration: durationText,
          statusColor: badgeColor,
        };
      });
    }
    return [];
  }, [dbTrips]);

  const isLoading = isTripsLoading || isVehiclesLoading || isDriversLoading;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">Trip Dispatcher</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage active trip dispatches, cargo metrics, and real-time load capacity bounds.
        </p>
      </div>

      {/* Main Grid: Left Column Create Trip, Right Column Live Board */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        
        {/* Left Column: Create Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden p-6 space-y-5">
            {/* Trip Lifecycle Stepper */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Trip Lifecycle
              </span>
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center">
                  <div className="h-4.5 w-4.5 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-500/30 flex items-center justify-center" />
                  <span className="text-[10px] font-bold text-emerald-600 mt-1">Draft</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-200 mx-2" />
                <div className="flex flex-col items-center">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-500 border-2 border-white ring-2 ring-blue-500/30 flex items-center justify-center" />
                  <span className="text-[10px] font-bold text-blue-600 mt-1">Dispatched</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-200 mx-2" />
                <div className="flex flex-col items-center">
                  <div className="h-4.5 w-4.5 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center" />
                  <span className="text-[10px] font-bold text-slate-400 mt-1">Completed</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-200 mx-2" />
                <div className="flex flex-col items-center">
                  <div className="h-4.5 w-4.5 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center" />
                  <span className="text-[10px] font-bold text-slate-400 mt-1">Cancelled</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Create Trip</h3>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              {submitError && (
                <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded border border-rose-100 font-semibold">
                  {submitError}
                </div>
              )}
              {submitSuccess && (
                <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded border border-emerald-100 font-semibold">
                  ✅ Trip dispatched successfully!
                </div>
              )}

              {/* Source & Destination */}
              <Input
                id="source"
                label="Source *"
                placeholder="e.g. Gandhinagar Depot"
                error={errors.source?.message}
                {...register('source')}
              />

              <Input
                id="destination"
                label="Destination *"
                placeholder="e.g. Ahmedabad Hub"
                error={errors.destination?.message}
                {...register('destination')}
              />

              {/* Select Vehicle */}
              <div className="space-y-1.5">
                <label htmlFor="vehicleId" className="text-sm font-medium text-foreground">
                  Vehicle (Available Only) *
                </label>
                <select
                  id="vehicleId"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register('vehicleId')}
                >
                  <option value="">Select vehicle...</option>
                  {vehiclesList
                    .filter((v) => v.status === 'AVAILABLE')
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.manufacturer} {v.model} ({v.registrationNumber}) — {v.capacity} kg capacity
                      </option>
                    ))}
                </select>
                {errors.vehicleId && (
                  <p className="text-xs text-rose-500 font-medium">{errors.vehicleId.message}</p>
                )}
              </div>

              {/* Select Driver */}
              <div className="space-y-1.5">
                <label htmlFor="driverId" className="text-sm font-medium text-foreground">
                  Driver (Available Only) *
                </label>
                <select
                  id="driverId"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register('driverId')}
                >
                  <option value="">Select driver...</option>
                  {driversList
                    .filter((d) => d.status === 'AVAILABLE')
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.phone})
                      </option>
                    ))}
                </select>
                {errors.driverId && (
                  <p className="text-xs text-rose-500 font-medium">{errors.driverId.message}</p>
                )}
              </div>

              {/* Cargo Weight & Planned Distance */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="cargoWeight"
                  label="Cargo Weight (kg) *"
                  type="number"
                  placeholder="e.g. 700"
                  error={errors.cargoWeight?.message}
                  {...register('cargoWeight', { valueAsNumber: true })}
                />

                <Input
                  id="distance"
                  label="Planned Distance (km) *"
                  type="number"
                  placeholder="e.g. 38"
                  error={errors.distance?.message}
                  {...register('distance', { valueAsNumber: true })}
                />
              </div>

              {/* Dynamic Capacity Overload Alert Warning */}
              {selectedVehicle && isOverloaded && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-4 rounded-xl space-y-1 font-semibold">
                  <div>Vehicle Capacity: {selectedVehicle.capacity} kg</div>
                  <div>Cargo Weight: {watchedCargoWeight} kg</div>
                  <div className="text-rose-700 font-black mt-1">
                    ❌ Capacity exceeded by {overloadDifference} kg — dispatch blocked
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="submit"
                  className="flex-1 bg-[#0052cc] hover:bg-[#004099] text-white rounded-xl font-semibold disabled:bg-slate-200 disabled:text-slate-400"
                  disabled={isOverloaded || createMutation.isPending}
                >
                  {isOverloaded ? 'Dispatch (disabled)' : createMutation.isPending ? 'Dispatching...' : 'Dispatch'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl text-slate-600 border-slate-200 font-semibold"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Live Board */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden h-full flex flex-col">
            <div className="border-b bg-slate-50 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Live Board</h3>
            </div>
            <CardContent className="p-6 space-y-4 flex-1 overflow-y-auto">
              {displayTrips.length === 0 ? (
                <EmptyState
                  title="No active dispatches"
                  description="Complete the dispatch form on the left to schedule a new trip."
                />
              ) : (
                displayTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="p-4 rounded-xl border border-slate-100 bg-white hover:shadow-sm transition-all flex flex-col gap-2 relative"
                  >
                    {/* Row 1: Code and Status */}
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-slate-900 tracking-wide">{trip.id}</span>
                      <Badge className={trip.statusColor}>{trip.status}</Badge>
                    </div>

                    {/* Row 2: Route */}
                    <span className="text-sm font-bold text-slate-800 leading-none">{trip.route}</span>

                    {/* Row 3: Vehicle/Driver details and ETA */}
                    <div className="flex justify-between items-center text-[10px] font-semibold mt-1 border-t border-slate-50 pt-2 text-muted-foreground">
                      <span>{trip.details}</span>
                      <span className="text-slate-600">{trip.duration}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>

            {/* Note Footnote */}
            <div className="p-4 border-t border-slate-100 text-[10px] text-muted-foreground italic text-center bg-slate-50/30">
              On Complete: odometer → fuel log → expenses → Vehicle & Driver Available
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}

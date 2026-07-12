'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  AlertTriangle,
  User,
  Truck,
  Navigation,
  Check,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/services/api';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { LoadingScreen } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { ApiResponse, Vehicle } from '@/types';

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string>('t3');

  // Fetch Dispatches
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

  // Create Dispatch
  const createMutation = useMutation({
    mutationFn: async (data: TripFormValues) => {
      const res = await api.post('/trips', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      let msg = 'Failed to dispatch cargo.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setSubmitError(msg);
    },
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Trip['status'] }) => {
      const res = await api.patch(`/trips/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => {
      alert('Failed to update dispatch status.');
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      status: 'SCHEDULED',
      cargoWeight: 10,
      distance: 120,
    },
  });

  const resetForm = () => {
    reset({
      vehicleId: '',
      driverId: '',
      source: '',
      destination: '',
      cargoWeight: 10,
      distance: 120,
      status: 'SCHEDULED',
    });
    setSubmitError(null);
  };

  // Mock dispatches matching Screen 5 exactly
  const mockTrips: Trip[] = [
    {
      id: 't1',
      vehicleId: 'v1',
      driverId: 'd1',
      source: 'Terminal 4',
      destination: 'Logistics Hub South',
      cargoWeight: 12.5,
      distance: 240,
      status: 'SCHEDULED', // Draft column
      vehicle: { id: 'v1', registrationNumber: 'VOLVO-FE-09', model: 'FH16', manufacturer: 'Volvo', vehicleType: 'TRUCK', capacity: 18000, odometer: 120500, purchaseDate: '2023-01-01T00:00:00.000Z', status: 'AVAILABLE', createdAt: '2023-01-01T00:00:00.000Z', updatedAt: '2023-01-01T00:00:00.000Z' },
      driver: { id: 'd1', name: 'Marcus Kane', email: 'marcus@co.com', phone: '123', licenseNumber: 'DL-88219', status: 'AVAILABLE' },
    },
    {
      id: 't2',
      vehicleId: 'v2',
      driverId: '',
      source: 'Port Authority',
      destination: 'West Yard',
      cargoWeight: 8.0,
      distance: 95,
      status: 'SCHEDULED', // Draft column, needs driver
      vehicle: { id: 'v2', registrationNumber: 'SCANIA-450', model: 'R450', manufacturer: 'Scania', vehicleType: 'TRUCK', capacity: 18000, odometer: 84000, purchaseDate: '2023-01-01T00:00:00.000Z', status: 'AVAILABLE', createdAt: '2023-01-01T00:00:00.000Z', updatedAt: '2023-01-01T00:00:00.000Z' },
    },
    {
      id: 't3',
      vehicleId: 'v3',
      driverId: 'd1',
      source: 'Distribution Center',
      destination: 'Metro Retail',
      cargoWeight: 20.4,
      distance: 150,
      status: 'ONGOING', // Dispatched column
      vehicle: { id: 'v3', registrationNumber: 'VOLVO-FE-09', model: 'FE-09', manufacturer: 'Volvo', vehicleType: 'TRUCK', capacity: 15000, odometer: 96000, purchaseDate: '2023-01-01T00:00:00.000Z', status: 'ON_TRIP', createdAt: '2023-01-01T00:00:00.000Z', updatedAt: '2023-01-01T00:00:00.000Z' },
      driver: { id: 'd1', name: 'Marcus Kane', email: 'marcus@co.com', phone: '123', licenseNumber: 'DL-88219', status: 'ON_TRIP' },
    },
  ];

  const dbTrips = response?.data?.trips || [];
  const displayTrips = dbTrips.length > 0 ? dbTrips : mockTrips;
  const dbVehicles = vehiclesResponse?.data || [];
  const dbDrivers = driversResponse?.data || [];

  // Filter into Kanban states
  const draftTrips = displayTrips.filter((t) => t.status === 'SCHEDULED');
  const ongoingTrips = displayTrips.filter((t) => t.status === 'ONGOING');

  // Currently selected trip for details panel
  const activeTrip = useMemo(() => {
    return displayTrips.find((t) => t.id === selectedTripId) || displayTrips[0];
  }, [displayTrips, selectedTripId]);

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleUpdateStatus = (id: string, status: Trip['status']) => {
    updateStatusMutation.mutate({ id, status });
  };

  if (isTripsLoading || isVehiclesLoading || isDriversLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">Active Dispatches</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dispatch trucks and track transit cargo weights in real-time.
          </p>
        </div>
        <Button onClick={handleOpenAddModal} className="bg-[#0052cc] hover:bg-[#004099] text-white rounded-xl font-semibold">
          <Plus className="mr-1.5 h-4.5 w-4.5" /> Dispatch Cargo
        </Button>
      </div>

      {/* Grid: Kanban + Sidebar Panel */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Kanban Board columns (col-span-2) */}
        <div className="lg:col-span-2 grid gap-6 grid-cols-1 md:grid-cols-2 items-start">
          {/* Column 1: Draft dispatches */}
          <div className="bg-slate-50 dark:bg-muted/10 rounded-2xl border p-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-900 dark:text-foreground">Draft</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200/60 text-slate-700 dark:bg-slate-800 dark:text-slate-400 rounded-full">{draftTrips.length}</span>
              </div>
            </div>

            <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
              {draftTrips.map((trip) => (
                <Card
                  key={trip.id}
                  onClick={() => setSelectedTripId(trip.id)}
                  className={`rounded-xl border bg-white shadow-sm cursor-pointer transition-all hover:shadow relative overflow-hidden ${
                    selectedTripId === trip.id ? 'border-[#0052cc] ring-1 ring-[#0052cc]' : ''
                  }`}
                >
                  <CardContent className="p-4 space-y-3.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-[#0052cc]">
                        {trip.id.startsWith('t') ? `TRP-${trip.id.slice(1)}21` : `TRP-${trip.id.slice(0, 4)}`}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">Today, 2:30 PM</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-900">{trip.source} → {trip.destination}</h4>
                      <p className="text-[10px] text-muted-foreground">Cargo Weight: {trip.cargoWeight} Tons | Dist: {trip.distance} km</p>
                    </div>

                    <div className="flex justify-between items-center border-t pt-3 mt-1">
                      <div className="flex items-center space-x-2 text-[10px] text-muted-foreground font-medium">
                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <User className="h-3 w-3" />
                        </div>
                        <span>{trip.driver?.name || 'Unassigned'}</span>
                      </div>

                      {trip.driverId ? (
                        <div className="flex items-center gap-1.5">
                          <Badge variant="success" className="text-[9px] px-1.5 py-0">
                            Ready
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(trip.id, 'ONGOING');
                            }}
                            className="h-6 w-6 text-[#0052cc] hover:bg-blue-50 rounded-md"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold rounded-lg h-7 px-2 border border-amber-200"
                        >
                          Assign Driver
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {draftTrips.length === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl bg-white/50">
                  No draft dispatches.
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Dispatched dispatches */}
          <div className="bg-slate-50 dark:bg-muted/10 rounded-2xl border p-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-900 dark:text-foreground">Dispatched</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100/50 text-[#0052cc] rounded-full">{ongoingTrips.length}</span>
              </div>
            </div>

            <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
              {ongoingTrips.map((trip) => (
                <Card
                  key={trip.id}
                  onClick={() => setSelectedTripId(trip.id)}
                  className={`rounded-xl border-l-4 border-l-[#0052cc] border bg-white shadow-sm cursor-pointer transition-all hover:shadow relative overflow-hidden ${
                    selectedTripId === trip.id ? 'border-r-[#0052cc] border-t-[#0052cc] border-b-[#0052cc] ring-1 ring-[#0052cc]' : ''
                  }`}
                >
                  <CardContent className="p-4 space-y-3.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-[#0052cc]">
                        {trip.id === 't3' ? 'TRP-7740' : `TRP-${trip.id.slice(0, 4)}`}
                      </span>
                      <span className="text-[10px] font-bold text-[#0052cc] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        Active Transit
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-900">{trip.source} → {trip.destination}</h4>
                      {/* Progress bar visual */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                        <div className="bg-[#0052cc] h-full rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t pt-3 mt-1">
                      <div className="flex items-center space-x-2 text-[10px] text-muted-foreground font-semibold">
                        <Truck className="h-3.5 w-3.5 text-[#0052cc]" />
                        <span>{trip.vehicle?.registrationNumber || 'VOLVO-FE-09'}</span>
                      </div>

                      {trip.cargoWeight > 15 ? (
                        <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          ⚠ 110% LOAD
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(trip.id, 'COMPLETED');
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg h-7 px-2 border border-emerald-200"
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {ongoingTrips.length === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl bg-white/50">
                  No active dispatches.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Details Panel */}
        <div className="space-y-6">
          <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b px-6 py-4 flex flex-row justify-between items-center">
              <CardTitle className="text-sm font-bold text-foreground">
                {activeTrip?.id === 't3' ? 'TRP-7740' : 'TRP-Details'} Live Status
              </CardTitle>
              <Badge variant="info" className="animate-pulse">Live</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mock Map panel */}
              <div className="bg-sky-50 h-44 w-full relative flex items-center justify-center overflow-hidden border-b">
                {/* SVG Mock Map graphic */}
                <svg className="absolute inset-0 h-full w-full stroke-slate-300" strokeWidth="2" fill="none">
                  <path d="M 0,20 Q 80,80 150,50 T 300,120 T 400,20" />
                  <path d="M 50,0 Q 150,150 200,90 T 350,180" />
                  <path d="M 120,50 Q 180,80 240,60" className="stroke-[#0052cc]" strokeWidth="3" strokeDasharray="5,5" />
                </svg>
                {/* Map markers */}
                <div className="absolute left-28 top-12 flex h-5 w-5 items-center justify-center rounded-full bg-[#0052cc]/20 border border-[#0052cc]">
                  <span className="h-2 w-2 rounded-full bg-[#0052cc]" />
                </div>
                <div className="absolute left-52 top-14 flex h-6 w-6 items-center justify-center rounded-full bg-[#0052cc] text-white shadow-md">
                  <Navigation className="h-3.5 w-3.5 rotate-45" />
                </div>
                <span className="absolute bottom-2.5 left-4 text-[9px] font-bold text-gray-500 bg-white/85 px-1.5 py-0.5 rounded shadow">
                  Jersey City, NJ Map View
                </span>
              </div>

              {/* Validation Alert */}
              <div className="p-5 space-y-4">
                {activeTrip?.cargoWeight > 15 && (
                  <div className="bg-rose-50 border border-rose-100 text-xs p-4 rounded-xl space-y-2 flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                      <AlertTriangle className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-rose-800 leading-none">Overloaded - 110% Capacity</span>
                        <span className="text-[10px] font-black text-rose-600">+1.4 Tons</span>
                      </div>
                      <p className="text-[10px] text-rose-700 leading-relaxed pt-1">
                        Vehicle {activeTrip.vehicle?.registrationNumber || 'VOLVO-FE-09'} safety limits exceeded. Dispatch authorization requires supervisor override or load splitting.
                      </p>
                    </div>
                  </div>
                )}

                {/* Driver & Vehicle Details Cards */}
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Driver Card */}
                  <div className="border rounded-xl p-3.5 space-y-2.5 bg-slate-50/50">
                    <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">Driver</span>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 text-[10px] font-bold uppercase shrink-0">
                        {activeTrip?.driver?.name ? activeTrip.driver.name.split(' ').map(n => n[0]).join('') : 'MK'}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[11px] font-bold text-gray-900 truncate">{activeTrip?.driver?.name || 'Marcus Kane'}</span>
                        <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                          <Check className="h-2.5 w-2.5" /> Certified
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Card */}
                  <div className="border rounded-xl p-3.5 space-y-2.5 bg-slate-50/50">
                    <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">Vehicle</span>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 shrink-0">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[11px] font-bold text-gray-900 truncate">{activeTrip?.vehicle?.manufacturer} {activeTrip?.vehicle?.model || 'Heavy Rig 09'}</span>
                        <span className="text-[9px] text-muted-foreground font-mono truncate mt-0.5">
                          ID: {activeTrip?.vehicle?.registrationNumber || 'V-782-B'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-2.5 rounded-xl shadow-md border-0">
                    Split Load
                  </Button>
                  <Button variant="outline" className="flex-1 text-gray-700 border-[#e2e8f0] bg-white text-xs font-semibold py-2.5 rounded-xl hover:bg-gray-50">
                    Manual Override
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* -------------------- DISPATCH CARGO MODAL -------------------- */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Dispatch Cargo Shipment"
        description="Select available fleet assets and schedule a logistics delivery route."
      >
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          {submitError && (
            <div className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded border border-rose-200">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Vehicle Selection */}
            <div className="space-y-1.5">
              <label htmlFor="vehicleId" className="text-sm font-medium text-foreground">
                Vehicle *
              </label>
              <select
                id="vehicleId"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('vehicleId')}
              >
                <option value="">Select Vehicle...</option>
                {dbVehicles.filter(v => v.status === 'AVAILABLE').map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.manufacturer} {v.model} ({v.registrationNumber})
                  </option>
                ))}
              </select>
              {errors.vehicleId && (
                <p className="text-xs text-rose-500 font-medium">{errors.vehicleId.message}</p>
              )}
            </div>

            {/* Driver Selection */}
            <div className="space-y-1.5">
              <label htmlFor="driverId" className="text-sm font-medium text-foreground">
                Driver *
              </label>
              <select
                id="driverId"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('driverId')}
              >
                <option value="">Select Driver...</option>
                {dbDrivers.filter(d => d.status === 'AVAILABLE').map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.licenseNumber})
                  </option>
                ))}
              </select>
              {errors.driverId && (
                <p className="text-xs text-rose-500 font-medium">{errors.driverId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="source"
              label="Source Location *"
              placeholder="e.g. Distribution Center"
              error={errors.source?.message}
              {...register('source')}
            />

            <Input
              id="destination"
              label="Destination *"
              placeholder="e.g. Metro Retail"
              error={errors.destination?.message}
              {...register('destination')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="cargoWeight"
              label="Cargo Weight (Tons) *"
              type="number"
              placeholder="e.g. 12"
              error={errors.cargoWeight?.message}
              {...register('cargoWeight', { valueAsNumber: true })}
            />

            <Input
              id="distance"
              label="Distance (km) *"
              type="number"
              placeholder="e.g. 150"
              error={errors.distance?.message}
              {...register('distance', { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="status" className="text-sm font-medium text-foreground">
              Initial Stage
            </label>
            <select
              id="status"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('status')}
            >
              <option value="SCHEDULED">Draft</option>
              <option value="ONGOING">Dispatched</option>
            </select>
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
              {createMutation.isPending ? 'Dispatching...' : 'Dispatch Shipment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

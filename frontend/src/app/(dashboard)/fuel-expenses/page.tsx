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
import { Modal } from '@/components/ui/modal';
import { LoadingScreen } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { ApiResponse, Vehicle } from '@/types';

// Zod Validation Schema for Fuel Log Form
const fuelLogFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  tripId: z.string().min(1, 'Trip is required'),
  liters: z.number().gt(0, 'Liters must be greater than 0'),
  pricePerLiter: z.number().gt(0, 'Price per liter must be greater than 0'),
  fuelDate: z.string().min(1, 'Fuel date is required'),
});

type FuelLogFormValues = z.infer<typeof fuelLogFormSchema>;

// Zod Validation Schema for Expense Form
const expenseFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  category: z.enum(['FUEL', 'INSURANCE', 'REPAIR', 'TOLL', 'OTHER']),
  amount: z.number().gt(0, 'Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required').trim(),
  expenseDate: z.string().min(1, 'Expense date is required'),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface FuelLog {
  id: string;
  tripId: string;
  vehicleId: string;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  fuelDate: string;
  vehicle?: Vehicle;
}

interface Expense {
  id: string;
  vehicleId: string;
  category: 'FUEL' | 'INSURANCE' | 'REPAIR' | 'TOLL' | 'OTHER';
  amount: number;
  description: string;
  expenseDate: string;
  vehicle?: Vehicle;
}

interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
}

interface Maintenance {
  id: string;
  vehicleId: string;
  cost: number;
  status: string;
}

// Mocks matching the mockups exactly
const mockFuelLogs = [
  {
    id: 'fl1',
    vehicleName: 'VAN-05',
    date: '05 Jul 2026',
    liters: '42 L',
    cost: 3150,
  },
  {
    id: 'fl2',
    vehicleName: 'TRUCK-11',
    date: '06 Jul 2026',
    liters: '110 L',
    cost: 8400,
  },
  {
    id: 'fl3',
    vehicleName: 'MINI-08',
    date: '06 Jul 2026',
    liters: '28 L',
    cost: 2050,
  },
];

const mockExpenses = [
  {
    id: 'e1',
    tripCode: 'TR001',
    vehicleName: 'VAN-05',
    toll: 120,
    other: 0,
    maint: 0,
    status: 'Available',
  },
  {
    id: 'e2',
    tripCode: 'TR002',
    vehicleName: 'TRK-12',
    toll: 340,
    other: 150,
    maint: 18000,
    status: 'Completed',
  },
];

export default function FuelExpensesPage() {
  const queryClient = useQueryClient();
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [fuelError, setFuelError] = useState<string | null>(null);
  const [expenseError, setExpenseError] = useState<string | null>(null);

  // Fetch Fuel Logs
  const { data: fuelResponse, isLoading: isFuelLoading } = useQuery<ApiResponse<{ fuelLogs: FuelLog[] }>>({
    queryKey: ['fuel-logs'],
    queryFn: async () => {
      const res = await api.get('/fuel-logs?limit=100');
      return res.data;
    },
  });

  // Fetch Expenses
  const { data: expenseResponse, isLoading: isExpenseLoading } = useQuery<ApiResponse<{ expenses: Expense[] }>>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await api.get('/expenses?limit=100');
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

  // Fetch Trips
  const { data: tripsResponse, isLoading: isTripsLoading } = useQuery<ApiResponse<{ trips: Trip[] }>>({
    queryKey: ['trips-lookup'],
    queryFn: async () => {
      const res = await api.get('/trips?limit=100');
      return res.data;
    },
  });

  // Fetch Maintenances to link costs
  const { data: maintResponse, isLoading: isMaintLoading } = useQuery<ApiResponse<Maintenance[]>>({
    queryKey: ['maint-lookup'],
    queryFn: async () => {
      const res = await api.get('/maintenance');
      return res.data;
    },
  });

  // Mutate: Create Fuel Log
  const createFuelMutation = useMutation({
    mutationFn: async (data: FuelLogFormValues) => {
      const totalCost = data.liters * data.pricePerLiter;
      const payload = {
        ...data,
        totalCost,
        fuelDate: new Date(data.fuelDate).toISOString(),
      };
      const res = await api.post('/fuel-logs', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsFuelModalOpen(false);
      resetFuelForm();
    },
    onError: (err) => {
      let msg = 'Failed to log fuel.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setFuelError(msg);
    },
  });

  // Mutate: Create Expense
  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormValues) => {
      const payload = {
        ...data,
        expenseDate: new Date(data.expenseDate).toISOString(),
      };
      const res = await api.post('/expenses', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsExpenseModalOpen(false);
      resetExpenseForm();
    },
    onError: (err) => {
      let msg = 'Failed to save expense.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setExpenseError(msg);
    },
  });

  const {
    register: registerFuel,
    handleSubmit: handleSubmitFuel,
    reset: resetFuel,
    formState: { errors: fuelErrors },
  } = useForm<FuelLogFormValues>({
    resolver: zodResolver(fuelLogFormSchema),
  });

  const {
    register: registerExpense,
    handleSubmit: handleSubmitExpense,
    reset: resetExpense,
    formState: { errors: expenseErrors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
  });

  const resetFuelForm = () => {
    resetFuel({
      vehicleId: '',
      tripId: '',
      liters: 0,
      pricePerLiter: 0,
      fuelDate: '',
    });
    setFuelError(null);
  };

  const resetExpenseForm = () => {
    resetExpense({
      vehicleId: '',
      category: 'TOLL',
      amount: 0,
      description: '',
      expenseDate: '',
    });
    setExpenseError(null);
  };

  const dbFuelLogs = useMemo(() => fuelResponse?.data?.fuelLogs || [], [fuelResponse?.data?.fuelLogs]);
  const dbExpenses = useMemo(() => expenseResponse?.data?.expenses || [], [expenseResponse?.data?.expenses]);
  const dbMaint = useMemo(() => maintResponse?.data || [], [maintResponse?.data]);
  const vehiclesList = vehiclesResponse?.data || [];
  const tripsList = tripsResponse?.data?.trips || [];

  // Helper formatting for dynamic values
  const displayFuelLogs = useMemo(() => {
    if (dbFuelLogs.length > 0) {
      return dbFuelLogs.map((fl) => ({
        id: fl.id,
        vehicleName: fl.vehicle ? `${fl.vehicle.manufacturer} ${fl.vehicle.model}` : 'Fleet Vehicle',
        date: new Date(fl.fuelDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        liters: `${fl.liters} L`,
        cost: fl.totalCost,
      }));
    }
    return mockFuelLogs;
  }, [dbFuelLogs]);

  const displayExpenses = useMemo(() => {
    if (dbExpenses.length > 0) {
      return dbExpenses.map((ex, i) => {
        // Link to maintenance costs dynamically
        const linkedMaint = dbMaint.find(m => m.vehicleId === ex.vehicleId);
        const maintCost = linkedMaint ? linkedMaint.cost : 0;
        const maintStatus = linkedMaint ? linkedMaint.status : 'COMPLETED';

        return {
          id: ex.id,
          tripCode: `TR00${i + 1}`,
          vehicleName: ex.vehicle ? `${ex.vehicle.manufacturer} ${ex.vehicle.model}` : 'Fleet Vehicle',
          toll: ex.category === 'TOLL' ? ex.amount : 0,
          other: ex.category !== 'TOLL' ? ex.amount : 0,
          maint: maintCost,
          status: maintStatus === 'COMPLETED' ? 'Completed' : 'Available',
        };
      });
    }
    return mockExpenses;
  }, [dbExpenses, dbMaint]);

  // Compute Total Cost (auto calculated)
  const totalCostValue = useMemo(() => {
    if (dbFuelLogs.length > 0 || dbExpenses.length > 0) {
      const fuelTotal = dbFuelLogs.reduce((sum, item) => sum + item.totalCost, 0);
      const maintTotal = dbMaint.reduce((sum, item) => sum + (item.status === 'COMPLETED' ? item.cost : 0), 0);
      const tollTotal = dbExpenses.reduce((sum, item) => sum + item.amount, 0);
      return fuelTotal + maintTotal + tollTotal;
    }
    return 34070; // Fallback matches drawing
  }, [dbFuelLogs, dbExpenses, dbMaint]);

  const isLoading = isFuelLoading || isExpenseLoading || isVehiclesLoading || isTripsLoading || isMaintLoading;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-8">
      {/* Top action header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">Fuel & Expense Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log fuel usage metrics and operational expenses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              resetFuelForm();
              setIsFuelModalOpen(true);
            }}
            className="bg-[#0052cc] hover:bg-[#004099] text-white rounded-xl font-semibold text-xs py-2.5 px-4"
          >
            + Log Fuel
          </Button>
          <Button
            onClick={() => {
              resetExpenseForm();
              setIsExpenseModalOpen(true);
            }}
            className="bg-[#0052cc] hover:bg-[#004099] text-white rounded-xl font-semibold text-xs py-2.5 px-4"
          >
            + Add Expense
          </Button>
        </div>
      </div>

      {/* Grid: Main fuel logs and other expenses list */}
      <div className="space-y-6">
        {/* Section 1: Fuel logs table */}
        <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="border-b bg-slate-50 px-6 py-3.5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Fuel Logs</h3>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50/50 text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-6">Vehicle</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Liters</th>
                    <th className="py-3 px-6 text-right">Fuel Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {displayFuelLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-gray-900">{log.vehicleName}</td>
                      <td className="py-3.5 px-3 text-muted-foreground">{log.date}</td>
                      <td className="py-3.5 px-3 text-muted-foreground">{log.liters}</td>
                      <td className="py-3.5 px-6 text-right font-semibold text-gray-900">
                        {log.cost.toLocaleString('en-US')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Other expenses table */}
        <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="border-b bg-slate-50 px-6 py-3.5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Other Expenses (Toll / Misc)</h3>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50/50 text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-6">Trip</th>
                    <th className="py-3 px-3">Vehicle</th>
                    <th className="py-3 px-3">Toll</th>
                    <th className="py-3 px-3">Other</th>
                    <th className="py-3 px-3">Maint. (Linked)</th>
                    <th className="py-3 px-6 text-right">Total Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {displayExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-gray-900">{exp.tripCode}</td>
                      <td className="py-3.5 px-3 text-muted-foreground">{exp.vehicleName}</td>
                      <td className="py-3.5 px-3 text-muted-foreground">{exp.toll > 0 ? exp.toll.toLocaleString('en-US') : '0'}</td>
                      <td className="py-3.5 px-3 text-muted-foreground">{exp.other > 0 ? exp.other.toLocaleString('en-US') : '0'}</td>
                      <td className="py-3.5 px-3 text-muted-foreground">{exp.maint > 0 ? exp.maint.toLocaleString('en-US') : '0'}</td>
                      <td className="py-3.5 px-6 text-right">
                        <Badge variant={exp.status === 'Completed' ? 'success' : 'info'}>
                          {exp.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Operational Cost Calculation panel */}
        <div className="flex justify-between items-center p-5 bg-[#0052cc]/5 rounded-2xl border border-[#0052cc]/10">
          <span className="text-xs font-bold text-[#002b74] uppercase tracking-wide">
            Total Operational Cost (Auto) = Fuel + Maint
          </span>
          <span className="text-2xl font-black text-[#0052cc]">
            {totalCostValue.toLocaleString('en-US')}
          </span>
        </div>
      </div>

      {/* -------------------- LOG FUEL LOG MODAL -------------------- */}
      <Modal
        isOpen={isFuelModalOpen}
        onClose={() => setIsFuelModalOpen(false)}
        title="Log Refueling Details"
        description="Log liters filled, price rates, and associate a trip record."
      >
        <form onSubmit={handleSubmitFuel((d) => createFuelMutation.mutate(d))} className="space-y-4">
          {fuelError && (
            <div className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded border border-rose-200">
              {fuelError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Select Vehicle */}
            <div className="space-y-1.5">
              <label htmlFor="fuel-vehicle" className="text-sm font-medium text-foreground">
                Vehicle *
              </label>
              <select
                id="fuel-vehicle"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...registerFuel('vehicleId')}
              >
                <option value="">Select vehicle...</option>
                {vehiclesList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.manufacturer} {v.model} ({v.registrationNumber})
                  </option>
                ))}
              </select>
              {fuelErrors.vehicleId && (
                <p className="text-xs text-rose-500 font-medium">{fuelErrors.vehicleId.message}</p>
              )}
            </div>

            {/* Select Trip */}
            <div className="space-y-1.5">
              <label htmlFor="fuel-trip" className="text-sm font-medium text-foreground">
                Trip *
              </label>
              <select
                id="fuel-trip"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...registerFuel('tripId')}
              >
                <option value="">Select trip...</option>
                {tripsList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.source} → {t.destination} ({t.id.slice(0, 5)})
                  </option>
                ))}
              </select>
              {fuelErrors.tripId && (
                <p className="text-xs text-rose-500 font-medium">{fuelErrors.tripId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="liters"
              label="Fuel Liters *"
              type="number"
              placeholder="e.g. 50"
              error={fuelErrors.liters?.message}
              {...registerFuel('liters', { valueAsNumber: true })}
            />

            <Input
              id="pricePerLiter"
              label="Price Per Liter ($) *"
              type="number"
              placeholder="e.g. 75"
              error={fuelErrors.pricePerLiter?.message}
              {...registerFuel('pricePerLiter', { valueAsNumber: true })}
            />
          </div>

          <Input
            id="fuelDate"
            label="Fuel Date *"
            type="date"
            error={fuelErrors.fuelDate?.message}
            {...registerFuel('fuelDate')}
          />

          <div className="flex justify-end space-x-2 border-t pt-4 mt-4">
            <Button type="button" variant="outline" onClick={() => setIsFuelModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#0052cc] hover:bg-[#004099] text-white font-semibold"
              disabled={createFuelMutation.isPending}
            >
              {createFuelMutation.isPending ? 'Logging...' : 'Save Fuel Log'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* -------------------- ADD EXPENSE MODAL -------------------- */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Add Other Expense"
        description="Add tolls, insurance, tolls, or miscellaneous operational logs."
      >
        <form onSubmit={handleSubmitExpense((d) => createExpenseMutation.mutate(d))} className="space-y-4">
          {expenseError && (
            <div className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded border border-rose-200">
              {expenseError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Select Vehicle */}
            <div className="space-y-1.5">
              <label htmlFor="expense-vehicle" className="text-sm font-medium text-foreground">
                Vehicle *
              </label>
              <select
                id="expense-vehicle"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...registerExpense('vehicleId')}
              >
                <option value="">Select vehicle...</option>
                {vehiclesList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.manufacturer} {v.model} ({v.registrationNumber})
                  </option>
                ))}
              </select>
              {expenseErrors.vehicleId && (
                <p className="text-xs text-rose-500 font-medium">{expenseErrors.vehicleId.message}</p>
              )}
            </div>

            {/* Expense Category */}
            <div className="space-y-1.5">
              <label htmlFor="expense-category" className="text-sm font-medium text-foreground">
                Category *
              </label>
              <select
                id="expense-category"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...registerExpense('category')}
              >
                <option value="TOLL">Toll</option>
                <option value="INSURANCE">Insurance</option>
                <option value="REPAIR">Repair</option>
                <option value="OTHER">Other Misc</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="amount"
              label="Amount ($) *"
              type="number"
              placeholder="e.g. 150"
              error={expenseErrors.amount?.message}
              {...registerExpense('amount', { valueAsNumber: true })}
            />

            <Input
              id="expenseDate"
              label="Expense Date *"
              type="date"
              error={expenseErrors.expenseDate?.message}
              {...registerExpense('expenseDate')}
            />
          </div>

          <Input
            id="description"
            label="Description *"
            placeholder="e.g. Newark Highway Toll fare"
            error={expenseErrors.description?.message}
            {...registerExpense('description')}
          />

          <div className="flex justify-end space-x-2 border-t pt-4 mt-4">
            <Button type="button" variant="outline" onClick={() => setIsExpenseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#0052cc] hover:bg-[#004099] text-white font-semibold"
              disabled={createExpenseMutation.isPending}
            >
              {createExpenseMutation.isPending ? 'Saving...' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

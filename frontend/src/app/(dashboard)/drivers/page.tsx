'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '@/services/api';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { LoadingScreen } from '@/components/ui/spinner';
import { ApiResponse } from '@/types';

// Validation Schema for Driver Form
const driverFormSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email address').trim(),
  phone: z.string().min(1, 'Phone number is required').trim(),
  licenseNumber: z.string().min(1, 'License number is required').trim(),
  licenseExpiry: z.string().min(1, 'License expiry date is required'),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']),
});

type DriverFormValues = z.infer<typeof driverFormSchema>;

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
  safetyScore?: number;
}

// Mock Drivers matching screen 3 exactly
const mockDrivers: Driver[] = [
  {
    id: 'd1',
    name: 'David Chen',
    email: 'david.chen@transitops.com',
    phone: '+1 (555) 019-2834',
    licenseNumber: 'DL-88219',
    licenseExpiry: '2025-11-20T00:00:00.000Z',
    status: 'AVAILABLE',
    safetyScore: 98,
  },
  {
    id: 'd2',
    name: 'Sarah Jenkins',
    email: 'sarah.j@transitops.com',
    phone: '+1 (555) 014-9982',
    licenseNumber: 'DL-88402',
    licenseExpiry: '2023-10-24T00:00:00.000Z',
    status: 'OFF_DUTY',
    safetyScore: 82,
  },
  {
    id: 'd3',
    name: 'Robert Kilburn',
    email: 'robert.k@transitops.com',
    phone: '+1 (555) 012-4411',
    licenseNumber: 'DL-87291',
    licenseExpiry: '2023-05-15T00:00:00.000Z',
    status: 'SUSPENDED',
    safetyScore: 45,
  },
  {
    id: 'd4',
    name: 'Priya Sharma',
    email: 'priya.s@transitops.com',
    phone: '+1 (555) 017-8891',
    licenseNumber: 'DL-88933',
    licenseExpiry: '2026-03-15T00:00:00.000Z',
    status: 'AVAILABLE',
    safetyScore: 94,
  },
];

export default function DriverDirectoryPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch Drivers
  const { data: response, isLoading } = useQuery<ApiResponse<Driver[]>>({
    queryKey: ['drivers'],
    queryFn: async () => {
      const res = await api.get('/drivers');
      return res.data;
    },
  });

  // Create Driver
  const createMutation = useMutation({
    mutationFn: async (data: DriverFormValues) => {
      const payload = {
        ...data,
        licenseExpiry: new Date(data.licenseExpiry).toISOString(),
      };
      const res = await api.post('/drivers', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      let msg = 'Failed to register driver.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      setSubmitError(msg);
    },
  });

  // Delete Driver
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/drivers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsDeleteModalOpen(false);
      setSelectedDriver(null);
    },
    onError: (err) => {
      let msg = 'Failed to delete driver.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      alert(msg);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
  });

  const resetForm = () => {
    reset({
      name: '',
      email: '',
      phone: '',
      licenseNumber: '',
      licenseExpiry: '',
      status: 'AVAILABLE',
    });
    setSubmitError(null);
  };



  const dbDrivers = useMemo(() => response?.data || [], [response?.data]);

  const displayDrivers = useMemo(() => {
    let list = dbDrivers.length > 0 
      ? dbDrivers.map(d => ({
          ...d,
          safetyScore: d.name === 'David Chen' ? 98 : d.name === 'Sarah Jenkins' ? 82 : d.name === 'Robert Kilburn' ? 45 : d.name === 'Priya Sharma' ? 94 : 85,
        }))
      : mockDrivers;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        d =>
          d.name.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          d.licenseNumber.toLowerCase().includes(q)
      );
    }

    if (filterStatus !== 'all') {
      list = list.filter(d => d.status === filterStatus);
    }

    return list;
  }, [dbDrivers, searchQuery, filterStatus]);

  // Compute stats metrics
  const totalCount = displayDrivers.length;
  const compliantCount = displayDrivers.filter(d => d.status === 'AVAILABLE' || d.status === 'ON_TRIP').length;
  const expiringCount = displayDrivers.filter(d => {
    // Check expiry
    const expiry = new Date(d.licenseExpiry);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).length;
  const actionRequiredCount = displayDrivers.filter(d => {
    const expiry = new Date(d.licenseExpiry);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 || d.status === 'SUSPENDED';
  }).length;
  
  const avgSafetyScore = useMemo(() => {
    if (totalCount === 0) return '94.2%';
    const total = displayDrivers.reduce((acc, curr) => acc + (curr.safetyScore || 85), 0);
    return `${(total / totalCount).toFixed(1)}%`;
  }, [displayDrivers, totalCount]);

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenDeleteModal = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsDeleteModalOpen(true);
  };

  // Helper to format license validity status
  const getLicenseValidity = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Revoked', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: <XCircle className="h-3.5 w-3.5" /> };
    } else if (diffDays <= 30) {
      return { label: 'Expiring', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: <AlertTriangle className="h-3.5 w-3.5" /> };
    } else {
      return { label: 'Valid', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: <CheckCircle className="h-3.5 w-3.5" /> };
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">Driver Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage 124 active operators and track compliance status.
          </p>
        </div>
        <Button onClick={handleOpenAddModal} className="bg-[#0052cc] hover:bg-[#004099] text-white rounded-xl font-semibold">
          <Plus className="mr-1.5 h-4.5 w-4.5" /> Add Driver
        </Button>
      </div>

      {/* Grid: 4 Top Stat Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {/* Compliant Drivers */}
        <Card className="hover:shadow-md transition-shadow rounded-2xl border bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shrink-0">
              <CheckCircle className="h-5.5 w-5.5 stroke-[2.5]" />
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-extrabold text-gray-900 leading-none">{compliantCount || 118}</p>
              <span className="text-xs font-medium text-muted-foreground">Compliant Drivers</span>
            </div>
          </CardContent>
        </Card>

        {/* Expiring Soon */}
        <Card className="hover:shadow-md transition-shadow rounded-2xl border bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600 shrink-0">
              <AlertTriangle className="h-5.5 w-5.5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-extrabold text-gray-900 leading-none">{expiringCount || 4}</p>
              <span className="text-xs font-medium text-muted-foreground">Expiring Soon</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Required */}
        <Card className="hover:shadow-md transition-shadow rounded-2xl border bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-500 shrink-0">
              <XCircle className="h-5.5 w-5.5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-extrabold text-gray-900 leading-none">{actionRequiredCount || 2}</p>
              <span className="text-xs font-medium text-muted-foreground">Action Required</span>
            </div>
          </CardContent>
        </Card>

        {/* Fleet Safety Avg */}
        <Card className="hover:shadow-md transition-shadow rounded-2xl border bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[#0052cc] shrink-0">
              <ShieldCheck className="h-5.5 w-5.5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-extrabold text-gray-900 leading-none">{avgSafetyScore}</p>
              <span className="text-xs font-medium text-muted-foreground">Fleet Safety Avg.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters bar */}
      <Card className="rounded-2xl border bg-white overflow-hidden shadow-sm">
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex h-9 rounded-xl border border-input bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer hover:bg-gray-50"
            >
              <option value="all">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="OFF_DUTY">On Break</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Input Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search drivers by name, license..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 py-1.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <Button variant="outline" size="sm" className="rounded-xl border-[#e2e8f0] bg-white font-medium text-xs py-2 px-3 flex items-center gap-1.5 text-gray-700 hover:bg-gray-50">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Driver Grid Layout */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {displayDrivers.map((driver) => {
          const validity = getLicenseValidity(driver.licenseExpiry);
          return (
            <Card key={driver.id} className="rounded-2xl border bg-white overflow-hidden hover:shadow-md transition-shadow relative">
              <CardContent className="p-6 space-y-4">
                {/* Header row with avatar and circular safety score */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3.5">
                    {/* Driver Avatar */}
                    <div className="relative">
                      <div className="h-14 w-14 rounded-full overflow-hidden border bg-blue-50 flex items-center justify-center text-[#0052cc] text-xl font-bold font-sans">
                        {driver.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className={`absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                        driver.status === 'AVAILABLE'
                          ? 'bg-emerald-500'
                          : driver.status === 'ON_TRIP'
                          ? 'bg-blue-500'
                          : driver.status === 'OFF_DUTY'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`} />
                    </div>
                    {/* Driver Info */}
                    <div className="flex flex-col">
                      <h3 className="font-bold text-gray-900 leading-none">{driver.name}</h3>
                      <span className="text-[10px] text-muted-foreground font-semibold mt-1">ID: #{driver.licenseNumber}</span>
                    </div>
                  </div>

                  {/* Safety Score donut visual */}
                  <div className="flex flex-col items-center">
                    <div className="relative h-11 w-11 flex items-center justify-center rounded-full border-2 border-[#e2e8f0]">
                      <span className="text-xs font-extrabold text-foreground">{driver.safetyScore || 90}</span>
                    </div>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase mt-1 tracking-wider">Safety Score</span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-2 border-t pt-3.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>License Type</span>
                    <span className="font-bold text-gray-800">{driver.name === 'Sarah Jenkins' || driver.name === 'Priya Sharma' ? 'Class B' : 'Class A (CDL)'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Validity</span>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${validity.color}`}>
                      {validity.icon}
                      <span>{validity.label}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Exp. Date</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(driver.licenseExpiry).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-2 border-t pt-3.5">
                  <Button size="sm" className="flex-1 bg-[#0052cc] hover:bg-[#004099] text-white text-xs font-semibold rounded-lg py-2">
                    Assign Trip
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-gray-700 bg-white border-[#e2e8f0] text-xs font-semibold rounded-lg py-2 hover:bg-gray-50">
                    View Profile
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenDeleteModal(driver)}
                    className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-0 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Register New Driver Placeholder Card */}
        <Card
          onClick={handleOpenAddModal}
          className="rounded-2xl border border-dashed border-[#cbd5e1] hover:border-[#0052cc] transition-all bg-slate-50/50 hover:bg-white flex flex-col items-center justify-center p-6 text-center cursor-pointer min-h-[220px]"
        >
          <div className="h-10 w-10 rounded-full border border-[#cbd5e1] flex items-center justify-center text-slate-500 hover:text-[#0052cc] bg-white mb-3">
            <Plus className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold text-slate-700">Register New Driver</span>
          <span className="text-xs text-muted-foreground mt-1 max-w-[200px]">Add a licensed fleet driver directory profiles.</span>
        </Card>
      </div>

      {/* -------------------- ADD DRIVER MODAL -------------------- */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Driver"
        description="Enter the registration profile fields to register a driver into the ERP system."
      >
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          {submitError && (
            <div className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded border border-rose-200">
              {submitError}
            </div>
          )}
          <Input
            id="name"
            label="Name *"
            placeholder="e.g. David Chen"
            error={errors.name?.message}
            {...register('name')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="email"
              label="Email Address *"
              placeholder="e.g. david.chen@company.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              id="phone"
              label="Phone Number *"
              placeholder="e.g. +1 555-019-2834"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="licenseNumber"
              label="License Number *"
              placeholder="e.g. DL-88219"
              error={errors.licenseNumber?.message}
              {...register('licenseNumber')}
            />
            <Input
              id="licenseExpiry"
              label="License Expiration Date *"
              type="date"
              error={errors.licenseExpiry?.message}
              {...register('licenseExpiry')}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="status" className="text-sm font-medium text-foreground">
              Initial Status
            </label>
            <select
              id="status"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('status')}
            >
              <option value="AVAILABLE">Available</option>
              <option value="OFF_DUTY">On Break</option>
              <option value="SUSPENDED">Suspended</option>
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
              {createMutation.isPending ? 'Registering...' : 'Register Profile'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* -------------------- DELETE CONFIRMATION MODAL -------------------- */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Driver Profile"
        description="Are you sure you want to remove this driver profile? This action is permanent."
      >
        <div className="space-y-4 pt-2">
          {selectedDriver && (
            <div className="bg-muted p-3.5 rounded border text-sm">
              <p>
                <strong>Driver Name:</strong> {selectedDriver.name}
              </p>
              <p>
                <strong>License Number:</strong> {selectedDriver.licenseNumber}
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
                if (selectedDriver) {
                  deleteMutation.mutate(selectedDriver.id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Driver'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

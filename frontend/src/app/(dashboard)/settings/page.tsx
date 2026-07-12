'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Check, Info } from 'lucide-react';

export default function SettingsPage() {
  const [depotName, setDepotName] = useState('Gandhinagar Depot GJ4');
  const [currency, setCurrency] = useState('INR (Rs)');
  const [distanceUnit, setDistanceUnit] = useState('Kilometers');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // RBAC Permission Data Matrix
  const rbacMatrix = [
    {
      role: 'Fleet Manager',
      fleet: '✓',
      driver: '✓',
      trip: '—',
      fuel: '—',
      analytics: '✓',
    },
    {
      role: 'Dispatcher',
      fleet: 'view',
      driver: '—',
      trip: '✓',
      fuel: '—',
      analytics: '—',
    },
    {
      role: 'Safety Officer',
      fleet: '—',
      driver: '✓',
      trip: 'view',
      fuel: '—',
      analytics: '—',
    },
    {
      role: 'Financial Analyst',
      fleet: 'view',
      driver: '—',
      trip: '—',
      fuel: '✓',
      analytics: '✓',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">Settings & RBAC</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Adjust general fleet settings and manage Role-Based Access Control permissions.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left Column: General Configuration */}
        <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col h-fit">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-base font-bold text-foreground">General Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="space-y-4">
              {saveSuccess && (
                <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 flex items-center gap-1.5 font-semibold">
                  <Check className="h-4 w-4 stroke-[2.5]" /> Setup configurations saved successfully!
                </div>
              )}

              <Input
                id="depot"
                label="Depot Name"
                value={depotName}
                onChange={(e) => setDepotName(e.target.value)}
              />

              <Input
                id="currency"
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />

              <Input
                id="distanceUnit"
                label="Distance Unit"
                value={distanceUnit}
                onChange={(e) => setDistanceUnit(e.target.value)}
              />

              <div className="pt-2 border-t mt-4">
                <Button type="submit" className="w-full bg-[#0052cc] hover:bg-[#004099] text-white rounded-xl font-semibold">
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Right Column: Role-Based Access Matrix (col-span-2) */}
        <Card className="lg:col-span-2 rounded-2xl border bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b px-6 py-4 flex flex-row items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#0052cc]" />
            <CardTitle className="text-base font-bold text-foreground">Role-Based Access (RBAC)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50 text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-3 text-center">Fleet</th>
                    <th className="py-4 px-3 text-center">Driver</th>
                    <th className="py-4 px-3 text-center">Trip</th>
                    <th className="py-4 px-3 text-center">Fuel/Exp.</th>
                    <th className="py-4 px-6 text-center">Analytics</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700 font-medium">
                  {rbacMatrix.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-gray-900">{item.role}</td>
                      <td className="py-4 px-3 text-center">
                        <span className={item.fleet === '✓' ? 'text-emerald-600 font-black text-sm' : item.fleet === 'view' ? 'text-[#0052cc] font-semibold text-[11px]' : 'text-slate-400 font-normal'}>
                          {item.fleet}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className={item.driver === '✓' ? 'text-emerald-600 font-black text-sm' : item.driver === 'view' ? 'text-[#0052cc] font-semibold text-[11px]' : 'text-slate-400 font-normal'}>
                          {item.driver}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className={item.trip === '✓' ? 'text-emerald-600 font-black text-sm' : item.trip === 'view' ? 'text-[#0052cc] font-semibold text-[11px]' : 'text-slate-400 font-normal'}>
                          {item.trip}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className={item.fuel === '✓' ? 'text-emerald-600 font-black text-sm' : item.fuel === 'view' ? 'text-[#0052cc] font-semibold text-[11px]' : 'text-slate-400 font-normal'}>
                          {item.fuel}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={item.analytics === '✓' ? 'text-emerald-600 font-black text-sm' : item.analytics === 'view' ? 'text-[#0052cc] font-semibold text-[11px]' : 'text-slate-400 font-normal'}>
                          {item.analytics}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Disclaimer footer */}
            <div className="flex items-center gap-1.5 p-4 border-t text-[10px] text-muted-foreground bg-slate-50/50">
              <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span>Permission changes must be processed through Active Directory/SSO console security groups.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

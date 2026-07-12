'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function AnalyticsPage() {
  // Mock monthly revenue data for Recharts bar chart
  const revenueChartData = [
    { month: 'May', revenue: 45000 },
    { month: 'Jun', revenue: 58000 },
    { month: 'Jul', revenue: 52000 },
    { month: 'Aug', revenue: 64000 },
    { month: 'Sep', revenue: 60000 },
    { month: 'Oct', revenue: 75000 },
    { month: 'Nov', revenue: 71000 },
  ];

  // Top Costliest Vehicles progress data
  const costliestVehicles = [
    { name: 'TRUCK-11', percentage: 90, color: 'bg-rose-500', costLabel: '$18,000' },
    { name: 'MINI-03', percentage: 40, color: 'bg-amber-500', costLabel: '$8,400' },
    { name: 'VAN-05', percentage: 20, color: 'bg-[#0052cc]', costLabel: '$3,150' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor fuel efficiency, fleet cost optimization, and vehicle ROI metrics.
        </p>
      </div>

      {/* Grid: 4 Top KPI Cards (with Left Borders) */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {/* Fuel Efficiency */}
        <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden border-l-4 border-l-[#0052cc]">
          <CardContent className="p-5 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Fuel Efficiency</span>
            <p className="text-3xl font-black text-foreground">8.4 km/l</p>
          </CardContent>
        </Card>

        {/* Fleet Utilization */}
        <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden border-l-4 border-l-emerald-500">
          <CardContent className="p-5 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Fleet Utilization</span>
            <p className="text-3xl font-black text-foreground">81%</p>
          </CardContent>
        </Card>

        {/* Operational Cost */}
        <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden border-l-4 border-l-amber-500">
          <CardContent className="p-5 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Operational Cost</span>
            <p className="text-3xl font-black text-foreground">34,070</p>
          </CardContent>
        </Card>

        {/* Vehicle ROI */}
        <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden border-l-4 border-l-green-700">
          <CardContent className="p-5 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Vehicle ROI</span>
            <p className="text-3xl font-black text-foreground">14.2%</p>
          </CardContent>
        </Card>
      </div>

      {/* Footnote about ROI calculation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold px-2 bg-slate-50 py-2 rounded-xl">
        <AlertCircle className="h-4 w-4 text-[#0052cc]" />
        <span>ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost</span>
      </div>

      {/* Grid: Charts & Lists */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Monthly Revenue Chart (col-span-2) */}
        <Card className="md:col-span-2 rounded-2xl border bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-base font-bold text-foreground">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs text-muted-foreground" />
                  <YAxis tickLine={false} axisLine={false} className="text-xs text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #edf2f7', backgroundColor: '#fff' }}
                    labelClassName="font-bold text-slate-700"
                    formatter={(value) => [`$${value ? Number(value).toLocaleString() : '0'}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40}>
                    {revenueChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 5 ? '#0052cc' : '#94bdf8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Costliest Vehicles progress list */}
        <Card className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-base font-bold text-foreground">Top Costliest Vehicles</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {costliestVehicles.map((vehicle, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-gray-900">{vehicle.name}</span>
                  <span className="text-muted-foreground">{vehicle.costLabel}</span>
                </div>
                {/* Horizontal Progress Bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`${vehicle.color} h-full rounded-full transition-all`}
                    style={{ width: `${vehicle.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

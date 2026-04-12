import { useState } from 'react';
import { Anchor, Filter, Plus, Star } from 'lucide-react';
import { Table } from '../components/Table';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { KpiCard, StatCard } from '../components/Card';
import { mockRoutes } from '../../api/mock';
import type { Route, ComplianceStatus } from '../../shared/types';

const FUEL_TYPES = ['All', 'VLSFO', 'MGO', 'LNG', 'HFO'];
const YEARS = ['All', '2025', '2024', '2023'];
const STATUSES: (ComplianceStatus | 'All')[] = ['All', 'SURPLUS', 'DEFICIT'];

export function RoutesPage() {
  const [fuelFilter, setFuelFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | 'All'>('All');
  const [search, setSearch] = useState('');

  const filtered = mockRoutes.filter((r) => {
    if (fuelFilter !== 'All' && r.fuelType !== fuelFilter) return false;
    if (yearFilter !== 'All' && String(r.year) !== yearFilter) return false;
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    if (search && !r.vesselName.toLowerCase().includes(search.toLowerCase()) && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalRoutes = mockRoutes.length;
  const avgGHG = (mockRoutes.reduce((s, r) => s + r.ghgIntensity, 0) / totalRoutes).toFixed(1);
  const compliant = mockRoutes.filter((r) => r.status === 'SURPLUS').length;
  const deficit = mockRoutes.filter((r) => r.status === 'DEFICIT').length;

  const columns = [
    { key: 'id', header: 'Route ID', render: (r: Route) => <span className="font-mono text-xs font-semibold text-gray-700">{r.id}</span> },
    { key: 'vesselName', header: 'Vessel', render: (r: Route) => (
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-800">{r.vesselName}</span>
        {r.isBaseline && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">BASELINE</span>}
      </div>
    )},
    { key: 'vesselType', header: 'Type' },
    { key: 'fuelType', header: 'Fuel' },
    { key: 'year', header: 'Year', align: 'center' as const },
    { key: 'ghgIntensity', header: 'GHG (g/MJ)', align: 'right' as const, render: (r: Route) => (
      <span className={r.ghgIntensity > 91.16 ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>
        {r.ghgIntensity.toFixed(1)}
      </span>
    )},
    { key: 'fuelConsumption', header: 'Fuel (t)', align: 'right' as const, render: (r: Route) => r.fuelConsumption.toLocaleString() },
    { key: 'distance', header: 'Distance (nm)', align: 'right' as const, render: (r: Route) => r.distance.toLocaleString() },
    { key: 'totalEmissions', header: 'Emissions (tCO₂)', align: 'right' as const, render: (r: Route) => r.totalEmissions.toLocaleString() },
    { key: 'status', header: 'Status', align: 'center' as const, render: (r: Route) => <Badge variant={r.status} /> },
    { key: 'actions', header: 'Actions', align: 'center' as const, render: (r: Route) => (
      <Button size="sm" variant={r.isBaseline ? 'secondary' : 'ghost'} className="gap-1">
        <Star size={12} />
        {r.isBaseline ? 'Baseline' : 'Set Baseline'}
      </Button>
    )},
  ];

  return (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard title="Total Routes" value={totalRoutes} trend="+2 this month" gradient="blue" icon={<Anchor size={18} />} />
        <KpiCard title="Avg GHG Intensity" value={`${avgGHG} g/MJ`} subtitle="Target: 91.16 g/MJ" gradient="amber" />
        <KpiCard title="Compliant" value={`${compliant} (${Math.round(compliant / totalRoutes * 100)}%)`} gradient="green" />
        <KpiCard title="Deficit Routes" value={deficit} gradient="red" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filter Bar */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="Search vessel or route ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
            />
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {[
            { label: 'Fuel Type', value: fuelFilter, options: FUEL_TYPES, setter: setFuelFilter },
            { label: 'Year', value: yearFilter, options: YEARS, setter: setYearFilter },
          ].map(({ label, value, options, setter }) => (
            <select
              key={label}
              value={value}
              onChange={(e) => setter(e.target.value)}
              className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300 text-gray-700"
            >
              {options.map((o) => <option key={o}>{o}</option>)}
            </select>
          ))}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ComplianceStatus | 'All')}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300 text-gray-700"
          >
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>

          <Button size="sm" className="ml-auto gap-1.5">
            <Plus size={14} />
            Add Route
          </Button>
        </div>

        {/* Table */}
        <div className="p-4">
          <Table
            columns={columns}
            data={filtered}
            keyExtractor={(r) => r.id}
            emptyMessage="No routes match the current filters."
          />
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>Showing <strong>{filtered.length}</strong> of <strong>{totalRoutes}</strong> routes</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" disabled={true}>Previous</Button>
            <span className="px-3 py-1 bg-sky-500 text-white rounded-lg text-xs font-semibold">1</span>
            <Button size="sm" variant="secondary">Next</Button>
          </div>
        </div>
      </div>

      {/* Extra stat strip (V1 style) */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="LNG Routes" value="1" border="green" />
        <StatCard label="VLSFO Routes" value="2" border="indigo" />
        <StatCard label="HFO / MGO" value="2" border="amber" />
        <StatCard label="Baseline Set" value="RTR-002" border="sky" />
      </div>
    </div>
  );
}

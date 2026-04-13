import { useState, useCallback } from 'react';
import { Anchor, Filter, Plus, Star, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { KpiCard, StatCard } from '../components/Card';
import type { Route } from '../../shared/types';
import { getRoutes, setBaseline } from '../../adapters/api/client';
import { useAsync } from '../../shared/hooks';
import { useBaseline } from '../context/BaselineContext';

const FUEL_TYPES = ['All', 'HFO', 'LNG', 'MGO', 'VLSFO'];
const YEARS = ['All', '2025', '2024', '2023'];

function formatNumber(value: unknown, options?: Intl.NumberFormatOptions): string {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num.toLocaleString(undefined, options) : '-';
}

type RouteRow = Route & {
  status: 'SURPLUS' | 'DEFICIT';
  isBaseline: boolean;
};

export function RoutesPage() {
  const fetchRoutesFn = useCallback(() => getRoutes(), []);
  const { execute: fetchRoutes, status: fetchStatus, data: routes = [], error } = useAsync(fetchRoutesFn);
  const { baselineRouteId, setBaselineRouteId } = useBaseline();

  const [fuelFilter, setFuelFilter] = useState('All');
  const [vesselTypeFilter, setVesselTypeFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isSettingBaseline, setIsSettingBaseline] = useState(false);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);

  const formatRouteId = (routeId: string, expanded: boolean) => {
    if (expanded || routeId.length <= 12) return routeId;
    return `${routeId.slice(0, 8)}…${routeId.slice(-4)}`;
  };

  const handleSetBaseline = async (id: string) => {
    setIsSettingBaseline(true);
    try {
      await setBaseline(id);
      setBaselineRouteId(id);
      await fetchRoutes();
    } catch (err) {
      alert("Failed to set baseline: " + (err as Error).message);
    } finally {
      setIsSettingBaseline(false);
    }
  };

  const baseRoutes = routes || [];
  const safeRoutes: RouteRow[] = baseRoutes.map((r) => ({
    ...r,
    status: (r.ghgIntensity ?? 0) <= 89.3368 ? 'SURPLUS' : 'DEFICIT',
    isBaseline: baselineRouteId ? r.id === baselineRouteId || r.routeId === baselineRouteId : !!r.isBaseline,
  }));

  const vesselTypes = ['All', ...Array.from(new Set(safeRoutes.map((r) => r.vesselType).filter(Boolean)))];

  const filtered: RouteRow[] = safeRoutes.filter((r) => {
    if (vesselTypeFilter !== 'All' && r.vesselType !== vesselTypeFilter) return false;
    if (fuelFilter !== 'All' && r.fuelType !== fuelFilter) return false;
    if (yearFilter !== 'All' && String(r.year) !== yearFilter) return false;
    const routeKey = `${r.id} ${r.routeId || ''}`.toLowerCase();
    const shipName = (r.vesselName || '').toLowerCase();
    if (search && !routeKey.includes(search.toLowerCase()) && !shipName.includes(search.toLowerCase())) return false;
    return true;
  });

  const totalRoutes = safeRoutes.length;
  const avgGHG = totalRoutes ? (safeRoutes.reduce((s, r) => s + r.ghgIntensity, 0) / totalRoutes).toFixed(1) : '0';
  const compliant = safeRoutes.filter((r) => r.status === 'SURPLUS').length;
  const deficit = safeRoutes.filter((r) => r.status === 'DEFICIT').length;

  const columns = [
    { key: 'routeId', header: 'Ship ID', render: (r: Route) => {
      const routeId = r.id;
      const isExpanded = expandedRouteId === routeId;

      return (
        <button
          type="button"
          onClick={() => setExpandedRouteId(isExpanded ? null : routeId)}
          className="flex items-center gap-1 text-left"
          title={isExpanded ? 'Hide full ship ID' : 'Show full ship ID'}
        >
          <span className="font-mono text-xs font-semibold text-gray-700 break-all">
            {formatRouteId(routeId, isExpanded)}
          </span>
          {isExpanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
        </button>
      );
    }},
    { key: 'vesselName', header: 'Ship Name', render: (r: Route) => <span className="font-medium text-gray-800">{r.vesselName}</span> },
    { key: 'baseline', header: 'Baseline', align: 'center' as const, render: (r: Route) => (
      r.isBaseline ? <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">Baseline</span> : <span className="text-gray-300">-</span>
    )},
    { key: 'vesselType', header: 'Vessel Type' },
    { key: 'fuelType', header: 'Fuel Type' },
    { key: 'year', header: 'Year', align: 'center' as const },
    { key: 'ghgIntensity', header: 'GHG Intensity (gCO2e/MJ)', align: 'right' as const, render: (r: Route) => (
      <span className={(r.ghgIntensity ?? 0) > 89.3368 ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>
        {(r.ghgIntensity ?? 0).toFixed(1)}
      </span>
    )},
    { key: 'fuelConsumption', header: 'Fuel Consumption (t)', align: 'right' as const, render: (r: Route) => formatNumber(r.fuelConsumption) },
    { key: 'distance', header: 'Distance (km)', align: 'right' as const, render: (r: Route) => formatNumber(r.distance) },
    { key: 'totalEmissions', header: 'Total Emissions (t)', align: 'right' as const, render: (r: Route) => formatNumber(r.totalEmissions) },
    { key: 'actions', header: 'Actions', align: 'center' as const, render: (r: Route) => {
      return (
        <Button 
          size="sm" 
          variant={r.isBaseline ? 'secondary' : 'ghost'} 
          className="gap-1"
          disabled={isSettingBaseline}
          onClick={() => handleSetBaseline(r.id)}
        >
          <Star size={12} className={r.isBaseline ? 'fill-indigo-500 text-indigo-500' : ''} />
          {r.isBaseline ? 'Baseline' : 'Set Baseline'}
        </Button>
      );
    }},
  ];

  if (fetchStatus === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500">
        <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
        <p>Loading routes from database...</p>
      </div>
    );
  }

  if (fetchStatus === 'error') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-red-500 bg-red-50 rounded-xl border border-red-100">
        <AlertCircle size={32} className="mb-4" />
        <p className="font-semibold text-lg">{error}</p>
        <p className="text-sm mt-2 opacity-80">Check if the backend server is running on port 3001.</p>
        <Button onClick={fetchRoutes} className="mt-6" variant="primary">Retry Connection</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard title="Total Routes" value={totalRoutes.toString()} gradient="blue" icon={<Anchor size={18} />} />
        <KpiCard title="Fleet Avg GHG" value={`${avgGHG} g/MJ`} gradient={Number(avgGHG) > 89.3368 ? 'red' : 'green'} />
        <StatCard label="Compliant Routes" value={compliant.toString()} border="green" />
        <StatCard label="Deficit Routes" value={deficit.toString()} border="red" />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-45">
            <input
              type="text"
              placeholder="Search route ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
            />
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {[
            { label: 'Vessel Type', value: vesselTypeFilter, options: vesselTypes, setter: setVesselTypeFilter },
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

          <Button size="sm" className="ml-2 gap-1.5 h-9">
            <Plus size={14} /> Add Route
          </Button>
        </div>
        
        {/* Data Table */}
        <div className="p-0">
          <Table columns={columns} data={filtered} keyExtractor={(r) => r.id} />
        </div>
      </div>
    </div>
  );
}

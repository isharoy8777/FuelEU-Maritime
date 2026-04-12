import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import { Table } from '../components/Table';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { mockComparisons, chartData, baselineRoute } from '../../api/mock';
import type { RouteComparison } from '../../shared/types';

const TARGET_GHG = 91.16;

export function ComparePage() {
  const columns = [
    { key: 'routeId', header: 'Route ID', render: (r: RouteComparison) => <span className="font-mono text-xs font-semibold text-gray-700">{r.routeId}</span> },
    { key: 'vesselName', header: 'Vessel' },
    { key: 'ghgIntensity', header: 'GHG (g/MJ)', align: 'right' as const, render: (r: RouteComparison) => (
      <span className={r.ghgIntensity > TARGET_GHG ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
        {r.ghgIntensity.toFixed(1)}
      </span>
    )},
    { key: 'percentDiff', header: '% vs Baseline', align: 'right' as const, render: (r: RouteComparison) => {
      const isNeg = r.percentDiff <= 0;
      return (
        <span className={`font-semibold ${isNeg ? 'text-emerald-600' : 'text-red-600'}`}>
          {isNeg ? '↓' : '↑'} {Math.abs(r.percentDiff).toFixed(1)}%
        </span>
      );
    }},
    { key: 'complianceLabel', header: 'Status', align: 'center' as const, render: (r: RouteComparison) => <Badge variant={r.complianceLabel} /> },
    { key: 'complianceBalance', header: 'CB (units)', align: 'right' as const, render: (r: RouteComparison) => (
      <span className={r.complianceBalance >= 0 ? 'text-emerald-700 font-semibold' : 'text-red-600 font-semibold'}>
        {r.complianceBalance >= 0 ? '+' : ''}{r.complianceBalance.toLocaleString()}
      </span>
    )},
  ];

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="gradient-ocean px-6 py-4">
          <h2 className="text-white font-bold text-lg">Route Comparison Analysis</h2>
          <p className="text-white/70 text-sm mt-0.5">
            {mockComparisons.length} routes compared against baseline{' '}
            <span className="font-semibold text-white">{baselineRoute.id} ({baselineRoute.vesselName})</span>
          </p>
        </div>
        <div className="px-4 py-2 bg-indigo-50/50 border-t border-gray-100 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 bg-emerald-500 rounded-sm" /> Compliant (below {TARGET_GHG} g/MJ)</div>
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 bg-red-500 rounded-sm" /> Non-compliant</div>
          <div className="flex items-center gap-2"><span className="inline-block w-8 h-0.5 bg-orange-400 border-dashed" style={{ borderTop: '2px dashed #FB923C' }} /> Target limit</div>
        </div>
      </div>

      {/* Bar Chart */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">GHG Intensity vs. Target by Route</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="route" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 120]} tick={{ fontSize: 12 }} unit=" g" />
            <Tooltip
              formatter={(v: number) => [`${v} g/MJ`, 'GHG Intensity']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
            />
            <ReferenceLine y={TARGET_GHG} stroke="#FB923C" strokeDasharray="6 3" label={{ value: `Target: ${TARGET_GHG}`, position: 'right', fontSize: 11, fill: '#FB923C' }} />
            <Bar dataKey="ghg" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.compliant ? '#10B981' : '#EF4444'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Comparison Table */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Detailed Comparison</h3>
          <p className="text-xs text-gray-400 mt-0.5">% difference calculated from baseline GHG: {baselineRoute.ghgIntensity} g/MJ</p>
        </div>
        <div className="p-4">
          <Table columns={columns} data={mockComparisons} keyExtractor={(r) => r.routeId} />
        </div>
      </Card>

      {/* Baseline summary */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">B</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-900">Baseline Route: {baselineRoute.id}</p>
          <p className="text-xs text-indigo-600 mt-0.5">{baselineRoute.vesselName} — GHG: {baselineRoute.ghgIntensity} g/MJ</p>
        </div>
      </div>
    </div>
  );
}

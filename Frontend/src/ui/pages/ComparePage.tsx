import { useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, DotProps } from 'recharts';
import { Loader2, AlertCircle } from 'lucide-react';
import { Table } from '../components/Table';
import { Card } from '../components/Card';
import { getComparison } from '../../adapters/api/client';
import { useAsync } from '../../shared/hooks';
import { useBaseline } from '../context/BaselineContext';

export function ComparePage() {
  const { baselineRouteId } = useBaseline();
  const fetchCompareFn = useCallback(() => getComparison(baselineRouteId || undefined), [baselineRouteId]);
  const { status, data, error } = useAsync(fetchCompareFn);

  if (status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500">
        <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
        <p>Analyzing baseline differentials from database...</p>
      </div>
    );
  }

  if (status === 'error' || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-red-500 bg-red-50 rounded-xl border border-red-100">
        <AlertCircle size={32} className="mb-4" />
        <p className="font-semibold text-lg">{error || 'No data found'}</p>
        <p className="text-sm mt-2 opacity-80">Check the backend connection and try again.</p>
      </div>
    );
  }

  // The API returns an object { details: [ ... ] }.
  const comparisons = data?.details || [];
  const baselineRouteIdFromApi = data?.baselineRouteId;

  const chartData = comparisons.map(c => ({
    route: c.routeId,
    ghg: c.ghgIntensity,
    compliant: c.compliant,
  }));

  const baselineNode = comparisons.find(c => c.routeId === baselineRouteIdFromApi) || comparisons.find(c => c.percentDiff === 0);

  const formatRouteId = (routeId: string) => {
    if (routeId.length <= 14) return routeId;
    return `${routeId.slice(0, 8)}…${routeId.slice(-4)}`;
  };

  const formatPercentDiff = (value: number, isBaseline: boolean) => {
    if (isBaseline) return <span className="text-gray-400 font-medium">— Baseline —</span>;
    const sign = value > 0 ? '+' : '';
    const color = value > 0 ? 'text-red-500' : 'text-emerald-500';
    return <span className={`${color} font-bold`}>{sign}{value.toFixed(2)}%</span>;
  };

  const columns = [
    { key: 'routeId', header: 'Route ID', render: (c: any) => <span title={c.routeId} className="font-mono text-xs font-semibold">{formatRouteId(c.routeId)}</span> },
    { key: 'vesselName', header: 'Vessel' },
    { key: 'ghgIntensity', header: 'GHG (gCO2e/MJ)', align: 'right' as const, render: (c: any) => (
      <span className={c.compliant ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
        {c.ghgIntensity.toFixed(1)}
      </span>
    )},
    { key: 'percentDiff', header: 'Diff % vs Baseline', align: 'right' as const, render: (c: any) => formatPercentDiff(c.percentDiff, c.routeId === baselineRouteIdFromApi) },
    { key: 'compliant', header: 'Meets Target', align: 'center' as const, render: (c: any) => (
      <span className={c.compliant ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
        {c.compliant ? 'Yes' : 'No'}
      </span>
    )},
    { key: 'complianceBalance', header: 'CB (units)', align: 'right' as const, render: (c: any) => (
      <span className={c.complianceBalance >= 0 ? 'text-emerald-700 font-semibold' : 'text-red-600 font-semibold'}>
        {c.complianceBalance >= 0 ? '+' : ''}{c.complianceBalance.toLocaleString()}
      </span>
    )},
  ];

  const TARGET_GHG = 89.3368;

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="gradient-ocean px-6 py-4">
          <h2 className="text-white font-bold text-lg">Route Comparison Analysis</h2>
          {baselineNode ? (
            <p className="text-white/70 text-sm mt-0.5">
              {comparisons.length} routes compared against baseline{' '}
              <span className="font-semibold text-white">{baselineNode.routeId} ({baselineNode.vesselName})</span>
            </p>
          ) : (
            <p className="text-white/70 text-sm mt-0.5">No baseline route selected.</p>
          )}
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
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="route" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 120]} tick={{ fontSize: 12 }} unit=" g" />
            <Tooltip
              formatter={(v: any) => [`${v} g/MJ`, 'GHG Intensity']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
            />
            <ReferenceLine y={TARGET_GHG} stroke="#FB923C" strokeDasharray="6 3" label={{ value: `Target: ${TARGET_GHG}`, position: 'right', fontSize: 11, fill: '#FB923C' }} />
            <Line
              type="monotone"
              dataKey="ghg"
              stroke="#2563EB"
              strokeWidth={3}
              dot={(props: DotProps) => {
                const payload = props.payload as { compliant: boolean } | undefined;
                const fill = payload?.compliant ? '#10B981' : '#EF4444';
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={5}
                    fill={fill}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Comparison Table */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Detailed Comparison</h3>
          {baselineNode && (
            <p className="text-xs text-gray-400 mt-0.5">% difference calculated from baseline GHG: {baselineNode.ghgIntensity} g/MJ</p>
          )}
        </div>
        <div className="p-4">
          {comparisons.length > 0 ? (
            <Table columns={columns} data={comparisons} keyExtractor={(r) => r.routeId} />
          ) : (
            <p className="text-center text-sm text-gray-500 py-10">Please select a Baseline Route from the Routes page.</p>
          )}
        </div>
      </Card>

      {/* Baseline summary */}
      {baselineNode && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">B</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-900">Baseline Route: {baselineNode.routeId}</p>
            <p className="text-xs text-indigo-600 mt-0.5">{baselineNode.vesselName} — GHG: {baselineNode.ghgIntensity} g/MJ</p>
          </div>
        </div>
      )}
    </div>
  );
}

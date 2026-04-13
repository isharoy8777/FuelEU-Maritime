import { useState, useMemo, useCallback } from 'react';
import { Users, Layers, AlertCircle, CheckCircle2, Clock, Loader2, X } from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { getAdjustedCB, createPool as createPoolAPI, getPools } from '../../adapters/api/client';
import { useAsync } from '../../shared/hooks';
import type { Pool } from '../../shared/types';

export function PoolingPage() {
  const fetchCompareFn = useCallback(() => getAdjustedCB(2025), []);
  const { status, data, error } = useAsync(fetchCompareFn);
  const { data: pools, execute: refreshPools } = useAsync(useCallback(() => getPools(), []));

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const shipsWithCB = useMemo(() => {
    if (!data) return [];
    return data.map(c => ({
      id: c.shipId,
      vesselName: c.shipName,
      cbBefore: c.cbAfter,
      isSurplus: c.cbAfter >= 0,
    }));
  }, [data]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
    setFeedback(null);
  };

  const selectedShips = shipsWithCB.filter(s => selectedIds.has(s.id));
  
  // Calculate aggregate metrics
  const totalCb = selectedShips.reduce((acc, s) => acc + s.cbBefore, 0);
  const isValidPool = totalCb >= 0;

  // Run greedy redistribution algorithm on selected ships
  const distributedMembers = useMemo(() => {
    const list = selectedShips.map(s => ({
      routeId: s.id,
      shipName: s.vesselName,
      cbBefore: s.cbBefore,
      cbAfter: s.cbBefore,
      isSurplus: s.isSurplus,
    }));
    
    if (isValidPool && list.length > 0) {
      let remainingDeficit = list.filter(m => !m.isSurplus).reduce((sum, m) => sum + Math.abs(m.cbBefore), 0);
      
      // Zero out all deficits since they are covered
      list.filter(m => !m.isSurplus).forEach(m => m.cbAfter = 0);
      
      // Greedily consume surplus from surplus ships
      list.filter(m => m.isSurplus).forEach(m => {
        if (remainingDeficit > 0) {
          if (m.cbBefore >= remainingDeficit) {
            m.cbAfter = m.cbBefore - remainingDeficit;
            remainingDeficit = 0;
          } else {
            m.cbAfter = 0;
            remainingDeficit -= m.cbBefore;
          }
        }
      });
    }

    return list;
  }, [selectedShips, isValidPool]);

  const handleCreatePool = async () => {
    if (selectedIds.size < 2) {
      setFeedback({ message: 'Select at least 2 ships to form a pool.', type: 'error' });
      return;
    }
    if (!isValidPool) {
      setFeedback({ message: 'Invalid Pool: Total combined CB must be >= 0.', type: 'error' });
      return;
    }

    setIsMutating(true);
    try {
      await createPoolAPI({
        name: `Pool ${new Date().toISOString().slice(0, 10)}`,
        year: 2025,
        members: selectedShips.map((ship) => ({
          shipId: ship.id,
          shipName: ship.vesselName,
          complianceBalance: ship.cbBefore,
        })),
      });

      await refreshPools();
      setFeedback({ message: `Successfully created pool dynamically via Network.`, type: 'success' });
      setSelectedIds(new Set());
    } catch (e: any) {
      setFeedback({ message: e.message || 'Error creating pool', type: 'error' });
    } finally {
      setIsMutating(false);
    }
  };

  if (status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500">
        <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
        <p>Analyzing routes to gather Live CB values for pooling...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-red-500 bg-red-50 rounded-xl border border-red-100">
        <AlertCircle size={32} className="mb-4" />
        <p className="font-semibold text-lg">{error || 'Failed to fetch global routes'}</p>
      </div>
    );
  }


  const selectionColumns = [
    { key: 'select', header: '', align: 'center' as const, render: (s: any) => (
      <input 
        type="checkbox" 
        checked={selectedIds.has(s.id)} 
        onChange={() => toggleSelection(s.id)}
        className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
      />
    )},
    { key: 'id', header: 'Route ID', render: (s: any) => <span className="font-mono text-xs">{s.id}</span> },
    { key: 'vesselName', header: 'Vessel' },
    { key: 'cbBefore', header: 'CB Before', align: 'right' as const, render: (s: any) => (
      <span className={s.isSurplus ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
        {s.isSurplus ? '+' : ''}{(s.cbBefore ?? 0).toLocaleString()}
      </span>
    )},
    { key: 'status', header: 'Status', align: 'center' as const, render: (s: any) => (
       <Badge variant={s.isSurplus ? 'SURPLUS' : 'DEFICIT'} />
    )}
  ];

  const poolColumns = [
    { key: 'name', header: 'Pool Name', render: (p: any) => <span className="font-medium text-gray-800">{p.name}</span> },
    { key: 'year', header: 'Year', align: 'center' as const },
    { key: 'members', header: 'Members', align: 'center' as const },
    { key: 'totalCB', header: 'Total Net CB', align: 'right' as const, render: (p: any) => (
      <span className={p.totalCB >= 0 ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
        {p.totalCB >= 0 ? '+' : ''}{p.totalCB.toLocaleString()}
      </span>
    )},
    { key: 'status', header: 'Status', align: 'center' as const, render: (p: any) => <Badge variant={p.status} /> },
    { key: 'createdAt', header: 'Created', render: (p: any) => (
      <span className="flex items-center gap-1 text-gray-500 text-xs"><Clock size={11} /> {p.createdAt}</span>
    )},
  ];

  return (
    <div className="space-y-5">
      {feedback && (
        <div className={`px-4 py-3 rounded-lg flex items-center border ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <span className="font-semibold text-sm">{feedback.message}</span>
          <button className="ml-auto text-current opacity-70 hover:opacity-100" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {/* Hero Pool Configurator Area */}
      <div className="grid grid-cols-12 gap-5">
        
        {/* Left Column: Selection */}
        <div className="col-span-12 lg:col-span-7">
          <Card padding={false} className="h-full flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-800">
                <Users size={18} />
                <h3 className="font-bold">Select Ships for Pooling</h3>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">
                {selectedIds.size} Selected
              </span>
            </div>
            <div className="p-4 flex-1">
              <Table columns={selectionColumns} data={shipsWithCB} keyExtractor={(s) => s.id} />
            </div>
          </Card>
        </div>

        {/* Right Column: Pool Summary & Action */}
        <div className="col-span-12 lg:col-span-5 space-y-5">
          {/* Status Indicator */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide font-bold mb-1">Pool Total CB</p>
              <h2 className={`text-4xl font-black ${totalCb >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {totalCb >= 0 ? '+' : ''}{totalCb.toLocaleString()}
              </h2>
            </div>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${totalCb >= 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
              {totalCb >= 0 ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
            </div>
          </div>

          {/* Allocation Breakdown */}
          <Card padding={false} className="flex-1">
             <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">Live Redistribution</h3>
             </div>
             <div className="p-4">
                {distributedMembers.length > 0 ? (
                  <div className="space-y-3">
                    {distributedMembers.map(m => (
                      <div key={m.routeId} className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg border border-gray-100">
                         <div className="font-semibold text-gray-700 w-1/3 truncate">{m.shipName}</div>
                         <div className={`w-1/3 text-right font-medium ${m.isSurplus ? 'text-emerald-600' : 'text-red-600'}`}>
                            {m.isSurplus ? '+' : ''}{m.cbBefore.toLocaleString()} ➔ 
                         </div>
                         <div className="w-1/3 text-right font-bold text-gray-800">
                            {m.cbAfter.toLocaleString()} CB
                         </div>
                      </div>
                    ))}
                    <Button onClick={handleCreatePool} className="w-full mt-4 h-11" variant={isValidPool ? 'primary' : 'danger'} disabled={isMutating}>
                      {isValidPool ? 'Create Valid Pool' : 'Invalid Pool'}
                    </Button>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                    <Layers size={32} className="mb-3 opacity-50" />
                    <p className="text-sm">Select ships to preview redistribution</p>
                  </div>
                )}
             </div>
          </Card>
        </div>
      </div>

      {/* Historical Pools Table */}
      <h3 className="font-bold text-gray-800 text-lg mt-8 pt-4 border-t border-gray-200">Historical Fleet Pools</h3>
      <Card padding={false}>
         <div className="p-4">
            <Table columns={poolColumns} data={pools || []} keyExtractor={(p) => p.id} onRowClick={(p) => setSelectedPool(p as Pool)} />
         </div>
      </Card>

      {selectedPool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4" onClick={() => setSelectedPool(null)}>
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{selectedPool.name} Members</h3>
                <p className="text-xs text-gray-500">Year {selectedPool.year} • {selectedPool.members} members</p>
              </div>
              <button className="rounded-md p-2 text-gray-500 hover:bg-gray-100" onClick={() => setSelectedPool(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-5">
              {selectedPool.memberDetails && selectedPool.memberDetails.length > 0 ? (
                <div className="space-y-3">
                  {selectedPool.memberDetails.map((member) => (
                    <div key={member.id} className="grid grid-cols-12 gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                      <div className="col-span-12 md:col-span-3">
                        <p className="text-xs text-gray-500">Ship</p>
                        <p className="font-semibold text-gray-800">{member.shipName}</p>
                        <p className="font-mono text-xs text-gray-500">{member.shipId}</p>
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <p className="text-xs text-gray-500">CB Before</p>
                        <p className={member.cbBefore >= 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-red-600'}>
                          {member.cbBefore >= 0 ? '+' : ''}{member.cbBefore.toLocaleString()}
                        </p>
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <p className="text-xs text-gray-500">CB After</p>
                        <p className={member.cbAfter >= 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-red-600'}>
                          {member.cbAfter >= 0 ? '+' : ''}{member.cbAfter.toLocaleString()}
                        </p>
                      </div>
                      <div className="col-span-6 md:col-span-3">
                        <p className="text-xs text-gray-500">Contributed</p>
                        <p className="font-semibold text-gray-800">{member.contributedAmount.toLocaleString()}</p>
                      </div>
                      <div className="col-span-6 md:col-span-2 flex items-end justify-start md:justify-end">
                        <Badge variant={member.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-gray-500">No member details available for this pool.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

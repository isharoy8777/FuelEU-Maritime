import { useState, useMemo } from 'react';
import { Users, Layers, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { mockRoutes } from '../../api/mock';
import { useAppContext } from '../context/AppContext';

const TARGET_GHG = 89.3368;

export function PoolingPage() {
  const { pools, addPool } = useAppContext();
  
  // Calculate dynamic CB for all routes
  const shipsWithCB = useMemo(() => {
    return mockRoutes.map(r => {
      const cb = Math.floor((TARGET_GHG - r.ghgIntensity) * r.fuelConsumption * 123.4);
      return { ...r, cbBefore: cb, isSurplus: cb >= 0 };
    });
  }, []);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  const handleCreatePool = () => {
    if (selectedIds.size < 2) {
      setFeedback({ message: 'Select at least 2 ships to form a pool.', type: 'error' });
      return;
    }
    if (!isValidPool) {
      setFeedback({ message: 'Invalid Pool: Total combined CB must be >= 0.', type: 'error' });
      return;
    }

    const newPool = {
      id: `POOL-${Date.now().toString().slice(-6)}`,
      name: `Fleet Group ${pools.length + 1}`,
      year: 2025,
      members: selectedIds.size,
      totalCB: totalCb,
      status: 'VALID' as const,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    addPool(newPool);
    setFeedback({ message: `Successfully created ${newPool.name} with ${selectedIds.size} ships.`, type: 'success' });
    setSelectedIds(new Set());
  };


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
        {s.isSurplus ? '+' : ''}{s.cbBefore.toLocaleString()}
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
      <span className="text-emerald-700 font-bold">+{p.totalCB.toLocaleString()}</span>
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
                    <Button onClick={handleCreatePool} className="w-full mt-4 h-11" variant={isValidPool ? 'primary' : 'danger'}>
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
            <Table columns={poolColumns} data={pools} keyExtractor={(p) => p.id} />
         </div>
      </Card>
    </div>
  );
}

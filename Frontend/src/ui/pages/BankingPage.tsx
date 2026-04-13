import { useState, useCallback, useEffect } from 'react';
import { TrendingUp, Wallet, ArrowDownCircle, Clock, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { Card, KpiCard } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import type { BankEntry, BankingFleetTotal } from '../../shared/types';
import { getComplianceCB, bankSurplus, applyBanked, getBankRecords, getBankTotals, getRoutes } from '../../adapters/api/client';
import { useAsync } from '../../shared/hooks';

export function BankingPage() {
  const [selectedShipId, setSelectedShipId] = useState('');
  const [bankFormAmount, setBankFormAmount] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const fetchRoutesFn = useCallback(() => getRoutes(), []);
  const { status: routesStatus, data: routes = [], error: routesError } = useAsync(fetchRoutesFn);
  const safeRoutes = routes ?? [];

  useEffect(() => {
    if (!selectedShipId && safeRoutes.length > 0) {
      setSelectedShipId(safeRoutes[0].id);
    }
  }, [safeRoutes, selectedShipId]);

  const selectedRoute = safeRoutes.find((route) => route.id === selectedShipId) || null;
  const selectedYear = selectedRoute?.year ?? 2025;

  const fetchCbFn = useCallback(() => {
    if (!selectedShipId) return Promise.resolve({ cbBefore: 0 });
    return getComplianceCB(selectedShipId, selectedYear);
  }, [selectedShipId, selectedYear]);
  const { status, data, error, execute: refreshCb } = useAsync(fetchCbFn, !!selectedShipId);

  const fetchRecordsFn = useCallback(() => {
    if (!selectedShipId) return Promise.resolve([]);
    return getBankRecords(selectedShipId, selectedYear);
  }, [selectedShipId, selectedYear]);
  const { data: liveHistory, execute: refreshRecords } = useAsync(fetchRecordsFn, !!selectedShipId);

  const fetchTotalsFn = useCallback(() => getBankTotals(selectedYear), [selectedYear]);
  const { data: fleetTotals, execute: refreshTotals } = useAsync(fetchTotalsFn, !!selectedShipId);

  if (routesStatus === 'pending' || (status === 'pending' && !data)) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500">
        <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
        <p>Loading ships and live compliance data...</p>
      </div>
    );
  }

  if (routesStatus === 'error') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-red-500 bg-red-50 rounded-xl border border-red-100">
        <AlertCircle size={32} className="mb-4" />
        <p className="font-semibold text-lg">{routesError || 'Failed to load routes'}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-red-500 bg-red-50 rounded-xl border border-red-100">
        <AlertCircle size={32} className="mb-4" />
        <p className="font-semibold text-lg">{error || 'Failed to calculate compliance balance'}</p>
      </div>
    );
  }

  const cbBefore = Math.floor(data?.cbBefore || 0);
  const isSurplus = cbBefore > 0;
  const shipName = selectedRoute?.vesselName || 'Select a ship';
  const displayHistory = liveHistory || [];
  const totalBanked = displayHistory
    .filter((entry) => entry.type === 'BANK')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const appliedAmount = displayHistory
    .filter((entry) => entry.type === 'APPLY')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const bankedCreditsAvailable = totalBanked - appliedAmount;
  const cbAfter = cbBefore - totalBanked + appliedAmount;
  const actionMode = isSurplus ? 'BANK' : 'APPLY';
  const commonBankedAvailable = (fleetTotals || []).reduce((sum, row) => sum + row.bankedAvailable, 0);

  const handleBank = async () => {
    const amt = parseInt(bankFormAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      setFeedback({ message: 'Please enter a valid amount greater than 0', type: 'error' });
      return;
    }
    if (amt > cbBefore) {
      setFeedback({ message: `Cannot bank more than available surplus (${cbBefore})`, type: 'error' });
      return;
    }

    setIsMutating(true);
    try {
      await bankSurplus({ shipId: selectedShipId, shipName, year: selectedYear, amount: amt });
      await refreshRecords();
      await refreshCb();
      await refreshTotals();

      setFeedback({ message: `Successfully banked ${amt.toLocaleString()} CB. Network confirmed.`, type: 'success' });
      setBankFormAmount('');
    } catch (e: any) {
      setFeedback({ message: e.message || 'Operation failed on server', type: 'error' });
    } finally {
      setIsMutating(false);
    }
  };

  const handleApply = async () => {
    const amt = parseInt(bankFormAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      setFeedback({ message: 'Please enter a valid amount greater than 0', type: 'error' });
      return;
    }
    if (amt > bankedCreditsAvailable) {
      setFeedback({ message: `Cannot apply more than available banked credits (${bankedCreditsAvailable})`, type: 'error' });
      return;
    }

    setIsMutating(true);
    try {
      await applyBanked({ shipId: selectedShipId, shipName, year: selectedYear, amount: amt });
      await refreshRecords();
      await refreshCb();
      await refreshTotals();

      setFeedback({ message: `Successfully applied ${amt.toLocaleString()} CB via Network.`, type: 'success' });
      setBankFormAmount('');
    } catch (e: any) {
      setFeedback({ message: e.message || 'Operation failed on server', type: 'error' });
    } finally {
      setIsMutating(false);
    }
  };

  const historyColumns = [
    { key: 'shipName', header: 'Ship' },
    { key: 'year', header: 'Year', align: 'center' as const },
    { key: 'type', header: 'Type', align: 'center' as const, render: (e: BankEntry) => <Badge variant={e.type} /> },
    { key: 'amount', header: 'Amount (CB)', align: 'right' as const, render: (e: BankEntry) => (
      <span className={e.type === 'BANK' ? 'text-emerald-600 font-semibold' : 'text-orange-600 font-semibold'}>
        {e.type === 'BANK' ? '+' : '-'}{e.amount.toLocaleString()}
      </span>
    )},
    { key: 'timestamp', header: 'Timestamp', render: (e: BankEntry) => (
      <span className="flex items-center gap-1 text-gray-500 text-xs"><Clock size={11} /> {e.timestamp}</span>
    )},
  ];

  const fleetColumns = [
    { key: 'shipName', header: 'Ship' },
    { key: 'shipId', header: 'Ship ID', render: (row: BankingFleetTotal) => <span className="font-mono text-xs">{row.shipId}</span> },
    { key: 'currentCB', header: 'Current CB', align: 'right' as const, render: (row: BankingFleetTotal) => (
      <span className={row.currentCB >= 0 ? 'text-emerald-700 font-semibold' : 'text-red-600 font-semibold'}>
        {row.currentCB >= 0 ? '+' : ''}{row.currentCB.toLocaleString()}
      </span>
    ) },
    { key: 'year', header: 'Year', align: 'center' as const },
  ];

  return (
    <div className="space-y-5">
      {feedback && (
        <div className={`px-4 py-3 rounded-lg flex items-center border ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <span className="font-semibold text-sm">{feedback.message}</span>
          <button className="ml-auto text-current opacity-70 hover:opacity-100" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-1">Selected Ship</p>
            <div className="relative min-w-70 max-w-full">
              <select
                value={selectedShipId}
                onChange={(e) => {
                  setSelectedShipId(e.target.value);
                  setFeedback(null);
                  setBankFormAmount('');
                }}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                {safeRoutes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.vesselName} · {route.id}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full text-xs font-semibold ${isSurplus ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
            {actionMode === 'BANK' ? 'Bank surplus available' : 'Apply banked credits'}
          </div>
        </div>
      </Card>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`px-6 py-5 flex items-center justify-between ${isSurplus ? 'gradient-ocean' : 'gradient-red'}`}>
          <div>
            <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Current Ship Compliance Balance</p>
            <p className="text-white text-4xl font-bold mt-1">{cbBefore >= 0 ? '+' : ''}{cbBefore.toLocaleString()} CB</p>
            <p className="text-white/70 text-sm mt-1">Status: <span className="font-semibold text-white">{isSurplus ? 'SURPLUS' : 'DEFICIT'}</span> - {shipName} ({selectedYear})</p>
          </div>
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center">
            {isSurplus ? <TrendingUp size={32} className="text-white" /> : <ArrowDownCircle size={32} className="text-white" />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <KpiCard title="cb_before" value={`${cbBefore >= 0 ? '+' : ''}${cbBefore.toLocaleString()}`} gradient={isSurplus ? 'blue' : 'amber'} />
        <KpiCard title="applied" value={`-${appliedAmount.toLocaleString()}`} gradient="amber" />
        <KpiCard title="cb_after" value={`${cbAfter >= 0 ? '+' : ''}${cbAfter.toLocaleString()}`} gradient={cbAfter >= 0 ? 'green' : 'red'} />
        <KpiCard title="Common Banked Credits (Fleet)" value={`${commonBankedAvailable >= 0 ? '+' : ''}${commonBankedAvailable.toLocaleString()}`} gradient="green" icon={<Wallet size={18} />} />
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isSurplus ? 'gradient-ocean' : 'gradient-red'}`}>
            {isSurplus ? <Wallet size={18} className="text-white" /> : <ArrowDownCircle size={18} className="text-white" />}
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{isSurplus ? 'Bank Surplus' : 'Apply Banked Credits'}</h3>
            <p className="text-xs text-gray-400">{isSurplus ? 'Store excess CB for future use' : 'Use stored CB to offset a deficit'}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Selected Ship</label>
            <input type="text" value={shipName} disabled className="w-full px-3 py-2.5 text-sm bg-gray-100 text-gray-500 border border-gray-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Amount (CB)</label>
            <input
              type="number"
              placeholder={isSurplus ? 'e.g. 50000' : 'e.g. 10000'}
              value={bankFormAmount}
              onChange={(e) => setBankFormAmount(e.target.value)}
              className={`w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${isSurplus ? 'focus:ring-sky-300' : 'focus:ring-orange-300'}`}
            />
          </div>
          <p className="text-xs text-gray-400">{isSurplus ? '✓ Must be in surplus to bank.' : '✓ Requires existing banked balance.'}</p>
          <Button
            variant={isSurplus ? 'primary' : 'danger'}
            onClick={isSurplus ? handleBank : handleApply}
            disabled={(isSurplus ? cbBefore <= 0 : bankedCreditsAvailable <= 0) || isMutating}
            className="w-full mt-1"
          >
            {isSurplus ? 'BANK SURPLUS' : 'APPLY CREDITS'}
          </Button>
        </div>
      </Card>

      <Card padding={false}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          <h3 className="font-semibold text-gray-800">Ship Banking Activity</h3>
        </div>
        <div className="p-4">
          <Table columns={historyColumns} data={displayHistory} keyExtractor={(e) => e.id} />
        </div>
      </Card>

      <Card padding={false}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Wallet size={16} className="text-gray-400" />
          <h3 className="font-semibold text-gray-800">Fleet Banked Surplus Totals</h3>
        </div>
        <div className="p-4">
          <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
            Common Banked Available (Fleet): {commonBankedAvailable >= 0 ? '+' : ''}{commonBankedAvailable.toLocaleString()}
          </div>
          <Table columns={fleetColumns} data={fleetTotals || []} keyExtractor={(row) => row.shipId} />
        </div>
      </Card>
    </div>
  );
}

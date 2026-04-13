import { useState } from 'react';
import { TrendingUp, Wallet, ArrowDownCircle, Clock } from 'lucide-react';
import { Card, KpiCard } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { mockRoutes } from '../../api/mock';
import type { BankEntry } from '../../shared/types';
import { useAppContext } from '../context/AppContext';
import { useBaseline } from '../context/BaselineContext';

const TARGET_GHG = 89.3368;

export function BankingPage() {
  const { bankedCredits, setBankedCredits, bankHistory, addBankHistory } = useAppContext();
  const { baselineRouteId } = useBaseline();
  
  const ship = mockRoutes.find((r) => r.id === baselineRouteId) || mockRoutes[0];
  
  // Calculate dynamic CB
  const cbBefore = Math.floor((TARGET_GHG - ship.ghgIntensity) * ship.fuelConsumption * 123.4);
  const isSurplus = cbBefore > 0;

  const [bankFormAmount, setBankFormAmount] = useState('');
  const [applyFormAmount, setApplyFormAmount] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleBank = () => {
    const amt = parseInt(bankFormAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      setFeedback({ message: 'Please enter a valid amount greater than 0', type: 'error' });
      return;
    }
    if (amt > cbBefore) {
      setFeedback({ message: `Cannot bank more than available surplus (${cbBefore})`, type: 'error' });
      return;
    }
    
    setBankedCredits((prev) => prev + amt);
    addBankHistory({
      id: `BNK-${Date.now()}`,
      shipName: ship.vesselName,
      year: ship.year,
      type: 'BANK',
      amount: amt,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
    });
    setFeedback({ message: `Successfully banked ${amt.toLocaleString()} CB`, type: 'success' });
    setBankFormAmount('');
  };

  const handleApply = () => {
    const amt = parseInt(applyFormAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      setFeedback({ message: 'Please enter a valid amount greater than 0', type: 'error' });
      return;
    }
    if (amt > bankedCredits) {
      setFeedback({ message: `Cannot apply more than available banked credits (${bankedCredits})`, type: 'error' });
      return;
    }

    setBankedCredits((prev) => prev - amt);
    addBankHistory({
      id: `BNK-${Date.now()}`,
      shipName: ship.vesselName,
      year: ship.year,
      type: 'APPLY',
      amount: amt,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
    });
    setFeedback({ message: `Successfully applied ${amt.toLocaleString()} CB to deficit`, type: 'success' });
    setApplyFormAmount('');
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

  return (
    <div className="space-y-5">
      {feedback && (
        <div className={`px-4 py-3 rounded-lg flex items-center border ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <span className="font-semibold text-sm">{feedback.message}</span>
          <button className="ml-auto text-current opacity-70 hover:opacity-100" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {/* Hero CB card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`px-6 py-5 flex items-center justify-between ${isSurplus ? 'gradient-ocean' : 'gradient-red'}`}>
          <div>
             <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Current Ship Compliance Balance</p>
            <p className="text-white text-4xl font-bold mt-1">{cbBefore >= 0 ? '+' : ''}{cbBefore.toLocaleString()} CB</p>
            <p className="text-white/70 text-sm mt-1">Status: <span className="font-semibold text-white">{isSurplus ? 'SURPLUS' : 'DEFICIT'}</span> — {ship.vesselName}</p>
          </div>
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center">
            {isSurplus ? <TrendingUp size={32} className="text-white" /> : <ArrowDownCircle size={32} className="text-white" />}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4">
        <KpiCard title="Total Banked Credits Available" value={`+${bankedCredits.toLocaleString()}`} gradient="green" icon={<Wallet size={18} />} />
        <KpiCard title="Ship CB Before Action" value={`${cbBefore >= 0 ? '+' : ''}${cbBefore.toLocaleString()}`} gradient={isSurplus ? 'blue' : 'amber'} />
      </div>

      {/* Action Forms — 2 columns */}
      <div className="grid grid-cols-2 gap-5">
        {/* Bank Surplus */}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 gradient-ocean rounded-lg flex items-center justify-center flex-shrink-0">
              <Wallet size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Bank Surplus</h3>
              <p className="text-xs text-gray-400">Store excess CB for future use</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Selected Ship</label>
              <input type="text" value={ship.vesselName} disabled className="w-full px-3 py-2.5 text-sm bg-gray-100 text-gray-500 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Amount to Bank (CB)</label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={bankFormAmount}
                onChange={(e) => setBankFormAmount(e.target.value)}
                disabled={!isSurplus}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-gray-400">✓ Must be in surplus to bank.</p>
            <Button onClick={handleBank} disabled={!isSurplus} className="w-full mt-1">
              BANK SURPLUS
            </Button>
          </div>
        </Card>

        {/* Apply Banked Credits */}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 gradient-red rounded-lg flex items-center justify-center flex-shrink-0">
              <ArrowDownCircle size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Apply Banked Credits</h3>
              <p className="text-xs text-gray-400">Use stored CB to offset a deficit</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Selected Ship</label>
              <input type="text" value={ship.vesselName} disabled className="w-full px-3 py-2.5 text-sm bg-gray-100 text-gray-500 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Amount to Apply (CB)</label>
              <input
                type="number"
                placeholder="e.g. 10000"
                value={applyFormAmount}
                onChange={(e) => setApplyFormAmount(e.target.value)}
                disabled={bankedCredits <= 0}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-gray-400">✓ Requires existing banked balance.</p>
            <Button variant="danger" disabled={bankedCredits <= 0} onClick={handleApply} className="w-full mt-1">
              APPLY CREDITS
            </Button>
          </div>
        </Card>
      </div>

      {/* History Table */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          <h3 className="font-semibold text-gray-800">Global Banking Activity</h3>
        </div>
        <div className="p-4">
          <Table columns={historyColumns} data={bankHistory} keyExtractor={(e) => e.id} />
        </div>
      </Card>
    </div>
  );
}

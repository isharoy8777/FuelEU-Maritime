import { useState } from 'react';
import { TrendingUp, Wallet, ArrowDownCircle, Clock } from 'lucide-react';
import { Card, KpiCard } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { mockBankingSummary, mockBankHistory } from '../../api/mock';
import type { BankEntry } from '../../shared/types';

export function BankingPage() {
  const [bankForm, setBankForm] = useState({ shipName: '', year: '', amount: '' });
  const [applyForm, setApplyForm] = useState({ shipName: '', year: '', amount: '' });
  const s = mockBankingSummary;

  const historyColumns = [
    { key: 'shipName', header: 'Ship' },
    { key: 'year', header: 'Year', align: 'center' as const },
    { key: 'type', header: 'Type', align: 'center' as const, render: (e: BankEntry) => <Badge variant={e.type} /> },
    { key: 'amount', header: 'Amount (CB)', align: 'right' as const, render: (e: BankEntry) => (
      <span className={e.type === 'BANK' ? 'text-sky-700 font-semibold' : 'text-orange-600 font-semibold'}>
        {e.type === 'BANK' ? '+' : '-'}{e.amount.toLocaleString()}
      </span>
    )},
    { key: 'timestamp', header: 'Timestamp', render: (e: BankEntry) => (
      <span className="flex items-center gap-1 text-gray-500 text-xs"><Clock size={11} /> {e.timestamp}</span>
    )},
  ];

  return (
    <div className="space-y-5">
      {/* Hero CB card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="gradient-ocean px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Current Compliance Balance</p>
            <p className="text-white text-4xl font-bold mt-1">+{s.cbBefore.toLocaleString()} CB</p>
            <p className="text-white/70 text-sm mt-1">Status: <span className="font-semibold text-white">SURPLUS</span> — {s.shipName}</p>
          </div>
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center">
            <TrendingUp size={32} className="text-white" />
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="CB Before Banking" value={`+${s.cbBefore.toLocaleString()}`} gradient="blue" icon={<Wallet size={18} />} />
        <KpiCard title="Amount Applied" value={s.applied.toLocaleString()} gradient="amber" />
        <KpiCard title="CB After Banking" value={`+${s.cbAfter.toLocaleString()}`} gradient="green" />
      </div>

      {/* Action Forms — 2 columns */}
      <div className="grid grid-cols-2 gap-5">
        {/* Bank Surplus */}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 gradient-blue rounded-lg flex items-center justify-center flex-shrink-0">
              <Wallet size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Bank Surplus</h3>
              <p className="text-xs text-gray-400">Store excess CB for future use</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Ship Name', key: 'shipName', placeholder: 'e.g. MV Nordica' },
              { label: 'Year', key: 'year', placeholder: '2025' },
              { label: 'Amount to Bank (CB)', key: 'amount', placeholder: '100000' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
                <input
                  type={key === 'amount' || key === 'year' ? 'number' : 'text'}
                  placeholder={placeholder}
                  value={bankForm[key as keyof typeof bankForm]}
                  onChange={(e) => setBankForm((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>
            ))}
            <p className="text-xs text-gray-400">✓ Amount must be &gt; 0 and CB must be in surplus</p>
            <Button className="w-full mt-1">BANK SURPLUS</Button>
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
            {[
              { label: 'Ship Name', key: 'shipName', placeholder: 'e.g. MV Caspian Bridge' },
              { label: 'Year', key: 'year', placeholder: '2025' },
              { label: 'Amount to Apply (CB)', key: 'amount', placeholder: '80000' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
                <input
                  type={key === 'amount' || key === 'year' ? 'number' : 'text'}
                  placeholder={placeholder}
                  value={applyForm[key as keyof typeof applyForm]}
                  onChange={(e) => setApplyForm((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
            ))}
            <p className="text-xs text-gray-400">✓ Requires existing banked balance — cannot exceed available</p>
            <Button variant="danger" className="w-full mt-1">APPLY CREDITS</Button>
          </div>
        </Card>
      </div>

      {/* History Table */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          <h3 className="font-semibold text-gray-800">Recent Banking Activity</h3>
        </div>
        <div className="p-4">
          <Table columns={historyColumns} data={mockBankHistory} keyExtractor={(e) => e.id} />
        </div>
      </Card>
    </div>
  );
}

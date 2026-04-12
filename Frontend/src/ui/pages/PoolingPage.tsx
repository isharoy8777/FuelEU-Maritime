import { useState } from 'react';
import { Users, Plus, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { mockPoolMembers, mockPools } from '../../api/mock';
import type { PoolMember, Pool } from '../../shared/types';

export function PoolingPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set(['PM-001', 'PM-002', 'PM-003', 'PM-004']));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedMembers = mockPoolMembers.filter((m) => selected.has(m.id));
  const poolTotal = selectedMembers.reduce((s, m) => s + m.complianceBalance, 0);
  const isValid = poolTotal >= 0;

  const poolHistoryColumns = [
    { key: 'name', header: 'Pool Name' },
    { key: 'members', header: 'Members', align: 'center' as const },
    { key: 'year', header: 'Year', align: 'center' as const },
    { key: 'totalCB', header: 'Total CB', align: 'right' as const, render: (p: Pool) => (
      <span className={p.totalCB >= 0 ? 'text-emerald-700 font-semibold' : 'text-red-600 font-semibold'}>
        {p.totalCB >= 0 ? '+' : ''}{p.totalCB.toLocaleString()}
      </span>
    )},
    { key: 'status', header: 'Status', align: 'center' as const, render: (p: Pool) => <Badge variant={p.status} /> },
    { key: 'createdAt', header: 'Created', render: (p: Pool) => <span className="text-gray-400 text-xs">{p.createdAt}</span> },
  ];

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 gradient-purple rounded-lg flex items-center justify-center">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pool Members</p>
            <p className="text-xl font-bold text-gray-900">{selected.size}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isValid ? 'gradient-green' : 'gradient-red'}`}>
            {isValid ? <CheckCircle size={18} className="text-white" /> : <XCircle size={18} className="text-white" />}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Pool CB</p>
            <p className={`text-xl font-bold ${isValid ? 'text-emerald-700' : 'text-red-600'}`}>
              {poolTotal >= 0 ? '+' : ''}{poolTotal.toLocaleString()}
            </p>
          </div>
        </div>
        <div className={`rounded-xl border shadow-sm px-5 py-4 flex items-center gap-4 ${isValid ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${isValid ? 'text-emerald-600' : 'text-red-500'}`}>Pool Status</p>
            <p className={`text-xl font-bold ${isValid ? 'text-emerald-800' : 'text-red-700'}`}>{isValid ? '✓ VALID' : '✗ INVALID'}</p>
            <p className={`text-xs mt-0.5 ${isValid ? 'text-emerald-600' : 'text-red-500'}`}>
              {isValid ? 'Pool total CB ≥ 0' : 'Pool total CB < 0 — cannot form pool'}
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-column */}
      <div className="grid grid-cols-5 gap-5">
        {/* Member Selection (3/5 width) */}
        <Card padding={false} className="col-span-3">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Select Pool Members</h3>
            <span className="text-xs text-gray-400">{selected.size} selected</span>
          </div>
          <div className="divide-y divide-gray-50">
            {mockPoolMembers.map((m) => (
              <label key={m.id} className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-sky-50/50 transition-colors ${selected.has(m.id) ? 'bg-sky-50/30' : ''}`}>
                <input
                  type="checkbox"
                  checked={selected.has(m.id)}
                  onChange={() => toggle(m.id)}
                  className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{m.shipName}</p>
                  <p className="text-xs text-gray-400">CB: {m.complianceBalance >= 0 ? '+' : ''}{m.complianceBalance.toLocaleString()}</p>
                </div>
                <Badge variant={m.status} />
              </label>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-gray-100">
            <Button className="w-full gap-2" disabled={!isValid}>
              <Plus size={16} />
              Create Pool
            </Button>
            {!isValid && (
              <p className="text-xs text-red-500 text-center mt-2">Total CB must be ≥ 0 to form a valid pool</p>
            )}
          </div>
        </Card>

        {/* Pool Summary (2/5 width) */}
        <Card padding={false} className="col-span-2">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Pool Summary</h3>
            <p className="text-xs text-gray-400 mt-0.5">Before → After redistribution</p>
          </div>
          <div className="divide-y divide-gray-50">
            {selectedMembers.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Select members to see summary</p>
            ) : (
              selectedMembers.map((m: PoolMember) => (
                <div key={m.id} className="px-5 py-3">
                  <p className="text-xs font-semibold text-gray-700">{m.shipName}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className={m.complianceBalance >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {m.complianceBalance >= 0 ? '+' : ''}{m.complianceBalance.toLocaleString()}
                    </span>
                    <span className="text-gray-300">→</span>
                    <span className={m.cbAfter >= 0 ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                      {m.cbAfter >= 0 ? '+' : ''}{m.cbAfter.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className={`px-5 py-4 border-t ${isValid ? 'border-emerald-100 bg-emerald-50' : 'border-red-100 bg-red-50'}`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pool Total</p>
            <p className={`text-2xl font-bold mt-1 ${isValid ? 'text-emerald-700' : 'text-red-600'}`}>
              {poolTotal >= 0 ? '+' : ''}{poolTotal.toLocaleString()}
            </p>
            <p className={`text-xs mt-0.5 font-medium ${isValid ? 'text-emerald-600' : 'text-red-500'}`}>
              {isValid ? '✓ Valid — total CB ≥ 0' : '✗ Invalid — total CB < 0'}
            </p>
          </div>
        </Card>
      </div>

      {/* Pool History */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Pool History</h3>
        </div>
        <div className="p-4">
          <Table columns={poolHistoryColumns} data={mockPools} keyExtractor={(p) => p.id} />
        </div>
      </Card>
    </div>
  );
}

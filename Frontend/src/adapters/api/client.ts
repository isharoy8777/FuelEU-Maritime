import type { Route, BankEntry, Pool, ComplianceLabel, BankingFleetTotal } from '../../shared/types';

const API_BASE = '/api/v1';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, options);
  if (!response.ok) {
    let errorMsg = 'An error occurred while fetching data';
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorData.error || errorMsg;
    } catch {
      // Ignored
    }
    throw new Error(errorMsg);
  }
  
  const payload = await response.json();
  if (payload && payload.success !== undefined && payload.data !== undefined) {
    return payload.data as T;
  }
  return payload as T;
}

// ─── Routes ─────────────────────────────────────────────────────────────────

export async function getRoutes(): Promise<Route[]> {
  return fetchJSON<Route[]>('/routes');
}

export async function setBaseline(routeId: string): Promise<Route> {
  return fetchJSON<Route>(`/routes/${routeId}/baseline`, {
    method: 'POST',
  });
}

// ─── Comparison ─────────────────────────────────────────────────────────────

interface ComparisonResult {
  baselineRouteId: string;
  targetGHGIntensity: number;
  details: {
    routeId: string;
    vesselName: string;
    ghgIntensity: number;
    percentDiff: number;
    compliant: boolean;
    complianceLabel: ComplianceLabel;
    complianceBalance: number;
  }[];
}

export async function getComparison(baselineId?: string): Promise<ComparisonResult> {
  const query = baselineId ? `?baselineId=${encodeURIComponent(baselineId)}` : '';
  return fetchJSON<ComparisonResult>(`/routes/comparison${query}`);
}

// ─── Compliance ─────────────────────────────────────────────────────────────

export async function getComplianceCB(shipId: string, year: number): Promise<{ cbBefore: number }> {
  return fetchJSON<{ cbBefore: number }>(`/compliance/cb?shipId=${shipId}&year=${year}`);
}

export async function getAdjustedCB(year: number): Promise<Array<{
  shipId: string;
  shipName: string;
  year: number;
  cbBefore: number;
  bankedApplied: number;
  cbAfter: number;
  status: 'SURPLUS' | 'DEFICIT';
}>> {
  return fetchJSON(`/compliance/adjusted-cb?year=${year}`);
}

// ─── Banking ────────────────────────────────────────────────────────────────

export async function bankSurplus(data: { shipId: string; shipName: string; year: number; amount: number }): Promise<{ entry: BankEntry; remainingBalance: number }> {
  const response = await fetchJSON<{ entry: { id: string; shipName: string; year: number; type: 'BANK' | 'APPLY'; amount: number; createdAt: string }; remainingBalance: number }>('/banking/bank', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return {
    remainingBalance: response.remainingBalance,
    entry: {
      id: response.entry.id,
      shipName: response.entry.shipName,
      year: response.entry.year,
      type: response.entry.type,
      amount: response.entry.amount,
      timestamp: new Date(response.entry.createdAt).toLocaleString(),
    },
  };
}

export async function applyBanked(data: { shipId: string; shipName: string; year: number; amount: number }): Promise<{ entry: BankEntry; remainingBalance: number }> {
  const response = await fetchJSON<{ entry: { id: string; shipName: string; year: number; type: 'BANK' | 'APPLY'; amount: number; createdAt: string }; remainingBalance: number }>('/banking/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return {
    remainingBalance: response.remainingBalance,
    entry: {
      id: response.entry.id,
      shipName: response.entry.shipName,
      year: response.entry.year,
      type: response.entry.type,
      amount: response.entry.amount,
      timestamp: new Date(response.entry.createdAt).toLocaleString(),
    },
  };
}

export async function getBankRecords(shipId: string, year: number): Promise<BankEntry[]> {
  const response = await fetchJSON<Array<{ id: string; shipName: string; year: number; type: 'BANK' | 'APPLY'; amount: number; createdAt: string }>>(
    `/banking/records?shipId=${shipId}&year=${year}`,
  );

  return response.map((entry) => ({
    id: entry.id,
    shipName: entry.shipName,
    year: entry.year,
    type: entry.type,
    amount: entry.amount,
    timestamp: new Date(entry.createdAt).toLocaleString(),
  }));
}

export async function getBankTotals(year: number): Promise<BankingFleetTotal[]> {
  return fetchJSON<BankingFleetTotal[]>(`/banking/totals?year=${year}`);
}

// ─── Pooling ────────────────────────────────────────────────────────────────

export async function createPool(data: { name: string; year: number; members: Array<{ shipId?: string; shipName: string; complianceBalance: number }> }): Promise<Pool> {
  const response = await fetchJSON<{ pool: { id: string; name: string; year: number; members: Array<{ id: string }>; createdAt: string }; allocations: Array<{ cbAfter: number }> }>('/pools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const totalCB = response.allocations.reduce((sum, m) => sum + m.cbAfter, 0);
  return {
    id: response.pool.id,
    name: response.pool.name,
    year: response.pool.year,
    members: response.pool.members.length,
    totalCB,
    status: totalCB >= 0 ? 'VALID' : 'INVALID',
    createdAt: new Date(response.pool.createdAt).toLocaleDateString(),
  };
}

export async function getPools(): Promise<Pool[]> {
  return fetchJSON<Pool[]>('/pools');
}

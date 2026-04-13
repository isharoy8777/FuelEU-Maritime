import type {
  Route, BankEntry, BankingSummary, PoolMember, Pool,
} from '../../shared/types';

// ─── Routes Mock Data ──────────────────────────────────────────────────────────

export const mockRoutes: Route[] = [
  {
    id: 'RTR-001', vesselName: 'MV Nordica', vesselType: 'Tanker',
    fuelType: 'VLSFO', year: 2025, ghgIntensity: 82.4,
    fuelConsumption: 1240, distance: 4820, totalEmissions: 3847.2, status: 'SURPLUS',
  },
  {
    id: 'RTR-002', vesselName: 'MV Polar Star', vesselType: 'Bulk Carrier',
    fuelType: 'MGO', year: 2025, ghgIntensity: 95.1,
    fuelConsumption: 890, distance: 2310, totalEmissions: 6003.1, status: 'DEFICIT', isBaseline: true,
  },
  {
    id: 'RTR-003', vesselName: 'MV Atlantic Spirit', vesselType: 'Container',
    fuelType: 'LNG', year: 2025, ghgIntensity: 67.8,
    fuelConsumption: 1520, distance: 6140, totalEmissions: 2156.4, status: 'SURPLUS',
  },
  {
    id: 'RTR-004', vesselName: 'MV Baltic Wind', vesselType: 'RoRo',
    fuelType: 'VLSFO', year: 2025, ghgIntensity: 91.16,
    fuelConsumption: 760, distance: 1830, totalEmissions: 5232.0, status: 'SURPLUS',
  },
  {
    id: 'RTR-005', vesselName: 'MV Caspian Bridge', vesselType: 'Tanker',
    fuelType: 'HFO', year: 2025, ghgIntensity: 103.7,
    fuelConsumption: 2010, distance: 7250, totalEmissions: 7621.8, status: 'DEFICIT',
  },
];


// ─── Banking Mock Data ─────────────────────────────────────────────────────────

export const mockBankingSummary: BankingSummary = {
  shipName: 'MV Nordica',
  cbBefore: 456560,
  applied: 100000,
  cbAfter: 356560,
  available: 180000,
};

export const mockBankHistory: BankEntry[] = [
  { id: 'BNK-001', shipName: 'MV Nordica', year: 2025, type: 'BANK', amount: 100000, timestamp: '2025-03-14 09:12' },
  { id: 'BNK-002', shipName: 'MV Atlantic Spirit', year: 2025, type: 'BANK', amount: 250000, timestamp: '2025-03-10 14:30' },
  { id: 'BNK-003', shipName: 'MV Caspian Bridge', year: 2025, type: 'APPLY', amount: 80000, timestamp: '2025-02-28 11:05' },
  { id: 'BNK-004', shipName: 'MV Polar Star', year: 2025, type: 'APPLY', amount: 120000, timestamp: '2025-02-15 16:20' },
];

// ─── Pooling Mock Data ─────────────────────────────────────────────────────────

export const mockPoolMembers: PoolMember[] = [
  { id: 'PM-001', shipName: 'MV Nordica', complianceBalance: 456560, cbAfter: 279160, status: 'SURPLUS' },
  { id: 'PM-002', shipName: 'MV Polar Star', complianceBalance: -312400, cbAfter: 0, status: 'SURPLUS' },
  { id: 'PM-003', shipName: 'MV Atlantic Spirit', complianceBalance: 952640, cbAfter: 817440, status: 'SURPLUS' },
  { id: 'PM-004', shipName: 'MV Baltic Wind', complianceBalance: 0, cbAfter: 0, status: 'SURPLUS' },
  { id: 'PM-005', shipName: 'MV Caspian Bridge', complianceBalance: -512990, cbAfter: 0, status: 'DEFICIT' },
  { id: 'PM-006', shipName: 'MV Arctic Dawn', complianceBalance: 88000, cbAfter: 88000, status: 'SURPLUS' },
];

export const mockPools: Pool[] = [
  { id: 'POOL-001', name: 'Nordic Fleet Q1', year: 2025, members: 4, totalCB: 584810, status: 'VALID', createdAt: '2025-03-01' },
  { id: 'POOL-002', name: 'Atlantic Group', year: 2024, members: 3, totalCB: 120000, status: 'VALID', createdAt: '2024-12-15' },
  { id: 'POOL-003', name: 'Baltic Cluster', year: 2024, members: 2, totalCB: -50000, status: 'INVALID', createdAt: '2024-11-30' },
];

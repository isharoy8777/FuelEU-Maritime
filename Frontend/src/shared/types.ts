// ─── Domain Types ──────────────────────────────────────────────────────────────

export type ComplianceStatus = 'SURPLUS' | 'DEFICIT' | 'COMPLIANT';
export type ComplianceLabel = 'COMPLIANT' | 'NON-COMPLIANT';
export type BankEntryType = 'BANK' | 'APPLY';

export interface Route {
  id: string;
  vesselName: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  status: ComplianceStatus;
  isBaseline?: boolean;
}

export interface ComplianceResult {
  routeId: string;
  vesselName: string;
  actualGHGIntensity: number;
  targetGHGIntensity: number;
  complianceBalance: number;
  status: ComplianceStatus;
  year: number;
}

export interface RouteComparison {
  routeId: string;
  vesselName: string;
  ghgIntensity: number;
  percentDiff: number;
  complianceLabel: ComplianceLabel;
  complianceBalance: number;
}

export interface BankEntry {
  id: string;
  shipName: string;
  year: number;
  type: BankEntryType;
  amount: number;
  timestamp: string;
}

export interface BankingSummary {
  shipName: string;
  cbBefore: number;
  applied: number;
  cbAfter: number;
  available: number;
}

export interface PoolMember {
  id: string;
  shipName: string;
  complianceBalance: number;
  cbAfter: number;
  status: ComplianceStatus;
}

export interface Pool {
  id: string;
  name: string;
  year: number;
  members: number;
  totalCB: number;
  status: 'VALID' | 'INVALID';
  createdAt: string;
}

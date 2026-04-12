/**
 * Compliance Domain Entity
 * Pure domain model — no database or framework dependencies.
 *
 * Domain formulas:
 *   Energy = fuelConsumption × 41000
 *   CB     = (targetGHGIntensity − actualGHGIntensity) × energy
 *   CB > 0 → SURPLUS  |  CB < 0 → DEFICIT  |  CB === 0 → COMPLIANT
 */
export type ComplianceStatus = 'SURPLUS' | 'DEFICIT' | 'COMPLIANT';

export interface Compliance {
  id: string;
  routeId: string;
  shipName: string;
  actualGHGIntensity: number;
  targetGHGIntensity: number;
  energy: number;
  complianceBalance: number;
  status: ComplianceStatus;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateComplianceInput = Omit<Compliance, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateComplianceInput = Partial<CreateComplianceInput>;

import { ComplianceStatus } from '../domain/Compliance';
import { Route } from '../domain/Route';

// ─── Types ───────────────────────────────────────────────────

/** Input for computing a single route's compliance balance. */
export interface ComputeComplianceInput {
  route: Route;
  actualGHGIntensity: number;
  targetGHGIntensity: number;
}

/** Result of a compliance balance computation. */
export interface ComplianceResult {
  routeId: string;
  shipName: string;
  energy: number;
  complianceBalance: number;
  status: ComplianceStatus;
  actualGHGIntensity: number;
  targetGHGIntensity: number;
}

// ─── Constants ───────────────────────────────────────────────

/** Default energy conversion factor (kJ per ton of fuel). */
const ENERGY_CONVERSION_FACTOR = 41_000;

// ─── Use-Case ────────────────────────────────────────────────

/**
 * Compute Compliance Balance for a route.
 *
 * Pure function — no repository dependency.
 *
 * Formulas:
 *   energy = fuelConsumption × 41 000
 *   CB     = (target − actual) × energy
 *
 * @throws {Error} if inputs are invalid (negative fuel, negative intensities)
 */
export function computeComplianceBalance(
  input: ComputeComplianceInput,
): ComplianceResult {
  const { route, actualGHGIntensity, targetGHGIntensity } = input;

  // ── Validation ──────────────────────────────────────────────
  if (route.fuelConsumption < 0) {
    throw new Error('Fuel consumption must be non-negative.');
  }
  if (actualGHGIntensity < 0) {
    throw new Error('Actual GHG intensity must be non-negative.');
  }
  if (targetGHGIntensity < 0) {
    throw new Error('Target GHG intensity must be non-negative.');
  }

  // ── Computation ─────────────────────────────────────────────
  const energy = route.fuelConsumption * ENERGY_CONVERSION_FACTOR;
  const complianceBalance =
    (targetGHGIntensity - actualGHGIntensity) * energy;

  // ── Status classification ───────────────────────────────────
  let status: ComplianceStatus;
  if (complianceBalance > 0) {
    status = 'SURPLUS';
  } else if (complianceBalance < 0) {
    status = 'DEFICIT';
  } else {
    status = 'COMPLIANT';
  }

  return {
    routeId: route.id,
    shipName: route.shipName,
    energy,
    complianceBalance,
    status,
    actualGHGIntensity,
    targetGHGIntensity,
  };
}

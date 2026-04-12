import { ComplianceStatus } from '../domain/Compliance';
import { Route } from '../domain/Route';
import {
  computeComplianceBalance,
  ComplianceResult,
} from './ComputeComplianceUseCase';

// ─── Types ───────────────────────────────────────────────────

/** GHG intensity data paired with a route for comparison. */
export interface RouteWithIntensity {
  route: Route;
  actualGHGIntensity: number;
}

/** Single comparison result for one route against the baseline. */
export interface RouteComparison {
  routeId: string;
  shipName: string;
  actualGHGIntensity: number;
  /** Percentage difference relative to the baseline route. */
  percentDiff: number;
  /** Whether this route meets the target GHG intensity. */
  compliant: boolean;
  /** Full compliance computation result. */
  compliance: ComplianceResult;
}

/** Complete comparison output. */
export interface CompareRoutesResult {
  baseline: ComplianceResult;
  comparisons: RouteComparison[];
}

// ─── Use-Case ────────────────────────────────────────────────

/**
 * Compare multiple routes against a baseline route.
 *
 * Pure function — no repository dependency.
 *
 * For each route:
 *   percentDiff = ((route.ghgIntensity / baseline.ghgIntensity) − 1) × 100
 *   compliant   = route.ghgIntensity ≤ target
 *
 * @throws {Error} if baseline GHG intensity is zero (division by zero)
 * @throws {Error} if routes array is empty
 */
export function compareRoutes(
  baselineRoute: RouteWithIntensity,
  routes: RouteWithIntensity[],
  targetGHGIntensity: number,
): CompareRoutesResult {
  // ── Validation ──────────────────────────────────────────────
  if (targetGHGIntensity < 0) {
    throw new Error('Target GHG intensity must be non-negative.');
  }
  if (baselineRoute.actualGHGIntensity === 0) {
    throw new Error(
      'Baseline GHG intensity must be non-zero to compute percentage difference.',
    );
  }
  if (routes.length === 0) {
    throw new Error('At least one route must be provided for comparison.');
  }

  // ── Baseline compliance ─────────────────────────────────────
  const baseline = computeComplianceBalance({
    route: baselineRoute.route,
    actualGHGIntensity: baselineRoute.actualGHGIntensity,
    targetGHGIntensity,
  });

  // ── Route comparisons ───────────────────────────────────────
  const comparisons: RouteComparison[] = routes.map(
    ({ route, actualGHGIntensity }) => {
      const percentDiff =
        ((actualGHGIntensity / baselineRoute.actualGHGIntensity) - 1) * 100;

      const compliant = actualGHGIntensity <= targetGHGIntensity;

      const compliance = computeComplianceBalance({
        route,
        actualGHGIntensity,
        targetGHGIntensity,
      });

      return {
        routeId: route.id,
        shipName: route.shipName,
        actualGHGIntensity,
        percentDiff,
        compliant,
        compliance,
      };
    },
  );

  return { baseline, comparisons };
}

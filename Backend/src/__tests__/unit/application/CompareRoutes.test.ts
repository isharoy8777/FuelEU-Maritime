import { compareRoutes, RouteWithIntensity } from '../../../core/application/CompareRoutesUseCase';
import { Route } from '../../../core/domain/Route';

// ─── Helpers ─────────────────────────────────────────────────

function makeRouteWithIntensity(
  id: string,
  shipName: string,
  fuelConsumption: number,
  actualGHGIntensity: number
): RouteWithIntensity {
  const route: Route = {
    id,
    shipName,
    departurePort: 'Hamburg',
    arrivalPort: 'Rotterdam',
    distance: 500,
    fuelType: 'VLSFO',
    fuelConsumption,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-02'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return { route, actualGHGIntensity };
}

// ─── Tests ───────────────────────────────────────────────────

describe('compareRoutes', () => {
  const TARGET_GHG = 91.16;

  describe('Valid comparison', () => {
    it('should calculate percentDiff correctly', () => {
      // Arrange
      const baseline = makeRouteWithIntensity('r-1', 'Ship A', 100, 85);
      const route1   = makeRouteWithIntensity('r-2', 'Ship B', 120, 95);

      // Act
      const result = compareRoutes(baseline, [route1], TARGET_GHG);

      // Assert — percentDiff = ((95 / 85) - 1) * 100 ≈ 11.76
      expect(result.comparisons[0].percentDiff).toBeCloseTo(11.76, 1);
    });

    it('should flag route as compliant when actualGHGIntensity ≤ target', () => {
      const baseline = makeRouteWithIntensity('r-1', 'Ship A', 100, 85);
      const route1   = makeRouteWithIntensity('r-2', 'Ship B', 100, 88);

      const result = compareRoutes(baseline, [route1], TARGET_GHG);

      expect(result.comparisons[0].compliant).toBe(true);
    });

    it('should flag route as non-compliant when actualGHGIntensity > target', () => {
      const baseline = makeRouteWithIntensity('r-1', 'Ship A', 100, 85);
      const route1   = makeRouteWithIntensity('r-2', 'Ship B', 100, 95);

      const result = compareRoutes(baseline, [route1], TARGET_GHG);

      expect(result.comparisons[0].compliant).toBe(false);
    });

    it('should return baseline compliance result', () => {
      const baseline = makeRouteWithIntensity('r-1', 'Ship A', 100, 85);
      const route1   = makeRouteWithIntensity('r-2', 'Ship B', 100, 92);

      const result = compareRoutes(baseline, [route1], TARGET_GHG);

      expect(result.baseline.routeId).toBe('r-1');
      expect(result.baseline.status).toBe('SURPLUS');
    });

    it('should handle multiple routes in one comparison', () => {
      const baseline = makeRouteWithIntensity('r-1', 'Ship A', 100, 80);
      const routes = [
        makeRouteWithIntensity('r-2', 'Ship B', 100, 88),
        makeRouteWithIntensity('r-3', 'Ship C', 100, 93),
      ];

      const result = compareRoutes(baseline, routes, TARGET_GHG);

      expect(result.comparisons).toHaveLength(2);
    });
  });

  describe('Validation', () => {
    it('should throw when routes array is empty', () => {
      const baseline = makeRouteWithIntensity('r-1', 'Ship A', 100, 85);
      expect(() => compareRoutes(baseline, [], TARGET_GHG)).toThrow(
        'At least one route must be provided for comparison.'
      );
    });

    it('should throw when baseline GHG intensity is zero', () => {
      const baseline = makeRouteWithIntensity('r-1', 'Ship A', 100, 0);
      const route1   = makeRouteWithIntensity('r-2', 'Ship B', 100, 85);
      expect(() => compareRoutes(baseline, [route1], TARGET_GHG)).toThrow(
        'Baseline GHG intensity must be non-zero'
      );
    });

    it('should throw when targetGHGIntensity is negative', () => {
      const baseline = makeRouteWithIntensity('r-1', 'Ship A', 100, 85);
      const route1   = makeRouteWithIntensity('r-2', 'Ship B', 100, 90);
      expect(() => compareRoutes(baseline, [route1], -5)).toThrow(
        'Target GHG intensity must be non-negative.'
      );
    });
  });
});

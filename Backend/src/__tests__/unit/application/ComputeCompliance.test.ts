import { computeComplianceBalance } from '../../../core/application/ComputeComplianceUseCase';
import { Route } from '../../../core/domain/Route';

// ─── Helpers ─────────────────────────────────────────────────

function makeRoute(overrides: Partial<Route> = {}): Route {
  return {
    id: 'route-1',
    shipName: 'MV TestShip',
    departurePort: 'Hamburg',
    arrivalPort: 'Rotterdam',
    distance: 500,
    fuelType: 'VLSFO',
    fuelConsumption: 100,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-02'),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────

describe('computeComplianceBalance', () => {
  describe('Surplus case (positive CB)', () => {
    it('should return SURPLUS status when target > actual GHG intensity', () => {
      // Arrange
      const route = makeRoute({ fuelConsumption: 100 });
      const input = { route, actualGHGIntensity: 80, targetGHGIntensity: 91.16 };

      // Act
      const result = computeComplianceBalance(input);

      // Assert
      expect(result.complianceBalance).toBeGreaterThan(0);
      expect(result.status).toBe('SURPLUS');
      expect(result.energy).toBe(100 * 41_000);
    });
  });

  describe('Deficit case (negative CB)', () => {
    it('should return DEFICIT status when actual GHG intensity > target', () => {
      // Arrange
      const route = makeRoute({ fuelConsumption: 100 });
      const input = { route, actualGHGIntensity: 95, targetGHGIntensity: 91.16 };

      // Act
      const result = computeComplianceBalance(input);

      // Assert
      expect(result.complianceBalance).toBeLessThan(0);
      expect(result.status).toBe('DEFICIT');
    });
  });

  describe('Edge case (CB = 0)', () => {
    it('should return COMPLIANT status when actual equals target', () => {
      // Arrange
      const route = makeRoute({ fuelConsumption: 100 });
      const input = { route, actualGHGIntensity: 91.16, targetGHGIntensity: 91.16 };

      // Act
      const result = computeComplianceBalance(input);

      // Assert
      expect(result.complianceBalance).toBe(0);
      expect(result.status).toBe('COMPLIANT');
    });

    it('should return COMPLIANT when fuelConsumption is 0', () => {
      const route = makeRoute({ fuelConsumption: 0 });
      const result = computeComplianceBalance({ route, actualGHGIntensity: 95, targetGHGIntensity: 91.16 });
      expect(result.complianceBalance).toBeCloseTo(0);
      expect(result.status).toBe('COMPLIANT');
    });
  });

  describe('Validation', () => {
    it('should throw if fuelConsumption is negative', () => {
      const route = makeRoute({ fuelConsumption: -10 });
      expect(() =>
        computeComplianceBalance({ route, actualGHGIntensity: 80, targetGHGIntensity: 91 })
      ).toThrow('Fuel consumption must be non-negative.');
    });

    it('should throw if actualGHGIntensity is negative', () => {
      const route = makeRoute();
      expect(() =>
        computeComplianceBalance({ route, actualGHGIntensity: -5, targetGHGIntensity: 91 })
      ).toThrow('Actual GHG intensity must be non-negative.');
    });

    it('should throw if targetGHGIntensity is negative', () => {
      const route = makeRoute();
      expect(() =>
        computeComplianceBalance({ route, actualGHGIntensity: 80, targetGHGIntensity: -1 })
      ).toThrow('Target GHG intensity must be non-negative.');
    });
  });

  describe('Return values', () => {
    it('should include correct routeId and shipName', () => {
      const route = makeRoute({ id: 'r-999', shipName: 'MV Alpha' });
      const result = computeComplianceBalance({ route, actualGHGIntensity: 80, targetGHGIntensity: 91 });
      expect(result.routeId).toBe('r-999');
      expect(result.shipName).toBe('MV Alpha');
    });
  });
});

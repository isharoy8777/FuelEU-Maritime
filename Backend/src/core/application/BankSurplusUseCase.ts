import { BankEntry } from '../domain/BankEntry';
import { RouteRepository } from '../ports/RouteRepository';
import { BankRepository } from '../ports/BankRepository';
import { ComplianceRepository } from '../ports/ComplianceRepository';
import { computeComplianceBalance } from './ComputeComplianceUseCase';
import { TARGET_GHG_INTENSITY_2025, resolveRouteMeta } from '../../shared/fueleu';

// ─── Types ───────────────────────────────────────────────────

export interface BankSurplusInput {
  shipId?: string;
  shipName: string;
  year: number;
  amount: number;
}

// ─── Use-Case ────────────────────────────────────────────────

/**
 * Bank Surplus Use-Case
 *
 * Allows a ship with a positive compliance balance to bank
 * surplus CB for future use.
 *
 * Rules:
 *   - amount must be > 0
 *   - Ship must have at least one compliance record with positive CB
 *   - The banked amount must not exceed the ship's total surplus
 *
 * Dependencies injected via constructor (port interfaces only).
 */
export class BankSurplusUseCase {
  constructor(
    private readonly bankRepo: BankRepository,
    private readonly complianceRepo: ComplianceRepository,
    private readonly routeRepo?: RouteRepository,
  ) {}

  async execute(input: BankSurplusInput): Promise<BankEntry> {
    const { shipId, shipName, year, amount } = input;

    // ── Validation ────────────────────────────────────────────
    if (amount <= 0) {
      throw new Error('Bank amount must be greater than zero.');
    }

    // ── Verify surplus exists ─────────────────────────────────
    const records = shipId
      ? await this.complianceRepo.findByRouteId(shipId)
      : await this.complianceRepo.findByShipName(shipName);

    let totalCB = records.reduce((sum, r) => sum + r.complianceBalance, 0);

    if (records.length === 0 && this.routeRepo) {
      const route = shipId
        ? await this.routeRepo.findById(shipId)
        : (await this.routeRepo.findAll()).find(
            (candidate) => candidate.shipName === shipName,
          ) ?? null;

      if (route) {
        const meta = resolveRouteMeta(route.id, route.shipName);
        const computed = computeComplianceBalance({
          route,
          actualGHGIntensity: meta.ghgIntensity,
          targetGHGIntensity: TARGET_GHG_INTENSITY_2025,
        });
        totalCB = computed.complianceBalance;
      }
    }

    if (records.length === 0 && totalCB === 0) {
      throw new Error(`No compliance records found for ship "${shipName}".`);
    }

    if (totalCB <= 0) {
      throw new Error(
        `Ship "${shipName}" has no surplus to bank (total CB: ${totalCB}).`,
      );
    }

    if (amount > totalCB) {
      throw new Error(
        `Cannot bank ${amount}: exceeds available surplus of ${totalCB}.`,
      );
    }

    // ── Persist ───────────────────────────────────────────────
    return this.bankRepo.create({
      shipId: shipId || shipName,
      shipName,
      year,
      amount,
      type: 'BANK',
    });
  }
}

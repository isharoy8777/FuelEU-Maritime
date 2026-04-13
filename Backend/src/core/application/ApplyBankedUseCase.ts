import { BankEntry } from '../domain/BankEntry';
import { RouteRepository } from '../ports/RouteRepository';
import { BankRepository } from '../ports/BankRepository';
import { ComplianceRepository } from '../ports/ComplianceRepository';
import { computeComplianceBalance } from './ComputeComplianceUseCase';
import { TARGET_GHG_INTENSITY_2025, resolveRouteMeta } from '../../shared/fueleu';

// ─── Types ───────────────────────────────────────────────────

export interface ApplyBankedInput {
  shipId?: string;
  shipName: string;
  year: number;
  amount: number;
}

// ─── Use-Case ────────────────────────────────────────────────

/**
 * Apply Banked Surplus Use-Case
 *
 * Allows a ship to apply previously banked surplus to offset
 * a compliance deficit.
 *
 * Rules:
 *   - amount must be > 0
 *   - Cannot apply more than the available banked balance
 *   - Ship must have a deficit to apply surplus against
 *
 * Dependencies injected via constructor (port interfaces only).
 */
export class ApplyBankedUseCase {
  constructor(
    private readonly bankRepo: BankRepository,
    private readonly complianceRepo: ComplianceRepository,
    private readonly routeRepo?: RouteRepository,
  ) {}

  async execute(input: ApplyBankedInput): Promise<BankEntry> {
    const { shipId, shipName, year, amount } = input;

    // ── Validation ────────────────────────────────────────────
    if (amount <= 0) {
      throw new Error('Apply amount must be greater than zero.');
    }

    // ── Check available banked balance ────────────────────────
    const available = await this.bankRepo.getBalance(shipId || shipName);

    if (available <= 0) {
      throw new Error(
        `Ship "${shipName}" has no banked surplus available.`,
      );
    }

    if (amount > available) {
      throw new Error(
        `Cannot apply ${amount}: exceeds available banked balance of ${available}.`,
      );
    }

    // ── Verify deficit exists ─────────────────────────────────
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

    if (totalCB >= 0) {
      throw new Error(
        `Ship "${shipName}" has no deficit to offset (total CB: ${totalCB}).`,
      );
    }

    // ── Persist ───────────────────────────────────────────────
    return this.bankRepo.create({
      shipId: shipId || shipName,
      shipName,
      year,
      amount,
      type: 'APPLY',
    });
  }
}

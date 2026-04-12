import { BankEntry } from '../domain/BankEntry';
import { BankRepository } from '../ports/BankRepository';
import { ComplianceRepository } from '../ports/ComplianceRepository';

// ─── Types ───────────────────────────────────────────────────

export interface ApplyBankedInput {
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
  ) {}

  async execute(input: ApplyBankedInput): Promise<BankEntry> {
    const { shipName, year, amount } = input;

    // ── Validation ────────────────────────────────────────────
    if (amount <= 0) {
      throw new Error('Apply amount must be greater than zero.');
    }

    // ── Check available banked balance ────────────────────────
    const available = await this.bankRepo.getBalance(shipName);

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
    const records = await this.complianceRepo.findByShipName(shipName);
    const totalCB = records.reduce(
      (sum, r) => sum + r.complianceBalance,
      0,
    );

    if (totalCB >= 0) {
      throw new Error(
        `Ship "${shipName}" has no deficit to offset (total CB: ${totalCB}).`,
      );
    }

    // ── Persist ───────────────────────────────────────────────
    return this.bankRepo.create({
      shipName,
      year,
      amount,
      type: 'APPLY',
    });
  }
}

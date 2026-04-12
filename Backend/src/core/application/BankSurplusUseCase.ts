import { BankEntry } from '../domain/BankEntry';
import { BankRepository } from '../ports/BankRepository';
import { ComplianceRepository } from '../ports/ComplianceRepository';

// ─── Types ───────────────────────────────────────────────────

export interface BankSurplusInput {
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
  ) {}

  async execute(input: BankSurplusInput): Promise<BankEntry> {
    const { shipName, year, amount } = input;

    // ── Validation ────────────────────────────────────────────
    if (amount <= 0) {
      throw new Error('Bank amount must be greater than zero.');
    }

    // ── Verify surplus exists ─────────────────────────────────
    const records = await this.complianceRepo.findByShipName(shipName);
    if (records.length === 0) {
      throw new Error(
        `No compliance records found for ship "${shipName}".`,
      );
    }

    const totalCB = records.reduce(
      (sum, r) => sum + r.complianceBalance,
      0,
    );

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
      shipName,
      year,
      amount,
      type: 'BANK',
    });
  }
}

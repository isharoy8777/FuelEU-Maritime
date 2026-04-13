import { Pool } from '../domain/Pool';
import { PoolRepository } from '../ports/PoolRepository';

// ─── Types ───────────────────────────────────────────────────

/** A member input for pool creation. */
export interface PoolMemberInput {
  shipId?: string;
  shipName: string;
  complianceBalance: number;
}

/** Result for a single member after pool redistribution. */
export interface PoolAllocation {
  shipId: string;
  shipName: string;
  cbBefore: number;
  cbAfter: number;
  contributedAmount: number;
}

export interface CreatePoolInput {
  name: string;
  year: number;
  members: PoolMemberInput[];
}

export interface CreatePoolResult {
  pool: Pool;
  allocations: PoolAllocation[];
}

// ─── Use-Case ────────────────────────────────────────────────

/**
 * Create Pool Use-Case
 *
 * Groups ships together and redistributes surplus CB to
 * offset deficits using a greedy approach.
 *
 * Rules:
 *   - At least 2 members required
 *   - Total pool CB must be ≥ 0
 *   - Surplus ships cannot go negative
 *   - Deficit ships cannot become worse
 *
 * Algorithm (greedy):
 *   1. Sort members by CB descending (surplus first)
 *   2. For each deficit member, pull surplus from surplus members
 *   3. Surplus member gives at most their remaining surplus
 *   4. Deficit member receives at most their deficit amount
 */
export class CreatePoolUseCase {
  constructor(private readonly poolRepo: PoolRepository) {}

  async execute(input: CreatePoolInput): Promise<CreatePoolResult> {
    const { name, year, members } = input;

    // ── Validation ────────────────────────────────────────────
    if (members.length < 2) {
      throw new Error('A pool must have at least 2 members.');
    }

    const totalCB = members.reduce((sum, m) => sum + m.complianceBalance, 0);
    if (totalCB < 0) {
      throw new Error(
        `Total pool compliance balance is negative (${totalCB}). Cannot form pool.`,
      );
    }

    // ── Greedy redistribution ─────────────────────────────────
    // Work on mutable copies sorted by CB descending
    const allocations: PoolAllocation[] = members.map((m) => ({
      shipId: m.shipId ?? m.shipName,
      shipName: m.shipName,
      cbBefore: m.complianceBalance,
      cbAfter: m.complianceBalance,
      contributedAmount: 0,
    }));

    // Separate surplus and deficit members
    const surplusMembers = allocations
      .filter((a) => a.cbAfter > 0)
      .sort((a, b) => b.cbAfter - a.cbAfter); // largest surplus first

    const deficitMembers = allocations
      .filter((a) => a.cbAfter < 0)
      .sort((a, b) => a.cbAfter - b.cbAfter); // largest deficit first

    // Greedy transfer: surplus → deficit
    for (const deficit of deficitMembers) {
      const needed = Math.abs(deficit.cbAfter);
      let remaining = needed;

      for (const surplus of surplusMembers) {
        if (remaining <= 0) break;
        if (surplus.cbAfter <= 0) continue;

        const transfer = Math.min(surplus.cbAfter, remaining);

        surplus.cbAfter -= transfer;
        surplus.contributedAmount += transfer;

        deficit.cbAfter += transfer;
        remaining -= transfer;
      }
    }

    // ── Persist pool + members ────────────────────────────────
    const pool = await this.poolRepo.create({ name, year });

    for (const alloc of allocations) {
      await this.poolRepo.addMember({
        poolId: pool.id,
        shipId: alloc.shipId,
        shipName: alloc.shipName,
        cbBefore: alloc.cbBefore,
        cbAfter: alloc.cbAfter,
        contributedAmount: alloc.contributedAmount,
      });
    }

    // Re-fetch pool with populated members
    const savedPool = await this.poolRepo.findById(pool.id);
    if (!savedPool) {
      throw new Error('Failed to retrieve created pool.');
    }

    return { pool: savedPool, allocations };
  }
}

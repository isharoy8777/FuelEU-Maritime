/**
 * Pool & PoolMember Domain Entities
 * Pure domain models — no database or framework dependencies.
 *
 * Pooling rules:
 *   - Total CB across pool must be ≥ 0
 *   - Deficit ship must NOT become worse
 *   - Surplus ship must NOT become negative
 *   - Greedy allocation: surplus distributed to deficit ships
 */
export interface Pool {
  id: string;
  name: string;
  year: number;
  members: PoolMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PoolMember {
  id: string;
  poolId: string;
  shipId: string;
  shipName: string;
  cbBefore: number;
  cbAfter: number;
  contributedAmount: number;
  createdAt: Date;
}

export type CreatePoolInput = Omit<Pool, 'id' | 'members' | 'createdAt' | 'updatedAt'>;
export type CreatePoolMemberInput = Omit<PoolMember, 'id' | 'createdAt'>;

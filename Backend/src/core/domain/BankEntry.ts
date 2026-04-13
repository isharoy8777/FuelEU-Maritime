/**
 * BankEntry Domain Entity
 * Pure domain model — no database or framework dependencies.
 *
 * Banking rules:
 *   - BANK:  only allowed when CB > 0 (surplus)
 *   - APPLY: cannot exceed available banked amount
 */
export type BankEntryType = 'BANK' | 'APPLY';

export interface BankEntry {
  id: string;
  shipId: string;
  shipName: string;
  amount: number;
  year: number;
  type: BankEntryType;
  createdAt: Date;
}

export type CreateBankEntryInput = Omit<BankEntry, 'id' | 'createdAt'>;

import { BankEntry, CreateBankEntryInput } from '../domain/BankEntry';

/**
 * BankRepository Port
 * Defines the contract for bank entry persistence.
 * Adapters must implement this interface.
 */
export interface BankRepository {
  findAll(): Promise<BankEntry[]>;
  findById(id: string): Promise<BankEntry | null>;
  findByShipId(shipId: string): Promise<BankEntry[]>;
  findByShipName(shipName: string): Promise<BankEntry[]>;
  findByYear(year: number): Promise<BankEntry[]>;
  create(data: CreateBankEntryInput): Promise<BankEntry>;
  getBalance(shipName: string): Promise<number>;
}

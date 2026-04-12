import prisma from '../../../infrastructure/db/prismaClient';
import { BankRepository } from '../../../core/ports/BankRepository';
import { BankEntry, CreateBankEntryInput } from '../../../core/domain/BankEntry';

export class PostgresBankRepository implements BankRepository {
  async findAll(): Promise<BankEntry[]> {
    return prisma.bankEntry.findMany();
  }

  async findById(id: string): Promise<BankEntry | null> {
    return prisma.bankEntry.findUnique({ where: { id } });
  }

  async findByShipName(shipName: string): Promise<BankEntry[]> {
    return prisma.bankEntry.findMany({ where: { shipName } });
  }

  async findByYear(year: number): Promise<BankEntry[]> {
    return prisma.bankEntry.findMany({ where: { year } });
  }

  async create(data: CreateBankEntryInput): Promise<BankEntry> {
    return prisma.bankEntry.create({ data });
  }

  async getBalance(shipName: string): Promise<number> {
    const entries = await prisma.bankEntry.findMany({ where: { shipName } });
    return entries.reduce((acc, entry) => {
      if (entry.type === 'BANK') return acc + entry.amount;
      if (entry.type === 'APPLY') return acc - entry.amount;
      return acc;
    }, 0);
  }
}

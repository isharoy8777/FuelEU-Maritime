import prisma from '../../../infrastructure/db/prismaClient';
import { PoolRepository } from '../../../core/ports/PoolRepository';
import { Pool, CreatePoolInput, CreatePoolMemberInput } from '../../../core/domain/Pool';

export class PostgresPoolRepository implements PoolRepository {
  async findAll(): Promise<Pool[]> {
    return prisma.pool.findMany({ include: { members: true } });
  }

  async findById(id: string): Promise<Pool | null> {
    return prisma.pool.findUnique({
      where: { id },
      include: { members: true },
    });
  }

  async findByYear(year: number): Promise<Pool[]> {
    return prisma.pool.findMany({
      where: { year },
      include: { members: true },
    });
  }

  async create(data: CreatePoolInput): Promise<Pool> {
    return prisma.pool.create({
      data,
      include: { members: true },
    });
  }

  async addMember(data: CreatePoolMemberInput): Promise<Pool> {
    const member = await prisma.poolMember.create({
      data: {
        poolId: data.poolId,
        shipId: data.shipId,
        shipName: data.shipName,
        cbBefore: data.cbBefore,
        cbAfter: data.cbAfter,
        contributedAmount: data.contributedAmount,
      },
    });
    const pool = await this.findById(member.poolId);
    if (!pool) throw new Error(`Pool with id ${member.poolId} not found after member creation`);
    return pool;
  }

  async delete(id: string): Promise<void> {
    await prisma.pool.delete({ where: { id } });
  }
}

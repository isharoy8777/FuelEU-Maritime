import { Request, Response } from 'express';
import { PoolRepository } from '../../../../core/ports/PoolRepository';
import { CreatePoolUseCase, CreatePoolInput } from '../../../../core/application/CreatePoolUseCase';

export class PoolingController {
  private createPoolUseCase: CreatePoolUseCase;
  private poolRepo: PoolRepository;

  constructor(
    poolRepo: PoolRepository
  ) {
    this.poolRepo = poolRepo;
    this.createPoolUseCase = new CreatePoolUseCase(poolRepo);
  }

  public getPools = async (_req: Request, res: Response): Promise<void> => {
    try {
      const pools = await this.poolRepo.findAll();
      const normalized = pools.map((pool: any) => {
        const members = Array.isArray(pool.members) ? pool.members : [];
        const totalCB = members.reduce((sum: number, member: any) => sum + (member.cbAfter ?? 0), 0);

        return {
          id: pool.id,
          name: pool.name,
          year: pool.year,
          members: members.length,
          totalCB,
          status: totalCB >= 0 ? 'VALID' : 'INVALID',
          memberDetails: members.map((member: any) => ({
            id: member.id,
            shipId: member.shipId,
            shipName: member.shipName,
            cbBefore: member.cbBefore,
            cbAfter: member.cbAfter,
            contributedAmount: member.contributedAmount,
            status: member.cbAfter >= 0 ? 'SURPLUS' : 'DEFICIT',
          })),
          createdAt: pool.createdAt,
        };
      });

      res.status(200).json({ success: true, data: normalized });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  public createPool = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: CreatePoolInput = req.body;

      if (!input.name || !input.year || !Array.isArray(input.members) || input.members.length < 2) {
        res.status(400).json({ success: false, message: 'name, year, and at least 2 members are required' });
        return;
      }

      const result = await this.createPoolUseCase.execute(input);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}

import { Request, Response } from 'express';
import { PoolRepository } from '../../../../core/ports/PoolRepository';
import { ComplianceRepository } from '../../../../core/ports/ComplianceRepository';
import { CreatePoolUseCase, CreatePoolInput } from '../../../../core/application/CreatePoolUseCase';

export class PoolingController {
  private createPoolUseCase: CreatePoolUseCase;

  constructor(
    poolRepo: PoolRepository
  ) {
    this.createPoolUseCase = new CreatePoolUseCase(poolRepo);
  }

  public createPool = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: CreatePoolInput = req.body;

      if (!input.name || !input.year) {
        res.status(400).json({ success: false, message: 'name and year are required' });
        return;
      }

      const result = await this.createPoolUseCase.execute(input);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}

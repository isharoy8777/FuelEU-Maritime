import { Request, Response } from 'express';
import { BankRepository } from '../../../../core/ports/BankRepository';
import { ComplianceRepository } from '../../../../core/ports/ComplianceRepository';
import { BankSurplusUseCase, BankSurplusInput } from '../../../../core/application/BankSurplusUseCase';
import { ApplyBankedUseCase, ApplyBankedInput } from '../../../../core/application/ApplyBankedUseCase';

export class BankingController {
  private bankSurplusUseCase: BankSurplusUseCase;
  private applyBankedUseCase: ApplyBankedUseCase;

  constructor(
    private bankRepo: BankRepository,
    private complianceRepo: ComplianceRepository
  ) {
    this.bankSurplusUseCase = new BankSurplusUseCase(bankRepo, complianceRepo);
    this.applyBankedUseCase = new ApplyBankedUseCase(bankRepo, complianceRepo);
  }

  public bankSurplus = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: BankSurplusInput = req.body;

      if (!input.shipName || !input.year || !input.amount) {
        res.status(400).json({ success: false, message: 'shipName, year, and amount are required' });
        return;
      }

      const result = await this.bankSurplusUseCase.execute(input);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  public applyBanked = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: ApplyBankedInput = req.body;

      if (!input.shipName || !input.year || !input.amount) {
        res.status(400).json({ success: false, message: 'shipName, year, and amount are required' });
        return;
      }

      const result = await this.applyBankedUseCase.execute(input);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}

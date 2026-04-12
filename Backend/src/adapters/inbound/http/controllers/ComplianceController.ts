import { Request, Response } from 'express';
import { ComplianceRepository } from '../../../../core/ports/ComplianceRepository';
import { RouteRepository } from '../../../../core/ports/RouteRepository';
import { computeComplianceBalance } from '../../../../core/application/ComputeComplianceUseCase';

export class ComplianceController {
  constructor(
    private complianceRepo: ComplianceRepository,
    private routeRepo: RouteRepository
  ) {}

  public getComplianceBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shipId, year } = req.query;

      if (!shipId || !year) {
        res.status(400).json({ success: false, message: 'shipId and year are required' });
        return;
      }

      const parsedYear = parseInt(year as string, 10);
      
      const complianceRecords = await this.complianceRepo.findByShipName(shipId as string);
      const record = complianceRecords.find(c => c.year === parsedYear);
      
      if (!record) {
        res.status(404).json({ success: false, message: `Compliance record for ship ${shipId} in year ${parsedYear} not found` });
        return;
      }
      
      const route = await this.routeRepo.findById(record.routeId);
      
      if (!route) {
        res.status(404).json({ success: false, message: `Route ${record.routeId} not found` });
        return;
      }
      
      const result = computeComplianceBalance({
        route,
        actualGHGIntensity: record.actualGHGIntensity,
        targetGHGIntensity: record.targetGHGIntensity
      });

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}

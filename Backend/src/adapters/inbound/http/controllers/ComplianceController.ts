import { Request, Response } from 'express';
import { ComplianceRepository } from '../../../../core/ports/ComplianceRepository';
import { RouteRepository } from '../../../../core/ports/RouteRepository';
import { BankRepository } from '../../../../core/ports/BankRepository';
import { computeComplianceBalance } from '../../../../core/application/ComputeComplianceUseCase';
import { TARGET_GHG_INTENSITY_2025, resolveRouteMeta } from '../../../../shared/fueleu';

export class ComplianceController {
  constructor(
    private complianceRepo: ComplianceRepository,
    private routeRepo: RouteRepository,
    private bankRepo: BankRepository,
  ) {}

  public getComplianceBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shipId, year } = req.query;

      if (!shipId || !year) {
        res.status(400).json({ success: false, message: 'shipId and year are required' });
        return;
      }

      const parsedYear = parseInt(year as string, 10);
      
      const routeById = await this.routeRepo.findById(shipId as string);

      let complianceRecords = routeById
        ? await this.complianceRepo.findByRouteId(routeById.id)
        : await this.complianceRepo.findByShipName(shipId as string);

      const record = complianceRecords.find(c => c.year === parsedYear) ?? complianceRecords[0];

      const route = routeById ?? (record ? await this.routeRepo.findById(record.routeId) : null);
      
      if (!route) {
        res.status(404).json({ success: false, message: `Route ${shipId} not found` });
        return;
      }

      const result = record
        ? {
            complianceBalance: record.complianceBalance,
            status: record.status,
          }
        : (() => {
            const actualGHGIntensity = resolveRouteMeta(route.id, route.shipName).ghgIntensity;
            const targetGHGIntensity = TARGET_GHG_INTENSITY_2025;
            return computeComplianceBalance({
              route,
              actualGHGIntensity,
              targetGHGIntensity,
            });
          })();

      res.status(200).json({
        success: true,
        data: {
          shipId: route.id,
          shipName: route.shipName,
          year: parsedYear,
          cbBefore: Math.round(result.complianceBalance),
          status: result.status,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  public getAdjustedComplianceBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shipId, year } = req.query;

      if (!year) {
        res.status(400).json({ success: false, message: 'year is required' });
        return;
      }

      const parsedYear = parseInt(year as string, 10);
      const allCompliance = await this.complianceRepo.findByYear(parsedYear);

      const filteredCompliance = shipId
        ? allCompliance.filter((c) => c.routeId === shipId)
        : allCompliance;

      if (filteredCompliance.length === 0) {
        const routes = await this.routeRepo.findAll();
        const fallback = routes
          .filter((r) => !shipId || r.id === shipId)
          .map((route) => {
            const ghg = resolveRouteMeta(route.id, route.shipName).ghgIntensity;
            const computed = computeComplianceBalance({
              route,
              actualGHGIntensity: ghg,
              targetGHGIntensity: TARGET_GHG_INTENSITY_2025,
            });
            return {
              shipId: route.id,
              shipName: route.shipName,
              year: parsedYear,
              cbBefore: Math.round(computed.complianceBalance),
              bankedApplied: 0,
              cbAfter: Math.round(computed.complianceBalance),
              status: computed.complianceBalance >= 0 ? 'SURPLUS' : 'DEFICIT',
            };
          });

        res.status(200).json({ success: true, data: fallback });
        return;
      }

      const adjusted = await Promise.all(
        filteredCompliance.map(async (record) => {
          const route = await this.routeRepo.findById(record.routeId);
          const shipName = route?.shipName ?? record.shipName;
          const cbCurrent = record.complianceBalance;
          return {
            shipId: record.routeId,
            shipName,
            year: record.year,
            cbBefore: Math.round(cbCurrent),
            bankedApplied: 0,
            cbAfter: Math.round(cbCurrent),
            status: cbCurrent >= 0 ? 'SURPLUS' : 'DEFICIT',
          };
        }),
      );

      res.status(200).json({ success: true, data: adjusted });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}

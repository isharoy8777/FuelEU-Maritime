import { Request, Response } from 'express';
import { BankRepository } from '../../../../core/ports/BankRepository';
import { ComplianceRepository } from '../../../../core/ports/ComplianceRepository';
import { RouteRepository } from '../../../../core/ports/RouteRepository';
import { BankSurplusUseCase, BankSurplusInput } from '../../../../core/application/BankSurplusUseCase';
import { ApplyBankedUseCase, ApplyBankedInput } from '../../../../core/application/ApplyBankedUseCase';
import { computeComplianceBalance } from '../../../../core/application/ComputeComplianceUseCase';
import { TARGET_GHG_INTENSITY_2025, resolveRouteMeta } from '../../../../shared/fueleu';

export class BankingController {
  private bankSurplusUseCase: BankSurplusUseCase;
  private applyBankedUseCase: ApplyBankedUseCase;

  constructor(
    private bankRepo: BankRepository,
    private complianceRepo: ComplianceRepository,
    private routeRepo: RouteRepository,
  ) {
    this.bankSurplusUseCase = new BankSurplusUseCase(bankRepo, complianceRepo, routeRepo);
    this.applyBankedUseCase = new ApplyBankedUseCase(bankRepo, complianceRepo, routeRepo);
  }

  private mergeUniqueEntries<T extends { id: string }>(entries: T[]): T[] {
    const map = new Map<string, T>();
    for (const entry of entries) {
      map.set(entry.id, entry);
    }
    return Array.from(map.values());
  }

  private deriveStatus(balance: number): 'SURPLUS' | 'DEFICIT' | 'COMPLIANT' {
    if (balance > 0) return 'SURPLUS';
    if (balance < 0) return 'DEFICIT';
    return 'COMPLIANT';
  }

  private async persistComplianceBalance(
    shipId: string,
    year: number,
    delta: number,
  ): Promise<void> {
    const records = await this.complianceRepo.findByRouteId(shipId);
    const record = records.find((r) => r.year === year);

    if (record) {
      const nextBalance = record.complianceBalance + delta;
      await this.complianceRepo.update(record.id, {
        complianceBalance: nextBalance,
        status: this.deriveStatus(nextBalance),
      });
      return;
    }

    const route = await this.routeRepo.findById(shipId);
    if (!route) {
      return;
    }

    const meta = resolveRouteMeta(route.id, route.shipName);
    const computed = computeComplianceBalance({
      route,
      actualGHGIntensity: meta.ghgIntensity,
      targetGHGIntensity: TARGET_GHG_INTENSITY_2025,
    });

    const nextBalance = computed.complianceBalance + delta;
    await this.complianceRepo.create({
      routeId: route.routeId || route.id,
      shipName: route.shipName,
      actualGHGIntensity: meta.ghgIntensity,
      targetGHGIntensity: TARGET_GHG_INTENSITY_2025,
      energy: computed.energy,
      complianceBalance: nextBalance,
      status: this.deriveStatus(nextBalance),
      year,
    });
  }

  public getRecords = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shipId, year } = req.query;
      const parsedYear = year ? parseInt(year as string, 10) : null;
      const routeId = typeof shipId === 'string' ? shipId : null;

      if (!shipId && !year) {
        const records = await this.bankRepo.findAll();
        res.status(200).json({ success: true, data: records });
        return;
      }

      let records = routeId
        ? await this.bankRepo.findByShipId(routeId)
        : await this.bankRepo.findAll();

      // Backward compatibility: older entries may have been keyed by shipName.
      if (routeId) {
        const route = await this.routeRepo.findById(routeId);
        if (route?.shipName) {
          const byName = await this.bankRepo.findByShipName(route.shipName);
          records = this.mergeUniqueEntries([...records, ...byName]);
        }
      }

      if (parsedYear) {
        records = records.filter((r) => r.year === parsedYear);
      }

      res.status(200).json({ success: true, data: records });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  public getTotals = async (req: Request, res: Response): Promise<void> => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : 2025;
      const routes = (await this.routeRepo.findAll()).filter((route) => route.year === year);

      const totals = await Promise.all(
        routes.map(async (route) => {
          const byId = await this.bankRepo.findByShipId(route.id);
          const byName = await this.bankRepo.findByShipName(route.shipName);
          const entries = this.mergeUniqueEntries([...byId, ...byName]).filter((entry) => entry.year === year);

          const totalBanked = entries
            .filter((entry) => entry.type === 'BANK')
            .reduce((sum, entry) => sum + entry.amount, 0);
          const totalApplied = entries
            .filter((entry) => entry.type === 'APPLY')
            .reduce((sum, entry) => sum + entry.amount, 0);

          const available = totalBanked - totalApplied;
          const complianceRecords = await this.complianceRepo.findByRouteId(route.id);
          const complianceRecord = complianceRecords.find((record) => record.year === year) ?? complianceRecords[0];

          const fallbackCB = (() => {
            const meta = resolveRouteMeta(route.id, route.shipName);
            const computed = computeComplianceBalance({
              route,
              actualGHGIntensity: meta.ghgIntensity,
              targetGHGIntensity: TARGET_GHG_INTENSITY_2025,
            });
            return computed.complianceBalance - totalBanked + totalApplied;
          })();

          return {
            shipId: route.id,
            shipName: route.shipName,
            year,
            currentCB: Math.round(complianceRecord?.complianceBalance ?? fallbackCB),
            bankedAvailable: Math.round(available),
            totalBanked: Math.round(totalBanked),
            totalApplied: Math.round(totalApplied),
          };
        }),
      );

      res.status(200).json({ success: true, data: totals });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  public bankSurplus = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: BankSurplusInput = req.body;

      if (!input.shipId || !input.shipName || !input.year || !input.amount) {
        res.status(400).json({ success: false, message: 'shipId, shipName, year, and amount are required' });
        return;
      }

      const entry = await this.bankSurplusUseCase.execute(input);
      await this.persistComplianceBalance(input.shipId, input.year, -input.amount);
      let remainingBalance = await this.bankRepo.getBalance(input.shipId);
      const legacyEntries = await this.bankRepo.findByShipName(input.shipName);
      if (legacyEntries.length > 0) {
        const legacyBalance = legacyEntries.reduce((acc, current) => {
          if (current.type === 'BANK') return acc + current.amount;
          if (current.type === 'APPLY') return acc - current.amount;
          return acc;
        }, 0);
        remainingBalance += legacyBalance;
      }
      res.status(200).json({ success: true, data: { entry, remainingBalance } });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  public applyBanked = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: ApplyBankedInput = req.body;

      if (!input.shipId || !input.shipName || !input.year || !input.amount) {
        res.status(400).json({ success: false, message: 'shipId, shipName, year, and amount are required' });
        return;
      }

      const entry = await this.applyBankedUseCase.execute(input);
      await this.persistComplianceBalance(input.shipId, input.year, input.amount);
      let remainingBalance = await this.bankRepo.getBalance(input.shipId);
      const legacyEntries = await this.bankRepo.findByShipName(input.shipName);
      if (legacyEntries.length > 0) {
        const legacyBalance = legacyEntries.reduce((acc, current) => {
          if (current.type === 'BANK') return acc + current.amount;
          if (current.type === 'APPLY') return acc - current.amount;
          return acc;
        }, 0);
        remainingBalance += legacyBalance;
      }
      res.status(200).json({ success: true, data: { entry, remainingBalance } });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}

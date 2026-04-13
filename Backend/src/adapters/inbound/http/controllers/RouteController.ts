import { Request, Response } from 'express';
import { RouteRepository } from '../../../../core/ports/RouteRepository';
import { compareRoutes, RouteWithIntensity } from '../../../../core/application/CompareRoutesUseCase';
import { TARGET_GHG_INTENSITY_2025, resolveRouteMeta } from '../../../../shared/fueleu';

export class RouteController {
  private baselineRouteId: string | null = null;

  constructor(private routeRepo: RouteRepository) {}

  private resolveMeta(routeId: string, shipName: string) {
    return resolveRouteMeta(routeId, shipName);
  }

  private resolveYear(routeId: string, shipName: string): number {
    return this.resolveMeta(routeId, shipName)?.year ?? 2025;
  }

  private resolveVesselType(routeId: string, shipName: string): string {
    return this.resolveMeta(routeId, shipName)?.vesselType ?? 'Unknown';
  }

  private resolveTotalEmissions(routeId: string, shipName: string): number {
    return this.resolveMeta(routeId, shipName)?.totalEmissions ?? 0;
  }

  private resolveGhgIntensity(routeId: string, shipName: string): number {
    return this.resolveMeta(routeId, shipName)?.ghgIntensity ?? TARGET_GHG_INTENSITY_2025;
  }

  public getRoutes = async (req: Request, res: Response): Promise<void> => {
    try {
      const routes = await this.routeRepo.findAll();
      const baselineId =
        this.baselineRouteId ??
        routes.find((route) => route.isBaseline)?.id ??
        routes.find((route) => route.isBaseline)?.routeId ??
        routes[0]?.id ??
        routes[0]?.routeId ??
        null;

      const normalized = routes.map((route) => ({
        id: route.id,
        routeId: route.routeId || route.id,
        vesselName: route.shipName,
        vesselType: this.resolveVesselType(route.id, route.shipName),
        fuelType: route.fuelType,
        year: this.resolveYear(route.id, route.shipName),
        ghgIntensity: this.resolveGhgIntensity(route.id, route.shipName),
        fuelConsumption: route.fuelConsumption,
        distance: route.distance,
        totalEmissions: this.resolveTotalEmissions(route.id, route.shipName),
        isBaseline: route.id === baselineId || route.routeId === baselineId || !!route.isBaseline,
      }));

      res.status(200).json({ success: true, data: normalized });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  public createBaseline = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const route = await this.routeRepo.findById(id);

      if (!route) {
        res.status(404).json({ success: false, message: `Route ${id} not found` });
        return;
      }

      const allRoutes = await this.routeRepo.findAll();
      await Promise.all(
        allRoutes.map((existingRoute) =>
          this.routeRepo.update(existingRoute.id, { isBaseline: existingRoute.id === route.id }),
        ),
      );

      this.baselineRouteId = id;

      res.status(200).json({
        success: true,
        data: {
          id: route.id,
          routeId: route.routeId || route.id,
          vesselName: route.shipName,
          vesselType: this.resolveVesselType(route.id, route.shipName),
          fuelType: route.fuelType,
          year: this.resolveYear(route.id, route.shipName),
          ghgIntensity: this.resolveGhgIntensity(route.id, route.shipName),
          fuelConsumption: route.fuelConsumption,
          distance: route.distance,
          totalEmissions: this.resolveTotalEmissions(route.id, route.shipName),
          isBaseline: true,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  public getComparison = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method === 'POST') {
        const { baselineRoute, routes, targetGHGIntensity } = req.body ?? {};
        if (!baselineRoute || !Array.isArray(routes) || routes.length === 0 || typeof targetGHGIntensity !== 'number') {
          res.status(400).json({ success: false, message: 'baselineRoute, routes, and targetGHGIntensity are required' });
          return;
        }

        const legacyResult = compareRoutes(baselineRoute as RouteWithIntensity, routes as RouteWithIntensity[], targetGHGIntensity);
        res.status(200).json({ success: true, data: legacyResult });
        return;
      }

      const routes = await this.routeRepo.findAll();

      if (routes.length === 0) {
        res.status(400).json({ success: false, message: 'No routes found in database.' });
        return;
      }

      const routesWithIntensity = routes.map(route => ({
        route,
        actualGHGIntensity: this.resolveGhgIntensity(route.id, route.shipName),
      }));

      const baselineId = (req.query.baselineId as string) || this.baselineRouteId || routes[0].id || routes[0].routeId;
      const baselineRouteWithIntensity =
        routesWithIntensity.find((r) => r.route.id === baselineId || r.route.routeId === baselineId) ||
        routesWithIntensity[0];

      const result = compareRoutes(baselineRouteWithIntensity, routesWithIntensity, TARGET_GHG_INTENSITY_2025);
      
      const mappedDetails = result.comparisons.map(c => ({
        routeId: c.routeId,
        vesselName: c.shipName,
        ghgIntensity: c.actualGHGIntensity,
        percentDiff: c.percentDiff,
        compliant: c.compliant,
        complianceLabel: c.compliant ? 'COMPLIANT' : 'NON-COMPLIANT',
        complianceBalance: c.compliance.complianceBalance,
      }));

      res.status(200).json({
        success: true,
        data: {
          baselineRouteId: baselineRouteWithIntensity.route.id,
          targetGHGIntensity: TARGET_GHG_INTENSITY_2025,
          details: mappedDetails,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}

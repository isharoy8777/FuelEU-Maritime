import { Request, Response } from 'express';
import { RouteRepository } from '../../../../core/ports/RouteRepository';
import { compareRoutes, RouteWithIntensity } from '../../../../core/application/CompareRoutesUseCase';

export class RouteController {
  constructor(private routeRepo: RouteRepository) {}

  public getRoutes = async (req: Request, res: Response): Promise<void> => {
    try {
      const routes = await this.routeRepo.findAll();
      res.status(200).json({ success: true, data: routes });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  public createBaseline = async (req: Request, res: Response): Promise<void> => {
    try {
      // Create baseline implementation placeholder as per basic REST mapping requirements.
      const id = req.params.id;
      // You can implement custom baseline generation or use Route creation logic if mapped.
      res.status(201).json({ success: true, data: { id, message: 'Baseline created' } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  public getComparison = async (req: Request, res: Response): Promise<void> => {
    try {
      const { baselineRoute, routes, targetGHGIntensity } = req.body;
      
      if (!baselineRoute || !routes || !Array.isArray(routes) || targetGHGIntensity === undefined) {
        res.status(400).json({ success: false, message: 'Invalid input. Required: baselineRoute, routes array, and targetGHGIntensity' });
        return;
      }

      const result = compareRoutes(baselineRoute, routes, targetGHGIntensity);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}

import { Router } from 'express';
import { RouteController } from '../../adapters/inbound/http/controllers/RouteController';
import { ComplianceController } from '../../adapters/inbound/http/controllers/ComplianceController';
import { BankingController } from '../../adapters/inbound/http/controllers/BankingController';
import { PoolingController } from '../../adapters/inbound/http/controllers/PoolingController';

import { PostgresRouteRepository } from '../../adapters/outbound/postgres/PostgresRouteRepository';
import { PostgresComplianceRepository } from '../../adapters/outbound/postgres/PostgresComplianceRepository';
import { PostgresBankRepository } from '../../adapters/outbound/postgres/PostgresBankRepository';
import { PostgresPoolRepository } from '../../adapters/outbound/postgres/PostgresPoolRepository';

export function setupRoutes(): Router {
  const router = Router();

  // Instantiate Repositories
  const routeRepo = new PostgresRouteRepository();
  const complianceRepo = new PostgresComplianceRepository();
  const bankRepo = new PostgresBankRepository();
  const poolRepo = new PostgresPoolRepository();

  // Instantiate Controllers with injected dependencies
  const routeController = new RouteController(routeRepo);
  const complianceController = new ComplianceController(complianceRepo, routeRepo);
  const bankingController = new BankingController(bankRepo, complianceRepo);
  const poolingController = new PoolingController(poolRepo);

  // ─── Map HTTP Endpoints to Controller Methods ─────────────────

  // Route points
  router.get('/routes', routeController.getRoutes);
  router.post('/routes/:id/baseline', routeController.createBaseline);
  router.post('/routes/comparison', routeController.getComparison); // Changed to post standardizing input body

  // Compliance points
  router.get('/compliance/cb', complianceController.getComplianceBalance);

  // Banking points
  router.post('/banking/bank', bankingController.bankSurplus);
  router.post('/banking/apply', bankingController.applyBanked);

  // Pooling points
  router.post('/pools', poolingController.createPool);

  return router;
}

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
  const complianceController = new ComplianceController(complianceRepo, routeRepo, bankRepo);
  const bankingController = new BankingController(bankRepo, complianceRepo, routeRepo);
  const poolingController = new PoolingController(poolRepo);

  // ─── Map HTTP Endpoints to Controller Methods ─────────────────

  // Route points
  router.get('/routes', routeController.getRoutes);
  router.post('/routes/:id/baseline', routeController.createBaseline);
  router.get('/routes/comparison', routeController.getComparison);
  router.post('/routes/comparison', routeController.getComparison);

  // Compliance points
  router.get('/compliance/cb', complianceController.getComplianceBalance);
  router.get('/compliance/adjusted-cb', complianceController.getAdjustedComplianceBalance);

  // Banking points
  router.get('/banking/records', bankingController.getRecords);
  router.get('/banking/totals', bankingController.getTotals);
  router.post('/banking/bank', bankingController.bankSurplus);
  router.post('/banking/apply', bankingController.applyBanked);

  // Pooling points
  router.get('/pools', poolingController.getPools);
  router.post('/pools', poolingController.createPool);

  return router;
}

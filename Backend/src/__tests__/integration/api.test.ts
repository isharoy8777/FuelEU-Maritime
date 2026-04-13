import request from 'supertest';
import express, { Application } from 'express';

// ─── Mock all Postgres Adapters BEFORE importing routes ──────
jest.mock('../../adapters/outbound/postgres/PostgresRouteRepository');
jest.mock('../../adapters/outbound/postgres/PostgresComplianceRepository');
jest.mock('../../adapters/outbound/postgres/PostgresBankRepository');
jest.mock('../../adapters/outbound/postgres/PostgresPoolRepository');

import { PostgresRouteRepository } from '../../adapters/outbound/postgres/PostgresRouteRepository';
import { PostgresComplianceRepository } from '../../adapters/outbound/postgres/PostgresComplianceRepository';
import { PostgresBankRepository } from '../../adapters/outbound/postgres/PostgresBankRepository';
import { PostgresPoolRepository } from '../../adapters/outbound/postgres/PostgresPoolRepository';

import { createApp } from '../../infrastructure/server/app';

// ─── Sample Data ─────────────────────────────────────────────

const sampleRoute = {
  id: 'route-1',
  shipName: 'MV TestShip',
  departurePort: 'Hamburg',
  arrivalPort: 'Rotterdam',
  distance: 500,
  fuelType: 'VLSFO',
  fuelConsumption: 100,
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-02'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleCompliance = {
  id: 'comp-1',
  routeId: 'route-1',
  shipName: 'MV TestShip',
  actualGHGIntensity: 80,
  targetGHGIntensity: 91.16,
  energy: 4_100_000,
  complianceBalance: 456_560,
  status: 'SURPLUS',
  year: 2025,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleBankEntry = {
  id: 'entry-1',
  shipId: 'route-1',
  shipName: 'MV TestShip',
  amount: 100_000,
  year: 2025,
  type: 'BANK',
  createdAt: new Date(),
};

const samplePool = {
  id: 'pool-1',
  name: 'Test Pool',
  year: 2025,
  members: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Test Suite ───────────────────────────────────────────────

describe('Integration Tests — FuelEU Maritime API', () => {
  let app: Application;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementations
    (PostgresRouteRepository as jest.Mock).mockImplementation(() => ({
      findAll: jest.fn().mockResolvedValue([sampleRoute]),
      findById: jest.fn().mockResolvedValue(sampleRoute),
      create: jest.fn().mockResolvedValue(sampleRoute),
      update: jest.fn().mockResolvedValue(sampleRoute),
      delete: jest.fn().mockResolvedValue(undefined),
    }));

    (PostgresComplianceRepository as jest.Mock).mockImplementation(() => ({
      findAll: jest.fn().mockResolvedValue([sampleCompliance]),
      findById: jest.fn().mockResolvedValue(sampleCompliance),
      findByRouteId: jest.fn().mockResolvedValue([sampleCompliance]),
      findByShipName: jest.fn().mockResolvedValue([sampleCompliance]),
      findByYear: jest.fn().mockResolvedValue([sampleCompliance]),
      create: jest.fn().mockResolvedValue(sampleCompliance),
      update: jest.fn().mockResolvedValue(sampleCompliance),
      delete: jest.fn().mockResolvedValue(undefined),
    }));

    (PostgresBankRepository as jest.Mock).mockImplementation(() => ({
      findAll: jest.fn().mockResolvedValue([sampleBankEntry]),
      findById: jest.fn().mockResolvedValue(sampleBankEntry),
      findByShipId: jest.fn().mockResolvedValue([sampleBankEntry]),
      findByShipName: jest.fn().mockResolvedValue([sampleBankEntry]),
      findByYear: jest.fn().mockResolvedValue([sampleBankEntry]),
      create: jest.fn().mockResolvedValue({ ...sampleBankEntry, type: 'BANK' }),
      getBalance: jest.fn().mockResolvedValue(500_000),
    }));

    (PostgresPoolRepository as jest.Mock).mockImplementation(() => ({
      findAll: jest.fn().mockResolvedValue([samplePool]),
      findById: jest.fn().mockResolvedValue({ ...samplePool, members: [] }),
      findByYear: jest.fn().mockResolvedValue([samplePool]),
      create: jest.fn().mockResolvedValue(samplePool),
      addMember: jest.fn().mockResolvedValue(samplePool),
      delete: jest.fn().mockResolvedValue(undefined),
    }));

    app = createApp();
  });

  // ── GET /routes ─────────────────────────────────────────────

  describe('GET /api/v1/routes', () => {
    it('should return 200 with list of routes', async () => {
      // Act
      const res = await request(app).get('/api/v1/routes');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].id).toBe('route-1');
    });
  });

  // ── POST /routes/comparison ─────────────────────────────────

  describe('POST /api/v1/routes/comparison', () => {
    it('should return 200 with comparison result for valid input', async () => {
      // Arrange
      const body = {
        baselineRoute: {
          route: { ...sampleRoute, id: 'r-baseline' },
          actualGHGIntensity: 80,
        },
        routes: [
          {
            route: { ...sampleRoute, id: 'r-compare' },
            actualGHGIntensity: 88,
          },
        ],
        targetGHGIntensity: 91.16,
      };

      // Act
      const res = await request(app).post('/api/v1/routes/comparison').send(body);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('baseline');
      expect(res.body.data).toHaveProperty('comparisons');
    });

    it('should return 400 when input is missing', async () => {
      const res = await request(app).post('/api/v1/routes/comparison').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /banking/bank ──────────────────────────────────────

  describe('POST /api/v1/banking/bank', () => {
    it('should return 200 when banking a valid surplus', async () => {
      const body = { shipId: 'route-1', shipName: 'MV TestShip', year: 2025, amount: 100_000 };

      const res = await request(app).post('/api/v1/banking/bank').send(body);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app).post('/api/v1/banking/bank').send({ shipName: 'MV TestShip' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /banking/apply ─────────────────────────────────────

  describe('POST /api/v1/banking/apply', () => {
    it('should return 400 if ship has no deficit', async () => {
      // The mock compliance returns SURPLUS (positive CB), so ApplyBanked should reject
      const body = { shipId: 'route-1', shipName: 'MV TestShip', year: 2025, amount: 50_000 };

      const res = await request(app).post('/api/v1/banking/apply').send(body);

      // ApplyBanked rejects when ship has no deficit
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app).post('/api/v1/banking/apply').send({ shipName: 'MV TestShip' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /pools ─────────────────────────────────────────────

  describe('POST /api/v1/pools', () => {
    it('should return 201 when creating a valid pool', async () => {
      const body = {
        name: 'FuelEU Pool 2025',
        year: 2025,
        members: [
          { shipName: 'Ship A', complianceBalance: 500_000 },
          { shipName: 'Ship B', complianceBalance: -100_000 },
        ],
      };

      const res = await request(app).post('/api/v1/pools').send(body);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/pools')
        .send({ year: 2025, members: [] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when pool has invalid total CB', async () => {
      const body = {
        name: 'Bad Pool',
        year: 2025,
        members: [
          { shipName: 'Ship A', complianceBalance: -300_000 },
          { shipName: 'Ship B', complianceBalance: -100_000 },
        ],
      };

      const res = await request(app).post('/api/v1/pools').send(body);

      expect(res.body.success).toBe(false);
    });
  });

  // ── Health check ────────────────────────────────────────────

  describe('GET /api/health', () => {
    it('should return 200 with status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});

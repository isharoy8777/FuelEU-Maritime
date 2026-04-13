import { BankSurplusUseCase } from '../../../core/application/BankSurplusUseCase';
import { ApplyBankedUseCase } from '../../../core/application/ApplyBankedUseCase';
import { BankRepository } from '../../../core/ports/BankRepository';
import { ComplianceRepository } from '../../../core/ports/ComplianceRepository';
import { BankEntry } from '../../../core/domain/BankEntry';
import { Compliance } from '../../../core/domain/Compliance';

// ─── Mock Factories ───────────────────────────────────────────

function makeMockBankRepo(overrides: Partial<BankRepository> = {}): BankRepository {
  return {
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    findByShipId: jest.fn().mockResolvedValue([]),
    findByShipName: jest.fn().mockResolvedValue([]),
    findByYear: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({
      id: 'entry-1',
      shipId: 'MV TestShip',
      shipName: 'MV TestShip',
      amount: 100,
      year: 2025,
      type: 'BANK',
      createdAt: new Date(),
    } as BankEntry),
    getBalance: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}

function makeMockComplianceRepo(
  totalCB: number,
  overrides: Partial<ComplianceRepository> = {}
): ComplianceRepository {
  const records: Compliance[] = [
    {
      id: 'comp-1',
      routeId: 'route-1',
      shipName: 'MV TestShip',
      actualGHGIntensity: 80,
      targetGHGIntensity: 91.16,
      energy: 4_100_000,
      complianceBalance: totalCB,
      status: totalCB > 0 ? 'SURPLUS' : totalCB < 0 ? 'DEFICIT' : 'COMPLIANT',
      year: 2025,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  return {
    findAll: jest.fn().mockResolvedValue(records),
    findById: jest.fn().mockResolvedValue(records[0]),
    findByRouteId: jest.fn().mockResolvedValue(records),
    findByShipName: jest.fn().mockResolvedValue(records),
    findByYear: jest.fn().mockResolvedValue(records),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  };
}

// ─── BankSurplusUseCase Tests ─────────────────────────────────

describe('BankSurplusUseCase', () => {
  describe('Valid banking', () => {
    it('should bank a valid surplus amount', async () => {
      // Arrange
      const bankRepo = makeMockBankRepo();
      const complianceRepo = makeMockComplianceRepo(500_000); // Positive CB
      const useCase = new BankSurplusUseCase(bankRepo, complianceRepo);

      // Act
      const result = await useCase.execute({ shipName: 'MV TestShip', year: 2025, amount: 100_000 });

      // Assert
      expect(bankRepo.create).toHaveBeenCalledWith({
        shipId: 'MV TestShip',
        shipName: 'MV TestShip',
        year: 2025,
        amount: 100_000,
        type: 'BANK',
      });
      expect(result.type).toBe('BANK');
    });
  });

  describe('Rejection cases', () => {
    it('should reject when amount is zero', async () => {
      const bankRepo = makeMockBankRepo();
      const complianceRepo = makeMockComplianceRepo(500_000);
      const useCase = new BankSurplusUseCase(bankRepo, complianceRepo);

      await expect(
        useCase.execute({ shipName: 'MV TestShip', year: 2025, amount: 0 })
      ).rejects.toThrow('Bank amount must be greater than zero.');
    });

    it('should reject when amount is negative', async () => {
      const bankRepo = makeMockBankRepo();
      const complianceRepo = makeMockComplianceRepo(500_000);
      const useCase = new BankSurplusUseCase(bankRepo, complianceRepo);

      await expect(
        useCase.execute({ shipName: 'MV TestShip', year: 2025, amount: -50 })
      ).rejects.toThrow('Bank amount must be greater than zero.');
    });

    it('should reject when ship has no compliance records', async () => {
      const bankRepo = makeMockBankRepo();
      const complianceRepo = makeMockComplianceRepo(500_000, {
        findByShipName: jest.fn().mockResolvedValue([]),
      });
      const useCase = new BankSurplusUseCase(bankRepo, complianceRepo);

      await expect(
        useCase.execute({ shipName: 'Unknown Ship', year: 2025, amount: 100 })
      ).rejects.toThrow('No compliance records found for ship');
    });

    it('should reject when ship has negative CB (deficit)', async () => {
      const bankRepo = makeMockBankRepo();
      const complianceRepo = makeMockComplianceRepo(-200_000); // Negative CB
      const useCase = new BankSurplusUseCase(bankRepo, complianceRepo);

      await expect(
        useCase.execute({ shipName: 'MV TestShip', year: 2025, amount: 100 })
      ).rejects.toThrow('has no surplus to bank');
    });

    it('should reject banking more than available surplus', async () => {
      const bankRepo = makeMockBankRepo();
      const complianceRepo = makeMockComplianceRepo(50_000); // Only 50k available
      const useCase = new BankSurplusUseCase(bankRepo, complianceRepo);

      await expect(
        useCase.execute({ shipName: 'MV TestShip', year: 2025, amount: 100_000 })
      ).rejects.toThrow('exceeds available surplus');
    });
  });
});

// ─── ApplyBankedUseCase Tests ─────────────────────────────────

describe('ApplyBankedUseCase', () => {
  describe('Valid application', () => {
    it('should apply banked credits when ship has deficit and sufficient balance', async () => {
      // Arrange
      const bankRepo = makeMockBankRepo({
        getBalance: jest.fn().mockResolvedValue(200_000),
        create: jest.fn().mockResolvedValue({
          id: 'entry-2',
          shipId: 'MV TestShip',
          shipName: 'MV TestShip',
          amount: 50_000,
          year: 2025,
          type: 'APPLY',
          createdAt: new Date(),
        } as BankEntry),
      });
      const complianceRepo = makeMockComplianceRepo(-300_000); // Deficit ship
      const useCase = new ApplyBankedUseCase(bankRepo, complianceRepo);

      // Act
      const result = await useCase.execute({ shipName: 'MV TestShip', year: 2025, amount: 50_000 });

      // Assert
      expect(bankRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'APPLY', amount: 50_000, shipId: 'MV TestShip' })
      );
      expect(result.type).toBe('APPLY');
    });
  });

  describe('Rejection cases', () => {
    it('should reject when amount is zero', async () => {
      const bankRepo = makeMockBankRepo({ getBalance: jest.fn().mockResolvedValue(200_000) });
      const complianceRepo = makeMockComplianceRepo(-300_000);
      const useCase = new ApplyBankedUseCase(bankRepo, complianceRepo);

      await expect(
        useCase.execute({ shipName: 'MV TestShip', year: 2025, amount: 0 })
      ).rejects.toThrow('Apply amount must be greater than zero.');
    });

    it('should reject when ship has no banked balance', async () => {
      const bankRepo = makeMockBankRepo({ getBalance: jest.fn().mockResolvedValue(0) });
      const complianceRepo = makeMockComplianceRepo(-300_000);
      const useCase = new ApplyBankedUseCase(bankRepo, complianceRepo);

      await expect(
        useCase.execute({ shipName: 'MV TestShip', year: 2025, amount: 50_000 })
      ).rejects.toThrow('no banked surplus available');
    });

    it('should reject over-application exceeding banked balance', async () => {
      const bankRepo = makeMockBankRepo({ getBalance: jest.fn().mockResolvedValue(10_000) });
      const complianceRepo = makeMockComplianceRepo(-300_000);
      const useCase = new ApplyBankedUseCase(bankRepo, complianceRepo);

      await expect(
        useCase.execute({ shipName: 'MV TestShip', year: 2025, amount: 50_000 })
      ).rejects.toThrow('exceeds available banked balance');
    });

    it('should reject when ship has no deficit (positive CB)', async () => {
      const bankRepo = makeMockBankRepo({ getBalance: jest.fn().mockResolvedValue(200_000) });
      const complianceRepo = makeMockComplianceRepo(100_000); // Surplus — no deficit
      const useCase = new ApplyBankedUseCase(bankRepo, complianceRepo);

      await expect(
        useCase.execute({ shipName: 'MV TestShip', year: 2025, amount: 50_000 })
      ).rejects.toThrow('no deficit to offset');
    });
  });
});

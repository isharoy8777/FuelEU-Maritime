import { CreatePoolUseCase, CreatePoolInput } from '../../../core/application/CreatePoolUseCase';
import { PoolRepository } from '../../../core/ports/PoolRepository';
import { Pool, PoolMember } from '../../../core/domain/Pool';

// ─── Mock Factories ───────────────────────────────────────────

function makeMockPoolRepo(overrides: Partial<PoolRepository> = {}): PoolRepository {
  const mockPool: Pool = {
    id: 'pool-1',
    name: 'Test Pool',
    year: 2025,
    members: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    findAll: jest.fn().mockResolvedValue([mockPool]),
    findById: jest.fn().mockResolvedValue({ ...mockPool, members: [] }),
    findByYear: jest.fn().mockResolvedValue([mockPool]),
    create: jest.fn().mockResolvedValue(mockPool),
    addMember: jest.fn().mockImplementation(async (data) => ({
      ...mockPool,
      members: [
        {
          id: `member-${Date.now()}`,
          poolId: 'pool-1',
          shipName: data.shipName,
          complianceBalance: data.complianceBalance,
          contributedAmount: data.contributedAmount,
          createdAt: new Date(),
        } as PoolMember,
      ],
    })),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────

describe('CreatePoolUseCase', () => {
  describe('Valid pool creation', () => {
    it('should create a pool when total CB ≥ 0', async () => {
      // Arrange
      const poolRepo = makeMockPoolRepo();
      const useCase = new CreatePoolUseCase(poolRepo);
      const input: CreatePoolInput = {
        name: 'FuelEU Pool 2025',
        year: 2025,
        members: [
          { shipName: 'Ship A', complianceBalance: 500_000 },  // Surplus
          { shipName: 'Ship B', complianceBalance: -200_000 },  // Deficit
        ],
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(poolRepo.create).toHaveBeenCalledWith({ name: 'FuelEU Pool 2025', year: 2025 });
      expect(result.allocations).toHaveLength(2);
    });

    it('should transfer surplus to offset deficit (greedy)', async () => {
      const poolRepo = makeMockPoolRepo();
      const useCase = new CreatePoolUseCase(poolRepo);
      const input: CreatePoolInput = {
        name: 'Pool A',
        year: 2025,
        members: [
          { shipName: 'Surplus Ship', complianceBalance: 300_000 },
          { shipName: 'Deficit Ship', complianceBalance: -100_000 },
        ],
      };

      const { allocations } = await useCase.execute(input);

      // Surplus ship gave away 100k
      const surplusAlloc = allocations.find(a => a.shipName === 'Surplus Ship')!;
      expect(surplusAlloc.cbAfter).toBe(200_000);
      expect(surplusAlloc.contributedAmount).toBe(100_000);

      // Deficit ship received 100k and is now at 0
      const deficitAlloc = allocations.find(a => a.shipName === 'Deficit Ship')!;
      expect(deficitAlloc.cbAfter).toBe(0);
    });

    it('should ensure deficit ship does not become worse (partially covered)', async () => {
      const poolRepo = makeMockPoolRepo();
      const useCase = new CreatePoolUseCase(poolRepo);
      const input: CreatePoolInput = {
        name: 'Pool B',
        year: 2025,
        members: [
          { shipName: 'Ship A', complianceBalance: 50_000 },   // Surplus
          { shipName: 'Ship B', complianceBalance: -20_000 },  // Partial deficit — net total is +30k
        ],
      };

      const { allocations } = await useCase.execute(input);
      const deficitAlloc = allocations.find((a: any) => a.shipName === 'Ship B')!;

      // B should be fully covered since surplus > deficit
      expect(deficitAlloc.cbAfter).toBeGreaterThanOrEqual(0);
    });

    it('should ensure surplus ship does not go negative', async () => {
      const poolRepo = makeMockPoolRepo();
      const useCase = new CreatePoolUseCase(poolRepo);
      const input: CreatePoolInput = {
        name: 'Pool C',
        year: 2025,
        members: [
          { shipName: 'Ship A', complianceBalance: 100_000 },
          { shipName: 'Ship B', complianceBalance: -50_000 },
        ],
      };

      const { allocations } = await useCase.execute(input);
      const surplusAlloc = allocations.find(a => a.shipName === 'Ship A')!;
      expect(surplusAlloc.cbAfter).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Invalid pool creation', () => {
    it('should reject a pool with total CB < 0', async () => {
      const poolRepo = makeMockPoolRepo();
      const useCase = new CreatePoolUseCase(poolRepo);
      const input: CreatePoolInput = {
        name: 'Bad Pool',
        year: 2025,
        members: [
          { shipName: 'Ship A', complianceBalance: -100_000 },
          { shipName: 'Ship B', complianceBalance: -200_000 },
        ],
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        'Total pool compliance balance is negative'
      );
    });

    it('should reject a pool with fewer than 2 members', async () => {
      const poolRepo = makeMockPoolRepo();
      const useCase = new CreatePoolUseCase(poolRepo);
      const input: CreatePoolInput = {
        name: 'Solo Pool',
        year: 2025,
        members: [{ shipName: 'Ship A', complianceBalance: 100_000 }],
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        'A pool must have at least 2 members.'
      );
    });

    it('should reject a pool with zero members', async () => {
      const poolRepo = makeMockPoolRepo();
      const useCase = new CreatePoolUseCase(poolRepo);
      const input: CreatePoolInput = { name: 'Empty Pool', year: 2025, members: [] };

      await expect(useCase.execute(input)).rejects.toThrow();
    });
  });
});

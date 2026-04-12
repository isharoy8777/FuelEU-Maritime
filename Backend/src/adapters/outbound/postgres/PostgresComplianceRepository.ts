import prisma from '../../../infrastructure/db/prismaClient';
import { ComplianceRepository } from '../../../core/ports/ComplianceRepository';
import { Compliance, CreateComplianceInput, UpdateComplianceInput } from '../../../core/domain/Compliance';

export class PostgresComplianceRepository implements ComplianceRepository {
  async findAll(): Promise<Compliance[]> {
    return prisma.shipCompliance.findMany();
  }

  async findById(id: string): Promise<Compliance | null> {
    return prisma.shipCompliance.findUnique({ where: { id } });
  }

  async findByRouteId(routeId: string): Promise<Compliance[]> {
    return prisma.shipCompliance.findMany({ where: { routeId } });
  }

  async findByShipName(shipName: string): Promise<Compliance[]> {
    return prisma.shipCompliance.findMany({ where: { shipName } });
  }

  async findByYear(year: number): Promise<Compliance[]> {
    return prisma.shipCompliance.findMany({ where: { year } });
  }

  async create(data: CreateComplianceInput): Promise<Compliance> {
    return prisma.shipCompliance.create({ data });
  }

  async update(id: string, data: UpdateComplianceInput): Promise<Compliance> {
    return prisma.shipCompliance.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.shipCompliance.delete({ where: { id } });
  }
}

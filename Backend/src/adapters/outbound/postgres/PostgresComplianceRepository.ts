import prisma from '../../../infrastructure/db/prismaClient';
import { ComplianceRepository } from '../../../core/ports/ComplianceRepository';
import { Compliance, CreateComplianceInput, UpdateComplianceInput } from '../../../core/domain/Compliance';
import { Prisma } from '@prisma/client';

function toDomain(record: any): Compliance {
  return {
    id: record.id,
    routeId: record.shipId,
    shipName: record.shipName,
    actualGHGIntensity: record.actualGHGIntensity,
    targetGHGIntensity: record.targetGHGIntensity,
    energy: record.energy,
    complianceBalance: record.complianceBalance,
    status: record.status,
    year: record.year,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function toCreateData(data: CreateComplianceInput): Prisma.ShipComplianceCreateInput {
  return {
    shipId: data.routeId,
    shipName: data.shipName,
    year: data.year,
    cbGco2eq: data.complianceBalance,
    actualGHGIntensity: data.actualGHGIntensity,
    targetGHGIntensity: data.targetGHGIntensity,
    energy: data.energy,
    complianceBalance: data.complianceBalance,
    status: data.status,
    route: {
      connect: {
        routeId: data.routeId,
      },
    },
  };
}

function toUpdateData(data: UpdateComplianceInput): Prisma.ShipComplianceUpdateInput {
  const updateData: Prisma.ShipComplianceUpdateInput = {};

  if (data.routeId !== undefined) {
    updateData.shipId = data.routeId;
    updateData.route = {
      connect: {
        routeId: data.routeId,
      },
    };
  }
  if (data.shipName !== undefined) updateData.shipName = data.shipName;
  if (data.year !== undefined) updateData.year = data.year;
  if (data.actualGHGIntensity !== undefined) updateData.actualGHGIntensity = data.actualGHGIntensity;
  if (data.targetGHGIntensity !== undefined) updateData.targetGHGIntensity = data.targetGHGIntensity;
  if (data.energy !== undefined) updateData.energy = data.energy;
  if (data.complianceBalance !== undefined) {
    updateData.complianceBalance = data.complianceBalance;
    updateData.cbGco2eq = data.complianceBalance;
  }
  if (data.status !== undefined) updateData.status = data.status;

  return updateData;
}

export class PostgresComplianceRepository implements ComplianceRepository {
  async findAll(): Promise<Compliance[]> {
    const records = await prisma.shipCompliance.findMany();
    return records.map(toDomain);
  }

  async findById(id: string): Promise<Compliance | null> {
    const record = await prisma.shipCompliance.findUnique({ where: { id } });
    return record ? toDomain(record) : null;
  }

  async findByRouteId(routeId: string): Promise<Compliance[]> {
    const records = await prisma.shipCompliance.findMany({
      where: {
        OR: [
          { shipId: routeId },
          { route: { id: routeId } },
        ],
      },
    });
    return records.map(toDomain);
  }

  async findByShipName(shipName: string): Promise<Compliance[]> {
    const records = await prisma.shipCompliance.findMany({ where: { shipName } });
    return records.map(toDomain);
  }

  async findByYear(year: number): Promise<Compliance[]> {
    const records = await prisma.shipCompliance.findMany({ where: { year } });
    return records.map(toDomain);
  }

  async create(data: CreateComplianceInput): Promise<Compliance> {
    const created = await prisma.shipCompliance.create({ data: toCreateData(data) });
    return toDomain(created);
  }

  async update(id: string, data: UpdateComplianceInput): Promise<Compliance> {
    const updated = await prisma.shipCompliance.update({ where: { id }, data: toUpdateData(data) });
    return toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.shipCompliance.delete({ where: { id } });
  }
}

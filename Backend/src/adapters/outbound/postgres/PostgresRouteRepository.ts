import prisma from '../../../infrastructure/db/prismaClient';
import { RouteRepository } from '../../../core/ports/RouteRepository';
import { Route, CreateRouteInput, UpdateRouteInput } from '../../../core/domain/Route';

export class PostgresRouteRepository implements RouteRepository {
  async findAll(): Promise<Route[]> {
    return prisma.route.findMany();
  }

  async findById(id: string): Promise<Route | null> {
    return prisma.route.findUnique({ where: { id } });
  }

  async create(data: CreateRouteInput): Promise<Route> {
    return prisma.route.create({ data });
  }

  async update(id: string, data: UpdateRouteInput): Promise<Route> {
    return prisma.route.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.route.delete({ where: { id } });
  }
}

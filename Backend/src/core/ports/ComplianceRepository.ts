import { Compliance, CreateComplianceInput, UpdateComplianceInput } from '../domain/Compliance';

/**
 * ComplianceRepository Port
 * Defines the contract for compliance data persistence.
 * Adapters must implement this interface.
 */
export interface ComplianceRepository {
  findAll(): Promise<Compliance[]>;
  findById(id: string): Promise<Compliance | null>;
  findByRouteId(routeId: string): Promise<Compliance[]>;
  findByShipName(shipName: string): Promise<Compliance[]>;
  findByYear(year: number): Promise<Compliance[]>;
  create(data: CreateComplianceInput): Promise<Compliance>;
  update(id: string, data: UpdateComplianceInput): Promise<Compliance>;
  delete(id: string): Promise<void>;
}

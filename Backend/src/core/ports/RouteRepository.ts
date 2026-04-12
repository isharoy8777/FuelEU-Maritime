import { Route, CreateRouteInput, UpdateRouteInput } from '../domain/Route';

/**
 * RouteRepository Port
 * Defines the contract for route data persistence.
 * Adapters must implement this interface.
 */
export interface RouteRepository {
  findAll(): Promise<Route[]>;
  findById(id: string): Promise<Route | null>;
  create(data: CreateRouteInput): Promise<Route>;
  update(id: string, data: UpdateRouteInput): Promise<Route>;
  delete(id: string): Promise<void>;
}

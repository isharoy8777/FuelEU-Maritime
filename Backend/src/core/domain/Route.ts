/**
 * Route Domain Entity
 * Pure domain model — no database or framework dependencies.
 */
export interface Route {
  id: string;
  shipName: string;
  departurePort: string;
  arrivalPort: string;
  distance: number;
  fuelType: string;
  fuelConsumption: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateRouteInput = Omit<Route, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateRouteInput = Partial<CreateRouteInput>;

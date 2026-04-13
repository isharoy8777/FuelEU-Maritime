/**
 * Route Domain Entity
 * Pure domain model — no database or framework dependencies.
 */
export interface Route {
  id: string;
  routeId?: string;
  shipName: string;
  vesselType?: string;
  fuelType: string;
  year?: number;
  ghgIntensity?: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions?: number;
  isBaseline?: boolean;
  departurePort?: string;
  arrivalPort?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CreateRouteInput = Omit<Route, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateRouteInput = Partial<CreateRouteInput>;

export const TARGET_GHG_INTENSITY_2025 = 89.3368;

export interface RouteMeta {
  vesselType: string;
  year: number;
  ghgIntensity: number;
  totalEmissions: number;
}

const ROUTE_META_BY_ID: Record<string, RouteMeta> = {
  R001: { vesselType: 'Container', year: 2024, ghgIntensity: 91.0, totalEmissions: 4500 },
  R002: { vesselType: 'BulkCarrier', year: 2024, ghgIntensity: 88.0, totalEmissions: 4200 },
  R003: { vesselType: 'Tanker', year: 2024, ghgIntensity: 93.5, totalEmissions: 4700 },
  R004: { vesselType: 'RoRo', year: 2025, ghgIntensity: 89.2, totalEmissions: 4300 },
  R005: { vesselType: 'Container', year: 2025, ghgIntensity: 90.5, totalEmissions: 4400 },
};

const ROUTE_META_BY_SHIP_NAME: Record<string, RouteMeta> = {
  'MV Nordic Spirit': { vesselType: 'Container', year: 2025, ghgIntensity: 91.0, totalEmissions: 4500 },
  'SS Green Horizon': { vesselType: 'BulkCarrier', year: 2025, ghgIntensity: 88.0, totalEmissions: 4200 },
  'MV Atlantic Voyager': { vesselType: 'Tanker', year: 2025, ghgIntensity: 93.5, totalEmissions: 4700 },
  'SS Pacific Star': { vesselType: 'RoRo', year: 2025, ghgIntensity: 89.2, totalEmissions: 4300 },
  'MV Euro Carrier': { vesselType: 'Container', year: 2025, ghgIntensity: 90.5, totalEmissions: 4400 },
  'Container Alpha': { vesselType: 'Container', year: 2024, ghgIntensity: 91.0, totalEmissions: 4500 },
  'BulkCarrier Beta': { vesselType: 'BulkCarrier', year: 2024, ghgIntensity: 88.0, totalEmissions: 4200 },
  'Tanker Gamma': { vesselType: 'Tanker', year: 2024, ghgIntensity: 93.5, totalEmissions: 4700 },
  'RoRo Delta': { vesselType: 'RoRo', year: 2025, ghgIntensity: 89.2, totalEmissions: 4300 },
  'Container Epsilon': { vesselType: 'Container', year: 2025, ghgIntensity: 90.5, totalEmissions: 4400 },
};

export function resolveRouteMeta(routeId: string, shipName?: string): RouteMeta {
  return ROUTE_META_BY_ID[routeId] ?? (shipName ? ROUTE_META_BY_SHIP_NAME[shipName] : undefined) ?? {
    vesselType: 'Unknown',
    year: 2025,
    ghgIntensity: TARGET_GHG_INTENSITY_2025,
    totalEmissions: 0,
  };
}

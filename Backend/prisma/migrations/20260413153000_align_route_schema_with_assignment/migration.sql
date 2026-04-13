-- Add assignment-aligned route columns
ALTER TABLE "routes" ADD COLUMN "route_id" TEXT;
ALTER TABLE "routes" ADD COLUMN "vesselType" TEXT;
ALTER TABLE "routes" ADD COLUMN "year" INTEGER;
ALTER TABLE "routes" ADD COLUMN "ghg_intensity" DOUBLE PRECISION;
ALTER TABLE "routes" ADD COLUMN "totalEmissions" DOUBLE PRECISION;
ALTER TABLE "routes" ADD COLUMN "is_baseline" BOOLEAN NOT NULL DEFAULT false;

-- Backfill existing rows from the current seed data / legacy names.
UPDATE "routes"
SET
  "route_id" = CASE "shipName"
    WHEN 'MV Nordic Spirit' THEN 'R001'
    WHEN 'SS Green Horizon' THEN 'R002'
    WHEN 'MV Atlantic Voyager' THEN 'R003'
    WHEN 'SS Pacific Star' THEN 'R004'
    WHEN 'MV Euro Carrier' THEN 'R005'
    WHEN 'Container Alpha' THEN 'R001'
    WHEN 'BulkCarrier Beta' THEN 'R002'
    WHEN 'Tanker Gamma' THEN 'R003'
    WHEN 'RoRo Delta' THEN 'R004'
    WHEN 'Container Epsilon' THEN 'R005'
    ELSE "id"
  END,
  "vesselType" = CASE "shipName"
    WHEN 'MV Nordic Spirit' THEN 'Container'
    WHEN 'SS Green Horizon' THEN 'BulkCarrier'
    WHEN 'MV Atlantic Voyager' THEN 'Tanker'
    WHEN 'SS Pacific Star' THEN 'RoRo'
    WHEN 'MV Euro Carrier' THEN 'Container'
    WHEN 'Container Alpha' THEN 'Container'
    WHEN 'BulkCarrier Beta' THEN 'BulkCarrier'
    WHEN 'Tanker Gamma' THEN 'Tanker'
    WHEN 'RoRo Delta' THEN 'RoRo'
    WHEN 'Container Epsilon' THEN 'Container'
    ELSE 'Unknown'
  END,
  "year" = CASE "shipName"
    WHEN 'MV Nordic Spirit' THEN 2025
    WHEN 'SS Green Horizon' THEN 2025
    WHEN 'MV Atlantic Voyager' THEN 2025
    WHEN 'SS Pacific Star' THEN 2025
    WHEN 'MV Euro Carrier' THEN 2025
    WHEN 'Container Alpha' THEN 2024
    WHEN 'BulkCarrier Beta' THEN 2024
    WHEN 'Tanker Gamma' THEN 2024
    WHEN 'RoRo Delta' THEN 2025
    WHEN 'Container Epsilon' THEN 2025
    ELSE 2025
  END,
  "ghg_intensity" = CASE "shipName"
    WHEN 'MV Nordic Spirit' THEN 91.0
    WHEN 'SS Green Horizon' THEN 88.0
    WHEN 'MV Atlantic Voyager' THEN 93.5
    WHEN 'SS Pacific Star' THEN 89.2
    WHEN 'MV Euro Carrier' THEN 90.5
    WHEN 'Container Alpha' THEN 91.0
    WHEN 'BulkCarrier Beta' THEN 88.0
    WHEN 'Tanker Gamma' THEN 93.5
    WHEN 'RoRo Delta' THEN 89.2
    WHEN 'Container Epsilon' THEN 90.5
    ELSE 89.3368
  END,
  "totalEmissions" = CASE "shipName"
    WHEN 'MV Nordic Spirit' THEN 4500
    WHEN 'SS Green Horizon' THEN 4200
    WHEN 'MV Atlantic Voyager' THEN 4700
    WHEN 'SS Pacific Star' THEN 4300
    WHEN 'MV Euro Carrier' THEN 4400
    WHEN 'Container Alpha' THEN 4500
    WHEN 'BulkCarrier Beta' THEN 4200
    WHEN 'Tanker Gamma' THEN 4700
    WHEN 'RoRo Delta' THEN 4300
    WHEN 'Container Epsilon' THEN 4400
    ELSE 0
  END,
  "is_baseline" = CASE "shipName"
    WHEN 'MV Nordic Spirit' THEN true
    WHEN 'Container Alpha' THEN true
    ELSE false
  END;

-- Make the new columns required once existing rows are populated.
ALTER TABLE "routes" ALTER COLUMN "route_id" SET NOT NULL;
ALTER TABLE "routes" ALTER COLUMN "vesselType" SET NOT NULL;
ALTER TABLE "routes" ALTER COLUMN "year" SET NOT NULL;
ALTER TABLE "routes" ALTER COLUMN "ghg_intensity" SET NOT NULL;
ALTER TABLE "routes" ALTER COLUMN "totalEmissions" SET NOT NULL;

-- Enforce route_id uniqueness after backfill.
CREATE UNIQUE INDEX "routes_route_id_key" ON "routes"("route_id");

-- Remove legacy columns that are no longer needed.
ALTER TABLE "routes" DROP COLUMN "departurePort";
ALTER TABLE "routes" DROP COLUMN "arrivalPort";
ALTER TABLE "routes" DROP COLUMN "startDate";
ALTER TABLE "routes" DROP COLUMN "endDate";

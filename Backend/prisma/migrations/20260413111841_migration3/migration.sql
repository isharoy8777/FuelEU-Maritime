/*
  Warnings:

  - You are about to drop the column `amount` on the `bank_entries` table. All the data in the column will be lost.
  - You are about to drop the column `complianceBalance` on the `pool_members` table. All the data in the column will be lost.
  - You are about to drop the column `poolId` on the `pool_members` table. All the data in the column will be lost.
  - You are about to drop the `ship_compliances` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `amount_gco2eq` to the `bank_entries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ship_id` to the `bank_entries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cb_after` to the `pool_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cb_before` to the `pool_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pool_id` to the `pool_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ship_id` to the `pool_members` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "pool_members" DROP CONSTRAINT "pool_members_poolId_fkey";

-- DropForeignKey
ALTER TABLE "ship_compliances" DROP CONSTRAINT "ship_compliances_routeId_fkey";

-- AlterTable
ALTER TABLE "bank_entries" DROP COLUMN "amount",
ADD COLUMN     "amount_gco2eq" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "ship_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "pool_members" DROP COLUMN "complianceBalance",
DROP COLUMN "poolId",
ADD COLUMN     "cb_after" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "cb_before" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "pool_id" TEXT NOT NULL,
ADD COLUMN     "ship_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "ship_compliances";

-- CreateTable
CREATE TABLE "ship_compliance" (
    "id" TEXT NOT NULL,
    "ship_id" TEXT NOT NULL,
    "shipName" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "cb_gco2eq" DOUBLE PRECISION NOT NULL,
    "actualGHGIntensity" DOUBLE PRECISION NOT NULL,
    "targetGHGIntensity" DOUBLE PRECISION NOT NULL,
    "energy" DOUBLE PRECISION NOT NULL,
    "complianceBalance" DOUBLE PRECISION NOT NULL,
    "status" "ComplianceStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ship_compliance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ship_compliance" ADD CONSTRAINT "ship_compliance_ship_id_fkey" FOREIGN KEY ("ship_id") REFERENCES "routes"("route_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_members" ADD CONSTRAINT "pool_members_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.poolMember.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.bankEntry.deleteMany();
  await prisma.shipCompliance.deleteMany();
  await prisma.route.deleteMany();

  const routeSeed = [
    { id: 'R001', shipName: 'Container Alpha', distance: 12000, fuelType: 'HFO', fuelConsumption: 5000, year: 2024, ghg: 91.0 },
    { id: 'R002', shipName: 'BulkCarrier Beta', distance: 11500, fuelType: 'LNG', fuelConsumption: 4800, year: 2024, ghg: 88.0 },
    { id: 'R003', shipName: 'Tanker Gamma', distance: 12500, fuelType: 'MGO', fuelConsumption: 5100, year: 2024, ghg: 93.5 },
    { id: 'R004', shipName: 'RoRo Delta', distance: 11800, fuelType: 'HFO', fuelConsumption: 4900, year: 2025, ghg: 89.2 },
    { id: 'R005', shipName: 'Container Epsilon', distance: 11900, fuelType: 'LNG', fuelConsumption: 4950, year: 2025, ghg: 90.5 },
  ];

  const TARGET = 89.3368;
  const routes = await Promise.all(routeSeed.map((r) => prisma.route.create({
    data: {
      id: r.id,
      routeId: r.id,
      shipName: r.shipName,
      vesselType: r.id === 'R001' ? 'Container' : r.id === 'R002' ? 'BulkCarrier' : r.id === 'R003' ? 'Tanker' : r.id === 'R004' ? 'RoRo' : 'Container',
      distance: r.distance,
      fuelType: r.fuelType,
      fuelConsumption: r.fuelConsumption,
      year: r.year,
      ghgIntensity: r.ghg,
      totalEmissions: r.id === 'R001' ? 4500 : r.id === 'R002' ? 4200 : r.id === 'R003' ? 4700 : r.id === 'R004' ? 4300 : 4400,
      isBaseline: r.id === 'R001',
    },
  })));

  await Promise.all(routeSeed.map((r) => {
    const energy = r.fuelConsumption * 41_000;
    const complianceBalance = (TARGET - r.ghg) * energy;
    return prisma.shipCompliance.create({
      data: {
        routeId: r.id,
        shipName: r.shipName,
        actualGHGIntensity: r.ghg,
        targetGHGIntensity: TARGET,
        energy,
        complianceBalance,
        status: complianceBalance >= 0 ? 'SURPLUS' : 'DEFICIT',
        year: r.year,
      },
    });
  }));

  console.log(`✅ Seeded ${routes.length} routes:`);
  routes.forEach((r) => {
    console.log(`   🚢 ${r.id} ${r.shipName}`);
  });

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

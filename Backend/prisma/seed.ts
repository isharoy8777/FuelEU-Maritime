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

  // ─── Seed 5 Routes ─────────────────────────────────────────
  const routes = await Promise.all([
    prisma.route.create({
      data: {
        shipName: 'MV Nordic Spirit',
        departurePort: 'Rotterdam',
        arrivalPort: 'Shanghai',
        distance: 10500,
        fuelType: 'VLSFO',
        fuelConsumption: 2800,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-02-12'),
      },
    }),
    prisma.route.create({
      data: {
        shipName: 'SS Green Horizon',
        departurePort: 'Singapore',
        arrivalPort: 'Hamburg',
        distance: 8800,
        fuelType: 'LNG',
        fuelConsumption: 1900,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-25'),
      },
    }),
    prisma.route.create({
      data: {
        shipName: 'MV Atlantic Voyager',
        departurePort: 'New York',
        arrivalPort: 'Antwerp',
        distance: 3500,
        fuelType: 'MGO',
        fuelConsumption: 950,
        startDate: new Date('2025-02-10'),
        endDate: new Date('2025-02-22'),
      },
    }),
    prisma.route.create({
      data: {
        shipName: 'SS Pacific Star',
        departurePort: 'Tokyo',
        arrivalPort: 'Los Angeles',
        distance: 5500,
        fuelType: 'VLSFO',
        fuelConsumption: 1600,
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-18'),
      },
    }),
    prisma.route.create({
      data: {
        shipName: 'MV Euro Carrier',
        departurePort: 'Piraeus',
        arrivalPort: 'Jeddah',
        distance: 1800,
        fuelType: 'Bio-LNG',
        fuelConsumption: 420,
        startDate: new Date('2025-05-05'),
        endDate: new Date('2025-05-12'),
      },
    }),
  ]);

  console.log(`✅ Seeded ${routes.length} routes:`);
  routes.forEach((r) => {
    console.log(`   🚢 ${r.shipName}: ${r.departurePort} → ${r.arrivalPort}`);
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

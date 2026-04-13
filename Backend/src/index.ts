import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './infrastructure/server';
import { prisma } from './infrastructure/db';

const PORT = process.env.PORT || 3001;

async function main(): Promise<void> {
  // Verify database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  const app = createApp();

  app.listen(PORT, () => {
    console.log(`🚀 FuelEU Maritime API running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

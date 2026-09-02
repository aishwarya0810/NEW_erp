import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is missing.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export const connectDB = async (): Promise<void> => {
  try {
    // Execute a simple query to verify connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('PostgreSQL Connected via Prisma Client Adapter successfully.');
  } catch (error: any) {
    console.error('PostgreSQL Connection Error:', error.message);
    process.exit(1);
  }
};

// src/lib/prisma.js
import { PrismaClient } from '../generated/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

// 1. Wrap the pool and client creation in a singleton function
const prismaClientSingleton = () => {
  const pool = new pg.Pool({ 
    connectionString,
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
  });

  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ adapter });
};

// 2. Use globalThis (standard in Node.js)
const globalForPrisma = globalThis;

// 3. Only invoke the singleton if the client doesn't already exist globally
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// 4. In development, save the client to the global object so it survives hot-reloads
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
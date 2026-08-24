import { PrismaClient } from '@prisma/client';

declare global {
  var prismaSingleton: PrismaClient | undefined;
}

export const prisma =
  global.prismaSingleton ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prismaSingleton = prisma;
}

export default prisma;

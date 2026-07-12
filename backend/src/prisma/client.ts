import { PrismaClient } from '@prisma/client';
import { config } from '../config';

declare global {
  // Allow global prisma reference to avoid multiple instances in development hot-reloads
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (config.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

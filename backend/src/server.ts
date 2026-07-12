import app from './app';
import { config } from './config';
import { prisma } from './prisma/client';

async function bootstrap() {
  try {
    // Attempt database connection check on startup
    await prisma.$connect();
    console.log('✅ Database connection established successfully via Prisma');

    const server = app.listen(config.PORT, () => {
      console.log(`🚀 TransitOps Authentication server running on http://localhost:${config.PORT} in ${config.NODE_ENV} mode`);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down HTTP server and Prisma client connection...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('👋 Database connection closed and HTTP server stopped safely');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Database connection or server initialization failed:', error);
    process.exit(1);
  }
}

bootstrap();

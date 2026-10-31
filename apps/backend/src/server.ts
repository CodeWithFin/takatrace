import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';

import { authRoutes } from './routes/auth';
import { scanRoutes } from './routes/scans';
import { walletRoutes } from './routes/wallet';
import { db } from './db/client';

const app = Fastify({ logger: { level: 'info' } });

async function bootstrap() {
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'takatrace-dev-secret-change-in-prod',
    sign: { expiresIn: '30d' },
  });

  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(scanRoutes, { prefix: '/scans' });
  await app.register(walletRoutes, { prefix: '/wallet' });

  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  const port = parseInt(process.env.PORT || '3001');
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`TakaTrace backend running on :${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

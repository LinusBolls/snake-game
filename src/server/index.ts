import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyStatic from '@fastify/static';
import { randomUUID } from 'crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifySocketIO from 'fastify-socket.io';
import path from 'path';
import type { Server } from 'socket.io';

import { env } from './env';
import { generateJWT, verifyJWT } from './jwt';
import { leaderboard } from './leaderboard';
import { initSocketHandlers } from './socketService';

export async function buildFastify(): Promise<FastifyInstance> {
  const app = Fastify() as unknown as FastifyInstance & { io: Server };

  await app.register(fastifyCors, { origin: env.corsOrigins });
  await app.register(fastifyHelmet);
  await app.register(fastifySocketIO);

  app.register(fastifyStatic, {
    root: path.join(__dirname, '../../static'),
  });

  app.ready((err) => {
    if (err) throw err;

    initSocketHandlers(app.io);
  });

  app.post('/join', async (req, reply) => {
    const playerId = randomUUID();

    const token = await generateJWT(playerId);

    reply.send({ data: { token, playerId } });
  });

  app.get('/highscores', async (req, reply) => {
    const token = req.headers.authorization;

    if (!token) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }
    const { sub: playerId } = await verifyJWT(token);

    reply.send({
      data: {
        all: leaderboard.getTop(10),
        personalBest: leaderboard.getBestByPlayerId(playerId),
      },
    });
  });
  return app;
}

async function main(): Promise<void> {
  const app = await buildFastify();

  // host: '0.0.0.0' is required for Docker
  app.listen({ port: env.port, host: '0.0.0.0' }, (err) => {
    if (err) throw err;

    // eslint-disable-next-line no-console
    console.info('listening at http://localhost:' + env.port);
  });
}
main();

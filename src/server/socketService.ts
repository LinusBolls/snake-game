import colorString from 'color-string';
import { Server, Socket } from 'socket.io';

import { Game, isValidDirection } from '../game';
import type { ClientToServerEvents, ServerToClientEvents } from '../socket';
import { verifyJWT } from './jwt';
import { leaderboard } from './leaderboard';

const game = new Game(60, 37);

leaderboard.load();

game.events.on('playerDeath', (data) => {
  leaderboard.addScore(
    data.player.id,
    data.player.name,
    data.player.score,
    data.cause
  );
});

type SocketType = Socket<ClientToServerEvents, ServerToClientEvents> & {
  playerId: string;
};

const isValidHTMLColor = (str: string): boolean => {
  return colorString.get(str) !== null;
};

export function initSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  const sockets = new Set<Socket<ClientToServerEvents, ServerToClientEvents>>();

  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Missing JWT'));
      }
      const payload = await verifyJWT(token);

      (socket as SocketType).playerId = payload.sub;
      next();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      next(new Error('Invalid JWT'));
    }
  });

  io.on(
    'connection',
    (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
      sockets.add(socket);

      const playerId = (socket as SocketType).playerId;

      socket.on('spawn', (data) => {
        if (!game.hasPlayer(playerId)) {
          const color = isValidHTMLColor(data.color) ? data.color : 'lime';
          const name = data.name || 'Unknown';

          game.spawnPlayer(playerId, color, name);
        }
      });

      socket.on('turn', (data) => {
        if (isValidDirection(data.direction)) {
          game.setPlayerFacing(playerId, data.direction);
        }
      });

      socket.on('disconnect', () => {
        sockets.delete(socket);
      });

      socket.on('ping', () => {
        socket.emit('pong');
      });
    }
  );

  setInterval(() => {
    game.tick();

    for (const socket of sockets) {
      socket.emit('tick', {
        size: { width: game.width, height: game.height },
        snakes: game.players.map((i) => i.toJSON()),
        tiles: game.tiles.map((i) => i.toJSON()),
      });
    }
  }, 50);
}

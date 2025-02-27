import { Direction } from '../game';
import { GameClient } from './gameClient';
import { getPlayer, getSocket } from './getSocket';
import { type Leaderboard, Renderer } from './renderer';

async function getHighscores(token: string): Promise<Leaderboard> {
  const res = await fetch('/highscores', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch highscores');
  }
  const data = await res.json();

  return data.data;
}

async function init(): Promise<void> {
  const { token, playerId } = await getPlayer();

  const highscores = await getHighscores(token);

  const socket = await getSocket(token);

  socket.on('connect', () => {
    const game = new GameClient(socket, playerId);

    game.player.spawn({ name: 'linus', color: 'foo' });

    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'w':
        case 'ArrowUp':
          game.player.turn(Direction.UP);
          break;
        case 's':
        case 'ArrowDown':
          game.player.turn(Direction.DOWN);
          break;
        case 'a':
        case 'ArrowLeft':
          game.player.turn(Direction.LEFT);
          break;
        case 'd':
        case 'ArrowRight':
          game.player.turn(Direction.RIGHT);
          break;
      }
    });

    const canvas = document.querySelector<HTMLCanvasElement>(
      '[data-canvas="snake"]'
    )!;
    const renderer = new Renderer(canvas, game, highscores);

    renderer.init();

    // @ts-expect-error define new property on window object
    window.debug = (): void => {
      renderer.setDebug(!renderer.debug);
    };
  });
  socket.on('disconnect', () => {});
}
init();

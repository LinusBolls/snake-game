import { Direction } from '../game';
import { GameClient } from './gameClient';
import { getPlayer, getSocket } from './getSocket';
import { Leaderboard, type LeaderboardData } from './leaderboard';
import { Renderer } from './renderer';
import { UiState } from './uiState';

async function getHighscores(token: string): Promise<LeaderboardData> {
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

    const uiState = new UiState(game);

    game.events.on('playerDeath', (data) => {
      if (data.player.id === game.player.id) {
        uiState.setGameOver(data);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (uiState.isNameMenuOpen) {
        switch (e.key) {
          case 'Enter':
            uiState.goToStartMenu();
            break;
          case 'Escape':
            uiState.goToStartMenu();
            break;
          case 'Backspace':
            uiState.setUserName(uiState.userName?.slice(0, -1));
            break;
          default:
            // e.key can also be "Shift", "Control", "Alt", "Meta", "Tab", "CapsLock", "Dead", etc
            if (e.key.length === 1) {
              uiState.setUserName(uiState.userName + e.key);
            }
        }
        return;
      }
      switch (e.key) {
        case ' ':
          game.player.spawn({
            name: localStorage.getItem('snake:name') || 'Unknown',
            color: localStorage.getItem('snake:color') || 'lime',
          });
          break;
        case 'w':
        case 'ArrowUp':
          if (game.player.isPlaying) {
            game.player.turn(Direction.UP);
          } else {
            uiState.handlePreviousOption();
          }
          break;
        case 's':
        case 'ArrowDown':
          if (game.player.isPlaying) {
            game.player.turn(Direction.DOWN);
          } else {
            uiState.handleNextOption();
          }
          break;
        case 'a':
        case 'ArrowLeft':
          game.player.turn(Direction.LEFT);
          break;
        case 'd':
        case 'ArrowRight':
          game.player.turn(Direction.RIGHT);
          break;

        case 'r':
          if (!game.player.isPlaying) {
            uiState.openNameMenu();
          }
          break;
        case 'c':
          if (!game.player.isPlaying) {
            uiState.openColorMenu();
          }
          break;
        case 'Enter':
          if (!game.player.isPlaying) {
            uiState.handleCurrentOption();
          }
          break;
        case 'Escape':
          if (!game.player.isPlaying) {
            uiState.goToStartMenu();
          }
          break;
      }
    });

    const canvas = document.querySelector<HTMLCanvasElement>(
      '[data-canvas="snake"]'
    )!;

    const renderer = new Renderer(
      canvas,
      game,
      new Leaderboard(game, highscores),
      uiState
    );

    renderer.init();

    // @ts-expect-error define new property on window object
    window.debug = (): void => {
      renderer.setDebug(!renderer.debug);
    };
  });
  socket.on('disconnect', () => {});
}
init();

import mitt from 'mitt';
import type { Socket } from 'socket.io-client';

import {
  type Direction,
  GameState,
  type PlayerDeath,
  type SerializedGameState,
  Tile,
} from '../game';
import type { ClientToServerEvents, ServerToClientEvents } from '../socket';

interface OurPlayer {
  id: string;
  isPlaying: boolean;
  snake?: SerializedGameState['snakes'][0];
  spawn: (data: { name: string; color: string }) => void;
  turn: (direction: Direction) => void;
}

export class GameClient {
  /** whether `GameClient.state` is defined. this automatically happens once the first message is received from the server. */
  public get isLoaded(): boolean {
    return this.state != null;
  }
  /** @ts-expect-error before the first message is received from the server, this is undefined. use `GameClient.isLoaded` to check for this. */
  public state: GameState;
  private socket: Socket<ServerToClientEvents, ClientToServerEvents>;

  /**
   * controls the snake the client is authenticated as.
   */
  public player: OurPlayer = {
    id: '',
    isPlaying: false,
    spawn: (data: { name: string; color: string }): void => {
      this.socket.emit('spawn', data);
    },
    turn: (direction: Direction): void => {
      this.socket.emit('turn', { direction });
    },
  };

  constructor(
    socket: Socket<ServerToClientEvents, ClientToServerEvents>,
    playerId: string
  ) {
    this.player.id = playerId;

    this.socket = socket;

    this.socket.on('playerDeath', (data) =>
      this.events.emit('playerDeath', data)
    );

    this.socket.on('tick', (data) => {
      const ourPlayer = data.snakes.find(
        (snake) => snake.id === this.player.id
      );

      if (ourPlayer) {
        this.player.snake = ourPlayer;
      }
      this.player.isPlaying = ourPlayer != null;

      this.state = GameState.fromJSON(data);

      this.events.emit('tick');
    });
    // this.socket.on("tileEaten", (data) => {
    //   this.events.emit("tileEaten", {
    //     tile: Tile.fromJSON(data.tile),
    //   });
    // });
  }

  public events = mitt<{
    tick: void;
    tileEaten: { tile: Tile };
    playerDeath: PlayerDeath;
  }>();

  private lastPing: {
    time: number;
    latency: number;
  } | null = null;

  public getPing(): number {
    if (
      this.lastPing != null &&
      performance.now() - this.lastPing.time < 5000
    ) {
      return this.lastPing.latency;
    }
    new Promise((resolve) => {
      const start = performance.now();

      this.socket.emit('ping');

      this.socket.on('pong', () => {
        this.lastPing = {
          time: performance.now(),
          latency: performance.now() - start,
        };
        resolve(performance.now() - start);
      });
    });
    return this.lastPing?.latency ?? 0;
  }
}

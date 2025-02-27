import mitt from 'mitt';

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export const getNextDirectionClockwise = (
  dir: Direction,
  steps = 1
): Direction => {
  const directions = [
    Direction.UP,
    Direction.RIGHT,
    Direction.DOWN,
    Direction.LEFT,
  ];

  const currentIndex = directions.indexOf(dir);

  return directions[(currentIndex + steps) % directions.length];
};

export const getOppositeDirection = (dir: Direction): Direction => {
  return getNextDirectionClockwise(dir, 2);
};

export const isValidDirection = (str: string): str is Direction => {
  return Object.values(Direction).includes(str as Direction);
};

class Position {
  public x: number;
  public y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public getCopy(): Position {
    return new Position(this.x, this.y);
  }

  public overlapsWith(positions: Position[]): boolean {
    return positions.some((i) => i.x === this.x && i.y === this.y);
  }

  public equals(other: Position): boolean {
    return this.x === other.x && this.y === other.y;
  }

  public isWithinBounds(bounds: { width: number; height: number }): boolean {
    return (
      this.x >= 0 &&
      this.x < bounds.width &&
      this.y >= 0 &&
      this.y < bounds.height
    );
  }
}

class SnakeSegment {
  public pos: Position;

  constructor(pos: Position) {
    this.pos = pos;
  }

  public getCopy(): SnakeSegment {
    return new SnakeSegment(this.pos.getCopy());
  }
}

class Snake {
  public get score(): number {
    return this.segments.length;
  }

  public toJSON(): SerializedGameState['snakes'][0] {
    return {
      id: this.id,
      score: this.score,
      pos: this.segments.map((i) => [i.pos.x, i.pos.y]),
      facing: this.facing,
      color: this.color,
      name: this.name,
    };
  }

  public id: string;
  public color: string;
  public facing: Direction;
  public segments: SnakeSegment[];

  constructor(
    id: string,
    segments: SnakeSegment[],
    facing: Direction,
    color: string,
    name: string
  ) {
    this.id = id;
    this.color = color;
    this.facing = facing;
    this.segments = segments;
    this.name = name;
  }

  public canFace(facing: Direction): boolean {
    return facing !== getOppositeDirection(this.facing);
  }

  public isWithinBounds(bounds: { width: number; height: number }): boolean {
    return this.segments.every((segment) => segment.pos.isWithinBounds(bounds));
  }

  public name: string;

  public static fromSpawnPosition(
    id: string,
    pos: Position,
    length: number,
    facing: Direction,
    color: string,
    name: string
  ): Snake {
    const segments = [];

    for (let i = 0; i < length; i++) {
      segments.push(new SnakeSegment(pos.getCopy()));
    }
    return new Snake(id, segments, facing, color, name);
  }

  public get head(): SnakeSegment {
    return this.segments[0];
  }

  public setFacing(facing: Direction): Snake {
    this.facing = facing;

    return this;
  }

  public getNextPosition(): Snake {
    const newHead = new SnakeSegment(this.head.pos.getCopy());

    const newSegments = [
      newHead,
      ...this.segments.map((i) => i.getCopy()).slice(0, -1),
    ];

    switch (this.facing) {
      case Direction.UP:
        newHead.pos.y--;
        break;
      case Direction.DOWN:
        newHead.pos.y++;
        break;
      case Direction.LEFT:
        newHead.pos.x--;
        break;
      case Direction.RIGHT:
        newHead.pos.x++;
        break;
    }
    return new Snake(this.id, newSegments, this.facing, this.color, this.name);
  }
  public move(): Snake {
    this.segments = this.getNextPosition().segments;

    return this;
  }

  public bodyOverlapsWith(pos: Position): boolean {
    return pos.overlapsWith(this.segments.map((i) => i.pos).slice(1));
  }
  public overlapsWith(pos: Position): boolean {
    return pos.overlapsWith(this.segments.map((i) => i.pos));
  }

  public addSegment(): Snake {
    const lastSegment = this.segments[this.segments.length - 1];

    this.segments.push(lastSegment.getCopy());

    return this;
  }
}

export abstract class Tile {
  public type: string;
  public pos: Position;

  constructor(type: string, pos: Position) {
    this.type = type;
    this.pos = pos;
  }

  public toJSON(): SerializedGameState['tiles'][0] {
    return {
      type: this.type,
      pos: [this.pos.x, this.pos.y],
    };
  }
}

class Apple extends Tile {
  constructor(pos: Position) {
    super('tile:apple', pos);
  }
}

export class Game {
  public events = mitt<{
    playerDeath: {
      player: { id: string; score: number; name: string; color: string };
      cause: string;
    };
  }>();

  public getMostFreeDirection(pos: Position): Direction {
    const directions = [
      Direction.UP,
      Direction.DOWN,
      Direction.LEFT,
      Direction.RIGHT,
    ];

    const directionsByDescendingFreeness = directions.sort((a, b) => {
      const countFree = (dir: Direction): number => {
        const newPos = pos.getCopy();

        let freeTiles = 0;
        let isBlocked = false;

        while (!isBlocked) {
          switch (dir) {
            case Direction.UP:
              newPos.y--;
              break;
            case Direction.DOWN:
              newPos.y++;
              break;
            case Direction.LEFT:
              newPos.x--;
              break;
            case Direction.RIGHT:
              newPos.x++;
              break;
          }
          isBlocked =
            this.players.some((j) => j.overlapsWith(newPos)) ||
            !newPos.isWithinBounds({ width: this.width, height: this.height });

          if (!isBlocked) {
            freeTiles += 1;
          }
        }
        return freeTiles;
      };
      return countFree(b) - countFree(a);
    });
    return directionsByDescendingFreeness[0];
  }
  public spawnPlayer(id: string, color: string, name: string): void {
    const pos = this.getRandomFreePos();
    const facing = this.getMostFreeDirection(pos);

    this.players.push(Snake.fromSpawnPosition(id, pos, 4, facing, color, name));
  }

  public getState(): SerializedGameState {
    return {
      size: { width: this.width, height: this.height },
      snakes: this.players.map((i) => i.toJSON()),
      tiles: this.tiles.map((i) => i.toJSON()),
    };
  }

  // @ts-expect-error this is always assigned by the init method
  public players: Snake[];
  // @ts-expect-error this is always assigned by the init method
  public tiles: Tile[];

  public width: number;
  public height: number;

  constructor(width = 10, height = 10) {
    this.width = width;
    this.height = height;

    this.init();
  }

  public getRandomFreePos(): Position {
    let pos: Position | null = null;

    while (
      !pos ||
      this.players.some((i) => i.overlapsWith(pos!)) ||
      this.tiles.some((i) => i.pos.equals(pos!))
    ) {
      pos = new Position(
        Math.floor(Math.random() * this.width),
        Math.floor(Math.random() * this.height)
      );
    }
    return pos;
  }

  public spawnApple(): void {
    this.tiles.push(new Apple(this.getRandomFreePos()));
  }

  public init(): void {
    this.playerMovedThisTick = {};
    this.tiles = [];
    this.players = [];

    this.spawnApple();
  }
  private onPlayerDeath(playerId: string, cause: string): void {
    const player = this.players.find((i) => i.id === playerId);

    if (!player) {
      throw new Error('Game.onPlayerDeath: player not found');
    }
    this.players = this.players.filter((i) => i.id !== playerId);

    this.events.emit('playerDeath', { player: player.toJSON(), cause });
  }
  public tick(): void {
    this.playerMovedThisTick = {};

    for (const player of this.players) {
      const otherPlayers = this.players.filter((i) => i !== player);

      player.move();

      if (player.bodyOverlapsWith(player.head.pos)) {
        this.onPlayerDeath(player.id, 'death:suicide');
        return;
      }
      for (const other of otherPlayers) {
        if (other.overlapsWith(player.head.pos)) {
          this.onPlayerDeath(player.id, 'death:kill');
          return;
        }
      }

      if (!player.isWithinBounds({ width: this.width, height: this.height })) {
        this.onPlayerDeath(player.id, 'death:wall');
        return;
      }

      const collisions = this.tiles.filter((i) =>
        i.pos.equals(player.head.pos)
      );
      for (const i of collisions) {
        if (i.type === 'tile:apple') {
          player.addSegment();
          this.tiles = this.tiles.filter((j) => j !== i);
          this.spawnApple();
        }
      }
    }
  }

  private playerMovedThisTick: Record<string, boolean> = {};

  public setPlayerFacing(playerId: string, direction: Direction): void {
    const player = this.players.find((i) => i.id === playerId);

    if (!player) return;

    const alreadyMoved = this.playerMovedThisTick[playerId] === true;

    if (
      !alreadyMoved &&
      direction !== player.facing &&
      player.canFace(direction)
    ) {
      player.setFacing(direction);
      this.playerMovedThisTick[playerId] = true;
    }
  }
  public hasPlayer(playerId: string): boolean {
    return this.players.some((i) => i.id === playerId);
  }
}

export interface SerializedGameState {
  size: { width: number; height: number };
  snakes: {
    id: string;
    score: number;
    color: string;
    pos: number[][];
    facing: Direction;
    name: string;
  }[];
  tiles: {
    pos: number[];
    type: string;
  }[];
}

export class GameState {
  public size: { width: number; height: number };
  public players: Snake[];
  public tiles: Tile[];

  constructor() {
    this.size = { width: 0, height: 0 };
    this.players = [];
    this.tiles = [];
  }

  public toJSON(): SerializedGameState {
    return {
      size: this.size,
      snakes: this.players.map((i) => i.toJSON()),
      tiles: this.tiles.map((i) => i.toJSON()),
    };
  }

  public static fromJSON(data: SerializedGameState): GameState {
    const state = new GameState();

    state.size = data.size;

    state.players = data.snakes.map((i) => {
      return new Snake(
        i.id,
        i.pos.map((j) => new SnakeSegment(new Position(j[0], j[1]))),
        i.facing,
        i.color,
        i.name
      );
    });
    state.tiles = data.tiles.map((i) => {
      return new Apple(new Position(i.pos[0], i.pos[1]));
    });
    return state;
  }
}
